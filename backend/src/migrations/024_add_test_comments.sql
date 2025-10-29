-- Add test comments data
-- This migration adds sample comments to test the comment system

SET NOCOUNT ON;
GO

-- Check if we have users and contents
DECLARE @userCount INT, @contentCount INT;

SELECT @userCount = COUNT(*) FROM dbo.users;
SELECT @contentCount = COUNT(*) FROM dbo.contents;

PRINT 'Current data status:';
PRINT 'Users: ' + CAST(@userCount AS VARCHAR(10));
PRINT 'Contents: ' + CAST(@contentCount AS VARCHAR(10));

-- Only proceed if we have both users and contents
IF @userCount > 0 AND @contentCount > 0
BEGIN
    PRINT 'Adding test comments...';
    
    -- Get first user and first content
    DECLARE @userId INT, @contentId INT;
    SELECT TOP 1 @userId = id FROM dbo.users ORDER BY id;
    SELECT TOP 1 @contentId = id FROM dbo.contents ORDER BY id;
    
    PRINT 'Using User ID: ' + CAST(@userId AS VARCHAR(10));
    PRINT 'Using Content ID: ' + CAST(@contentId AS VARCHAR(10));
    
    -- Insert test comments
    INSERT INTO dbo.comments (user_id, content_id, content, created_at) VALUES
    (@userId, @contentId, N'Phim này hay quá! Tôi rất thích!', SYSUTCDATETIME()),
    (@userId, @contentId, N'Diễn viên diễn xuất rất tốt, cốt truyện hấp dẫn.', SYSUTCDATETIME()),
    (@userId, @contentId, N'Hiệu ứng đặc biệt tuyệt vời, đáng xem!', SYSUTCDATETIME()),
    (@userId, @contentId, N'Phim này có ý nghĩa sâu sắc, rất cảm động.', SYSUTCDATETIME()),
    (@userId, @contentId, N'Tôi đã xem nhiều lần rồi, vẫn thấy hay!', SYSUTCDATETIME());
    
    PRINT 'Added 5 test comments successfully!';
    
    -- Show the results
    SELECT 
        c.id,
        c.content,
        u.username,
        u.fullname,
        c.created_at
    FROM dbo.comments c
    INNER JOIN dbo.users u ON c.user_id = u.id
    ORDER BY c.created_at DESC;
    
END
ELSE
BEGIN
    PRINT 'Cannot add test comments:';
    IF @userCount = 0 PRINT '- No users found in database';
    IF @contentCount = 0 PRINT '- No contents found in database';
    PRINT 'Please ensure you have users and movies/episodes in the database first.';
END

PRINT 'Test comments migration completed.';
GO
