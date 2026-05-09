# Báo cáo Dự án: Audio Extractor Tool (Premium Edition)

## 1. Tổng quan Dự án
**Audio Extractor Tool** là một ứng dụng web cao cấp cho phép người dùng trích xuất âm thanh chất lượng cao từ các nguồn video khác nhau (URL trực tuyến hoặc file cục bộ). Ứng dụng tập trung vào trải nghiệm người dùng mượt mà, tốc độ xử lý nhanh và khả năng tương thích cao với các trang web đặc thù.

## 2. Các Tính năng Chính
### a. Trích xuất từ URL (Online Extraction)
- **Hỗ trợ đa nền tảng**: Tích hợp `yt-dlp` để tải từ YouTube, TikTok, Facebook, Soundcloud...
- **Xử lý đặc biệt cho Suno.com**: Hệ thống tự động giải mã các link chia sẻ (sharing links) của Suno để lấy trực tiếp audio từ CDN, vượt qua các lớp bảo mật phức tạp.
- **Tùy chọn chất lượng**: Người dùng có thể chọn 3 mức bitrate: 128kbps, 192kbps, và 320kbps.

### b. Xử lý File Cục bộ (Local File Extraction)
- **Kéo và thả (Drag & Drop)**: Giao diện hỗ trợ kéo thả file video trực tiếp để xử lý.
- **Chuyển đổi bằng FFmpeg**: Sử dụng sức mạnh của FFmpeg để tách âm thanh từ bất kỳ định dạng video nào (.mp4, .mkv, .mov...) sang .mp3 chuẩn.

### c. Giao diện Người dùng (UI/UX)
- **Phong cách Glassmorphism**: Hiệu ứng kính mờ hiện đại, tinh tế.
- **Mesh Gradient Background**: Nền động đa sắc màu tạo cảm giác không gian sâu.
- **Phản hồi thời gian thực**: Thanh tiến trình và thông báo trạng thái giúp người dùng nắm bắt quá trình xử lý.

## 3. Kiến trúc Kỹ thuật
### Frontend (Client)
- **Framework**: React.js (Vite)
- **Styling**: Vanilla CSS (Premium Tokens)
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend (Server)
- **Runtime**: Node.js (Express)
- **Media Engines**: 
    - `ffmpeg-static` & `fluent-ffmpeg`: Xử lý nén và tách âm thanh.
    - `yt-dlp-exec`: Công cụ mạnh mẽ nhất hiện nay để tải nội dung trực tuyến.
- **Utilities**: `axios` (Giải mã link chuyển hướng), `multer` (Xử lý upload file).

## 4. Giải pháp Triển khai (Deployment)
### Tùy chọn 1: Docker (Khuyến nghị)
Sử dụng Docker giúp đóng gói toàn bộ dependencies (FFmpeg, Python) vào một môi trường nhất quán.
- **Phù hợp cho**: Render.com, Railway.app, Fly.io.

### Tùy chọn 2: VPS (Ubuntu Server)
1. Cài đặt Node.js và FFmpeg (`sudo apt install ffmpeg`).
2. Sử dụng `PM2` để quản lý tiến trình.
3. Cài đặt Nginx làm Reverse Proxy.

## 5. Định hướng Nâng cấp
- **Database (MongoDB/SQLite)**: Để lưu trữ lịch sử tải của người dùng.
- **Caching Layer**: Lưu trữ các file đã trích xuất từ URL phổ biến để trả kết quả ngay lập tức cho người dùng sau.
- **Batch Processing**: Cho phép người dùng tải lên nhiều link/file cùng lúc.

---
*Báo cáo được thực hiện bởi Antigravity AI Assistant.*
