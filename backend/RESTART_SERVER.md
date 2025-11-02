# Hướng dẫn khởi động lại Backend Server

## Vấn đề
Sau khi cập nhật file `.env`, backend server cần được khởi động lại để load các environment variables mới.

## Cách khởi động lại:

### Nếu server đang chạy:
1. Trong terminal đang chạy `npm run dev`, nhấn `Ctrl + C` để dừng server
2. Chạy lại: `npm run dev`

### Hoặc:
1. Dừng server (Ctrl + C)
2. Đảm bảo bạn đang ở thư mục `backend`
3. Chạy lại: 
```bash
cd backend
npm run dev
```

## Kiểm tra sau khi restart:
Khi server start, bạn sẽ thấy trong console:
```
📧 Email service: Configured
   Host: smtp.gmail.com
   Port: 587
   User: cao***
✅ Email service: SMTP connection verified
```

Nếu thấy thông báo này, email service đã được cấu hình đúng!

