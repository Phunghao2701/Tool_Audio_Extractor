import React, { useState } from 'react';
import { Download, Link, Upload, Music, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Audio Extractor App
 * A React-based frontend for extracting audio from video links or uploaded files.
 */
function App() {
  // State management for UI and processing
  const [mode, setMode] = useState('url'); // Current mode: 'url' or 'file'
  const [url, setUrl] = useState(''); // Video URL input
  const [file, setFile] = useState(null); // Uploaded file object
  const [quality, setQuality] = useState('medium'); // Selected audio quality
  const [status, setStatus] = useState('idle'); // Processing status: 'idle', 'processing', 'success', 'error'
  const [message, setMessage] = useState(''); // Status message to display
  const [isDragging, setIsDragging] = useState(false); // Drag & drop state

  // Handle manual file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
    }
  };

  // Drag and drop event handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const selectedFile = e.dataTransfer.files[0];
    // Basic file type validation
    if (selectedFile && selectedFile.type.startsWith('video/')) {
      setFile(selectedFile);
      setStatus('idle');
    } else {
      setStatus('error');
      setMessage('Vui lòng chỉ kéo thả file video.');
    }
  };

  /**
   * Submit handler for both URL and File modes
   */
  const handleSubmit = async () => {
    if (mode === 'url' && !url) return;
    if (mode === 'file' && !file) return;

    setStatus('processing');
    setMessage('Đang trích xuất âm thanh... Vui lòng chờ.');

    try {
      let response;
      // Define the base URL. In development, it's localhost:5000. 
      // In production (when served by the server), it's relative.
      const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';

      if (mode === 'url') {
        // Extract audio from a URL
        response = await fetch(`${API_BASE}/api/extract-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, quality }),
        });
      } else {
        // Extract audio from an uploaded file
        const formData = new FormData();
        formData.append('video', file);
        formData.append('quality', quality);
        response = await fetch(`${API_BASE}/api/extract-file`, {
          method: 'POST',
          body: formData,
        });
      }

      if (!response.ok) throw new Error('Có lỗi xảy ra trong quá trình xử lý.');

      // Process the received blob (MP3 file)
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      // Set download filename
      a.download = mode === 'url' ? 'audio_extracted.mp3' : `${file.name.split('.')[0]}.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setStatus('success');
      setMessage('Trích xuất thành công! File đã được tải về.');
    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage(error.message || 'Lỗi kết nối đến server.');
    }
  };

  return (
    <div className="app-wrapper">
      {/* Dynamic background mesh effect */}
      <div className="bg-mesh">
        <div className="mesh-blob"></div>
      </div>
      
      <div className="app-container">
        <header>
          <motion.h1 
            className="title"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Audio Extractor
          </motion.h1>
          <p className="subtitle">Premium Audio Conversion Tool</p>
        </header>

      {/* Mode Toggle Tabs */}
      <div className="tabs">
        <button 
          className={`tab-btn ${mode === 'url' ? 'active' : ''}`}
          onClick={() => setMode('url')}
        >
          <Link size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          Từ Link
        </button>
        <button 
          className={`tab-btn ${mode === 'file' ? 'active' : ''}`}
          onClick={() => setMode('file')}
        >
          <Upload size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          Từ File
        </button>
      </div>

      {/* Input Section with Animations */}
      <AnimatePresence mode="wait">
        {mode === 'url' ? (
          <motion.div 
            key="url-mode"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="input-group"
          >
            <label className="label">Link Video (YouTube, Suno, etc.)</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="file-mode"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="input-group"
          >
            <label className="label">Tải lên Video</label>
            <div 
              className={`upload-area ${isDragging ? 'dragging' : ''}`} 
              onClick={() => document.getElementById('file-input').click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input 
                id="file-input"
                type="file" 
                hidden 
                accept="video/*"
                onChange={handleFileChange}
              />
              <Music size={40} color={isDragging ? '#a78bfa' : '#8b5cf6'} style={{ marginBottom: '12px' }} />
              <p>{file ? file.name : 'Nhấn để chọn video hoặc kéo thả vào đây'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quality Selection Grid */}
      <div className="input-group">
        <label className="label">Chất lượng Audio</label>
        <div className="quality-grid">
          {['low', 'medium', 'high'].map((q) => (
            <div 
              key={q}
              className={`quality-option ${quality === q ? 'selected' : ''}`}
              onClick={() => setQuality(q)}
            >
              <div style={{ fontWeight: 'bold' }}>{q.toUpperCase()}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                {q === 'low' ? '128kbps' : q === 'medium' ? '192kbps' : '320kbps'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Action Button */}
      <button 
        className="main-btn" 
        onClick={handleSubmit}
        disabled={status === 'processing' || (mode === 'url' ? !url : !file)}
      >
        {status === 'processing' ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <Download size={20} />
        )}
        {status === 'processing' ? 'Đang xử lý...' : 'Tải Audio Ngay'}
      </button>

      {/* Status Feedback Section */}
      {status !== 'idle' && (
        <motion.div 
          className={`status ${status}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {status === 'processing' && <div className="progress-container"><div className="progress-bar" style={{ width: '60%' }}></div></div>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
            {status === 'success' && <CheckCircle2 size={18} />}
            {status === 'error' && <AlertCircle size={18} />}
            {message}
          </div>
        </motion.div>
      )}
      </div>
    </div>
  );
}

export default App;

