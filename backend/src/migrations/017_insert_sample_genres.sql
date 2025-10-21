-- Insert sample genres data
SET NOCOUNT ON;
GO

-- Ensure we're using the correct database
-- Removed explicit USE to allow running inside transactional migrator
-- (Connection already targets the correct database)
GO

-- Insert sample genres if they don't exist
IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Hành động')
INSERT INTO dbo.genres (name) VALUES (N'Hành động');

IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Hài hước')
INSERT INTO dbo.genres (name) VALUES (N'Hài hước');

IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Chính kịch')
INSERT INTO dbo.genres (name) VALUES (N'Chính kịch');

IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Kinh dị')
INSERT INTO dbo.genres (name) VALUES (N'Kinh dị');

IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Lãng mạn')
INSERT INTO dbo.genres (name) VALUES (N'Lãng mạn');

IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Khoa học viễn tưởng')
INSERT INTO dbo.genres (name) VALUES (N'Khoa học viễn tưởng');

IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Phiêu lưu')
INSERT INTO dbo.genres (name) VALUES (N'Phiêu lưu');

IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Bí ẩn')
INSERT INTO dbo.genres (name) VALUES (N'Bí ẩn');

IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Thriller')
INSERT INTO dbo.genres (name) VALUES (N'Thriller');

IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Tài liệu')
INSERT INTO dbo.genres (name) VALUES (N'Tài liệu');

IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Gia đình')
INSERT INTO dbo.genres (name) VALUES (N'Gia đình');

IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Hoạt hình')
INSERT INTO dbo.genres (name) VALUES (N'Hoạt hình');

IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Âm nhạc')
INSERT INTO dbo.genres (name) VALUES (N'Âm nhạc');

IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Chiến tranh')
INSERT INTO dbo.genres (name) VALUES (N'Chiến tranh');

IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Cổ trang')
INSERT INTO dbo.genres (name) VALUES (N'Cổ trang');

IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Hình sự')
INSERT INTO dbo.genres (name) VALUES (N'Hình sự');

IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Thể thao')
INSERT INTO dbo.genres (name) VALUES (N'Thể thao');

IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Western')
INSERT INTO dbo.genres (name) VALUES (N'Western');

IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Fantasy')
INSERT INTO dbo.genres (name) VALUES (N'Fantasy');

IF NOT EXISTS (SELECT 1 FROM dbo.genres WHERE name = N'Noir')
INSERT INTO dbo.genres (name) VALUES (N'Noir');

PRINT 'Sample genres inserted successfully';
GO
