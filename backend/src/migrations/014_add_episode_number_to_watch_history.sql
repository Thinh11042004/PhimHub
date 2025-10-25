-- Add episode_number column to watch_history table
-- Removed explicit USE to allow running inside transactional migrator
-- (Connection already targets the correct database)

-- Add episode_number column to watch_history table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.watch_history') AND name = 'episode_number')
BEGIN
    ALTER TABLE dbo.watch_history 
    ADD episode_number INT NULL;
    
    PRINT 'Added episode_number column to watch_history table';
END
ELSE
BEGIN
    PRINT 'episode_number column already exists in watch_history table';
END
GO

-- Add index for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.watch_history') AND name = 'IX_watch_history_episode')
BEGIN
    CREATE INDEX IX_watch_history_episode ON dbo.watch_history(episode_number);
    PRINT 'Added index for episode_number column';
END
ELSE
BEGIN
    PRINT 'Index for episode_number already exists';
END
GO
