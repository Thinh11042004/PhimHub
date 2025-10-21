-- Add test watch history data with episode numbers
-- Removed explicit USE to allow running inside transactional migrator
-- (Connection already targets the correct database)
GO

-- First, let's see what series and episodes we have
SELECT 
    m.id as movie_id,
    m.title,
    m.is_series,
    COUNT(e.id) as episode_count
FROM dbo.movies m
LEFT JOIN dbo.episodes e ON m.id = e.movie_id
WHERE m.is_series = 1
GROUP BY m.id, m.title, m.is_series
ORDER BY m.id;

-- Let's see what users we have
SELECT TOP 5 id, username, email FROM dbo.users ORDER BY id;

-- Let's see what contents we have
SELECT 
    c.id as content_id,
    c.content_type,
    m.title as movie_title,
    e.episode_number,
    e.title as episode_title
FROM dbo.contents c
LEFT JOIN dbo.movies m ON c.movie_id = m.id
LEFT JOIN dbo.episodes e ON c.episode_id = e.id
WHERE c.content_type = 'episode'
ORDER BY c.id;

-- Add test watch history for series episodes
-- (Replace user_id with actual user ID from your database)
DECLARE @test_user_id INT = (SELECT TOP 1 id FROM dbo.users ORDER BY id);

-- Clear existing test data (optional - comment out if you want to keep existing data)
-- DELETE FROM dbo.watch_history WHERE user_id = @test_user_id;

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

-- Show the results
SELECT 
    wh.id,
    wh.user_id,
    wh.content_id,
    wh.progress,
    wh.episode_number,
    c.content_type,
    m.title as movie_title,
    e.episode_number as actual_episode_number,
    e.title as episode_title
FROM dbo.watch_history wh
INNER JOIN dbo.contents c ON wh.content_id = c.id
LEFT JOIN dbo.movies m ON c.movie_id = m.id
LEFT JOIN dbo.episodes e ON c.episode_id = e.id
WHERE wh.user_id = @test_user_id
ORDER BY wh.id;

PRINT 'Test watch history data added successfully';
GO
