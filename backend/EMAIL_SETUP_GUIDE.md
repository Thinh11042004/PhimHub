# Hướng dẫn cấu hình Email cho PhimHub (Gmail)

## Lỗi hiện tại: "Username and Password not accepted" (535)

Gmail không cho phép sử dụng mật khẩu tài khoản để đăng nhập SMTP. Bạn **PHẢI** sử dụng **App Password**.

## Các bước tạo App Password cho Gmail:

### Bước 1: Bật 2-Step Verification (Xác thực 2 bước)

1. Truy cập: https://myaccount.google.com/security
2. Tìm phần "How you sign in to Google"
3. Click vào "2-Step Verification"
4. Làm theo hướng dẫn để bật xác thực 2 bước
   - Bạn cần xác thực bằng điện thoại
   - Nhập mã xác thực từ Google

### Bước 2: Tạo App Password

1. Sau khi bật 2-Step Verification, quay lại: https://myaccount.google.com/security
2. Tìm phần "How you sign in to Google"
3. Click vào "App passwords" (hoặc truy cập trực tiếp: https://myaccount.google.com/apppasswords)
4. Nếu chưa thấy "App passwords":
   - Bạn cần đăng nhập lại tài khoản Google
   - Đảm bảo 2-Step Verification đã được bật
5. Trong "App passwords":
   - Select app: Chọn "Mail"
   - Select device: Chọn "Other (Custom name)"
   - Nhập tên: `PhimHub` (hoặc tên bạn muốn)
   - Click "Generate"
6. Google sẽ hiển thị một mật khẩu 16 ký tự như: `abcd efgh ijkl mnop`
   - **QUAN TRỌNG**: Copy toàn bộ 16 ký tự này (không có khoảng trắng, hoặc nếu có thì xóa khoảng trắng)
   - Đây là mật khẩu duy nhất, chỉ hiển thị 1 lần

### Bước 3: Cập nhật file .env

Mở file `backend/.env` và cập nhật:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com        # Email Gmail của bạn
EMAIL_PASS=abcdefghijklmnop            # App Password (16 ký tự, không có khoảng trắng)
EMAIL_FROM="PhimHub" <your-email@gmail.com>
```

**LƯU Ý QUAN TRỌNG:**
- `EMAIL_PASS` phải là App Password (16 ký tự), KHÔNG phải mật khẩu tài khoản
- Nếu Google hiển thị App Password có khoảng trắng (ví dụ: `abcd efgh ijkl mnop`), xóa hết khoảng trắng khi paste vào .env
- App Password chỉ chứa chữ cái và số, không có ký tự đặc biệt

### Bước 4: Test lại

Chạy lệnh test:

```bash
cd backend
npm run test:email
```

Nếu thành công, bạn sẽ thấy:
```
✅ SMTP connection verified successfully!
✅ Test email sent successfully!
```

## Troubleshooting

### Lỗi: "Username and Password not accepted"
- ✅ Đảm bảo đã bật 2-Step Verification
- ✅ Đảm bảo đang dùng App Password, không phải mật khẩu tài khoản
- ✅ Kiểm tra App Password có đúng 16 ký tự không
- ✅ Xóa khoảng trắng trong App Password nếu có
- ✅ Đảm bảo EMAIL_USER là email Gmail đầy đủ (có @gmail.com)

### Lỗi: "Connection timeout"
- Kiểm tra firewall/antivirus có chặn port 587 không
- Thử dùng port 465 với `EMAIL_PORT=465`

### Vẫn không được?
- Xóa App Password cũ và tạo lại
- Đảm bảo không có khoảng trắng thừa trong file .env
- Khởi động lại backend server sau khi cập nhật .env

