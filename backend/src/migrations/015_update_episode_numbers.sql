-- Update episode_number for existing watch_history records
-- Removed explicit USE to allow running inside transactional migrator
-- (Connection already targets the correct database)
GO

-- Update episode_number for series watch history
-- This will set episode_number based on the episode_id in contents table
UPDATE wh
SET episode_number = e.episode_number
FROM dbo.watch_history wh
INNER JOIN dbo.contents c ON wh.content_id = c.id
INNER JOIN dbo.episodes e ON c.episode_id = e.id
WHERE c.content_type = 'episode' 
  AND wh.episode_number IS NULL;

PRINT 'Updated episode_number for episode-based watch history records';

-- For movie-based watch history, keep episode_number as NULL
-- (This is already the case, but let's be explicit)
UPDATE wh
SET episode_number = NULL
FROM dbo.watch_history wh
INNER JOIN dbo.contents c ON wh.content_id = c.id
WHERE c.content_type = 'movie' 
  AND wh.episode_number IS NOT NULL;

PRINT 'Set episode_number to NULL for movie-based watch history records';

-- Show summary of updated records
SELECT 
    c.content_type,
    COUNT(*) as total_records,
    COUNT(wh.episode_number) as records_with_episode_number,
    COUNT(*) - COUNT(wh.episode_number) as records_without_episode_number
FROM dbo.watch_history wh
INNER JOIN dbo.contents c ON wh.content_id = c.id
GROUP BY c.content_type;

PRINT 'Watch history update completed';
GO
