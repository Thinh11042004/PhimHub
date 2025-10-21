-- Add test comments for series "Bọ Ngựa"
-- This migration adds sample external comments for the series

-- Get first user and insert test comments
DECLARE @userId INT;
SELECT TOP 1 @userId = id FROM dbo.users ORDER BY id;

-- Insert test external comments for series "Bọ Ngựa"
INSERT INTO dbo.external_comments (user_id, ext_key, content, parent_id, created_at) VALUES
(@userId, 'local:bo-ngua', N'Series này hay quá! Tôi rất thích!', NULL, SYSUTCDATETIME()),
(@userId, 'local:bo-ngua', N'Diễn viên diễn xuất rất tốt, cốt truyện hấp dẫn.', NULL, SYSUTCDATETIME()),
(@userId, 'local:bo-ngua', N'Hiệu ứng đặc biệt tuyệt vời, đáng xem!', NULL, SYSUTCDATETIME()),
(@userId, 'local:bo-ngua', N'Phim này có ý nghĩa sâu sắc, rất cảm động.', NULL, SYSUTCDATETIME()),
(@userId, 'local:bo-ngua', N'Tôi đã xem nhiều lần rồi, vẫn thấy hay!', NULL, SYSUTCDATETIME());
