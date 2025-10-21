-- Script to update watch_history table with episode_number support
-- Run this script in SQL Server Management Studio

USE [PhimHub];
GO

PRINT 'Starting watch_history update process...';
GO

-- Step 1: Add episode_number column
PRINT 'Step 1: Adding episode_number column...';
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.watch_history') AND name = 'episode_number')
BEGIN
    ALTER TABLE dbo.watch_history 
    ADD episode_number INT NULL;
    
    PRINT '✓ Added episode_number column to watch_history table';
END
ELSE
BEGIN
    PRINT '✓ episode_number column already exists in watch_history table';
END
GO

-- Step 2: Add index for better performance
PRINT 'Step 2: Adding index for episode_number...';
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.watch_history') AND name = 'IX_watch_history_episode')
BEGIN
    CREATE INDEX IX_watch_history_episode ON dbo.watch_history(episode_number);
    PRINT '✓ Added index for episode_number column';
END
ELSE
BEGIN
    PRINT '✓ Index for episode_number already exists';
END
GO

-- Step 3: Update existing records
PRINT 'Step 3: Updating existing watch_history records...';

-- Update episode_number for series watch history
UPDATE wh
SET episode_number = e.episode_number
FROM dbo.watch_history wh
INNER JOIN dbo.contents c ON wh.content_id = c.id
INNER JOIN dbo.episodes e ON c.episode_id = e.id
WHERE c.content_type = 'episode' 
  AND wh.episode_number IS NULL;

PRINT '✓ Updated episode_number for episode-based watch history records';

-- For movie-based watch history, keep episode_number as NULL
UPDATE wh
SET episode_number = NULL
FROM dbo.watch_history wh
INNER JOIN dbo.contents c ON wh.content_id = c.id
WHERE c.content_type = 'movie' 
  AND wh.episode_number IS NOT NULL;

PRINT '✓ Set episode_number to NULL for movie-based watch history records';
GO

-- Step 4: Add test data
PRINT 'Step 4: Adding test watch history data...';

DECLARE @test_user_id INT = (SELECT TOP 1 id FROM dbo.users ORDER BY id);
PRINT 'Using test user ID: ' + CAST(@test_user_id AS VARCHAR(10));

-- Add watch history for different episodes of series
-- Episode 1 - 25% progress
INSERT INTO dbo.watch_history (user_id, content_id, progress, device, episode_number)
SELECT 
    @test_user_id,
    c.id,
    25,
    'web',
    e.episode_number
FROM dbo.contents c
INNER JOIN dbo.episodes e ON c.episode_id = e.id
INNER JOIN dbo.movies m ON e.movie_id = m.id
WHERE c.content_type = 'episode' 
  AND e.episode_number = 1
  AND m.is_series = 1
  AND NOT EXISTS (
    SELECT 1 FROM dbo.watch_history wh 
    WHERE wh.user_id = @test_user_id AND wh.content_id = c.id
  );

-- Episode 2 - 50% progress
INSERT INTO dbo.watch_history (user_id, content_id, progress, device, episode_number)
SELECT 
    @test_user_id,
    c.id,
    50,
    'web',
    e.episode_number
FROM dbo.contents c
INNER JOIN dbo.episodes e ON c.episode_id = e.id
INNER JOIN dbo.movies m ON e.movie_id = m.id
WHERE c.content_type = 'episode' 
  AND e.episode_number = 2
  AND m.is_series = 1
  AND NOT EXISTS (
    SELECT 1 FROM dbo.watch_history wh 
    WHERE wh.user_id = @test_user_id AND wh.content_id = c.id
  );

-- Episode 3 - 75% progress
INSERT INTO dbo.watch_history (user_id, content_id, progress, device, episode_number)
SELECT 
    @test_user_id,
    c.id,
    75,
    'web',
    e.episode_number
FROM dbo.contents c
INNER JOIN dbo.episodes e ON c.episode_id = e.id
INNER JOIN dbo.movies m ON e.movie_id = m.id
WHERE c.content_type = 'episode' 
  AND e.episode_number = 3
  AND m.is_series = 1
  AND NOT EXISTS (
    SELECT 1 FROM dbo.watch_history wh 
    WHERE wh.user_id = @test_user_id AND wh.content_id = c.id
  );

-- Add watch history for movies (episode_number = NULL)
INSERT INTO dbo.watch_history (user_id, content_id, progress, device, episode_number)
SELECT 
    @test_user_id,
    c.id,
    30,
    'web',
    NULL
FROM dbo.contents c
INNER JOIN dbo.movies m ON c.movie_id = m.id
WHERE c.content_type = 'movie' 
  AND m.is_series = 0
  AND NOT EXISTS (
    SELECT 1 FROM dbo.watch_history wh 
    WHERE wh.user_id = @test_user_id AND wh.content_id = c.id
  );

PRINT '✓ Test watch history data added successfully';
GO

-- Step 5: Show results
PRINT 'Step 5: Showing updated watch_history data...';

SELECT 
    wh.id,
    wh.user_id,
    wh.content_id,
    wh.progress,
    wh.episode_number,
    c.content_type,
    m.title as movie_title,
    e.episode_number as actual_episode_number,
    e.title as episode_title,
    wh.last_watched_at
FROM dbo.watch_history wh
INNER JOIN dbo.contents c ON wh.content_id = c.id
LEFT JOIN dbo.movies m ON c.movie_id = m.id
LEFT JOIN dbo.episodes e ON c.episode_id = e.id
ORDER BY wh.id;

-- Show summary
SELECT 
    c.content_type,
    COUNT(*) as total_records,
    COUNT(wh.episode_number) as records_with_episode_number,
    COUNT(*) - COUNT(wh.episode_number) as records_without_episode_number
FROM dbo.watch_history wh
INNER JOIN dbo.contents c ON wh.content_id = c.id
GROUP BY c.content_type;

PRINT '✓ Watch history update completed successfully!';
PRINT 'You can now test the "Xem ngay" functionality with real episode numbers.';
GO
