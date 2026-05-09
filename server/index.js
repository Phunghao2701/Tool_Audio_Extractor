const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { exec } = require('yt-dlp-exec');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

// Configure FFmpeg to use the static binary provided by ffmpeg-static
ffmpeg.setFfmpegPath(ffmpegStatic);

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

/**
 * Ensure necessary directories exist for uploads and outputs.
 * uploads: stores temporary video files uploaded by the user.
 * output: stores the extracted MP3 files.
 */
const uploadDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

/**
 * Cleanup function to remove old files periodically (every 1 hour)
 * This prevents the server from running out of disk space.
 */
const cleanOldFiles = () => {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    [uploadDir, outputDir].forEach(dir => {
        fs.readdir(dir, (err, files) => {
            if (err) return;
            files.forEach(file => {
                const filePath = path.join(dir, file);
                fs.stat(filePath, (err, stats) => {
                    if (err) return;
                    if (now - stats.mtimeMs > maxAge) {
                        fs.unlink(filePath, () => {});
                    }
                });
            });
        });
    });
};
setInterval(cleanOldFiles, 60 * 60 * 1000);

// Multer configuration for handling file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ 
    storage,
    limits: { fileSize: 100 * 1024 * 1024 } // Limit file size to 100MB
});

// Serve static files from the React app's build directory
app.use(express.static(path.join(__dirname, '../client/dist')));

/**
 * API Endpoint: Extract audio from a URL (YouTube, Suno, etc.)
 * POST /api/extract-url
 * Body: { url: string, quality: 'low' | 'medium' | 'high' }
 */
app.post('/api/extract-url', async (req, res) => {
    const { url, quality } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    let targetUrl = url;
    // Map quality levels to bitrates
    const bitrate = quality === 'high' ? '320k' : quality === 'medium' ? '192k' : '128k';
    const outputFilename = `audio_${Date.now()}.mp3`;
    const outputPath = path.join(outputDir, outputFilename);

    try {
        /**
         * Special Handling for Suno.com
         * Suno links often redirect or have specific patterns.
         * We attempt to resolve the direct CDN link for better extraction.
         */
        if (url.includes('suno.com')) {
            console.log('Resolving Suno link...');
            try {
                const response = await axios.get(url, { 
                    maxRedirects: 5,
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
                });
                const finalUrl = response.request.res.responseUrl || url;
                const songIdMatch = finalUrl.match(/\/song\/([a-zA-Z0-9-]+)/);
                
                if (songIdMatch && songIdMatch[1]) {
                    targetUrl = `https://cdn1.suno.ai/${songIdMatch[1]}.mp3`;
                    console.log(`Resolved Suno ID: ${songIdMatch[1]}. Using direct CDN: ${targetUrl}`);
                }
            } catch (err) {
                console.warn('Suno resolution failed, attempting direct extraction:', err.message);
            }
        }

        const cookiesPath = path.join(__dirname, 'cookies.txt');
        const hasCookies = fs.existsSync(cookiesPath);

        console.log(`Extracting from URL: ${targetUrl} at ${bitrate}`);
        
        // Execute yt-dlp to extract audio
        await exec(targetUrl, {
            extractAudio: true,
            audioFormat: 'mp3',
            // yt-dlp audio quality: 0 is best, 9 is worst. We map high(0), medium(3), low(5)
            audioQuality: bitrate === '320k' ? '0' : bitrate === '192k' ? '3' : '5',
            output: outputPath,
            ffmpegLocation: ffmpegStatic,
            noCheckCertificates: true,
            noWarnings: true,
            noPlaylist: true,
            preferFreeFormats: true,
            cookie: hasCookies ? cookiesPath : undefined, // Add cookies if available
            addHeader: [
                'referer:https://suno.com/',
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        });

        // Send the file to the client for download
        res.download(outputPath, (err) => {
            if (err) console.error('Download error:', err);
            // Optional: delete file after download to save space
            // fs.unlink(outputPath, () => {});
        });
    } catch (error) {
        console.error('Extraction error:', error);
        res.status(500).json({ error: 'Failed to extract audio from URL', details: error.message });
    }
});

/**
 * API Endpoint: Extract audio from an uploaded video file
 * POST /api/extract-file
 * Body: FormData containing 'video' file and 'quality' string
 */
app.post('/api/extract-file', upload.single('video'), (req, res) => {
    const { quality } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const bitrate = quality === 'high' ? 320 : quality === 'medium' ? 192 : 128;
    const outputFilename = `audio_${Date.now()}.mp3`;
    const outputPath = path.join(outputDir, outputFilename);

    console.log(`Extracting from file: ${file.path} at ${bitrate}k`);

    // Use FFmpeg to convert video to MP3
    ffmpeg(file.path)
        .toFormat('mp3')
        .audioBitrate(bitrate)
        .on('end', () => {
            res.download(outputPath, (err) => {
                if (err) console.error('Download error:', err);
                // Clean up the uploaded video file
                fs.unlink(file.path, (e) => { if(e) console.error('Cleanup error:', e); });
            });
        })
        .on('error', (err) => {
            console.error('FFmpeg error:', err);
            res.status(500).json({ error: 'Failed to extract audio from file' });
            // Clean up on error as well
            fs.unlink(file.path, () => {});
        })
        .save(outputPath);
});

// Wildcard route to serve the React single-page application
app.get('*any', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

