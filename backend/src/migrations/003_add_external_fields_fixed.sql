-- Migration: Add external fields to movies table (Fixed version)
-- This migration adds fields to support external API integration (PhimAPI, TMDB, IMDB)
-- with proper column existence checks

-- Check and add external_id column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'external_id')
BEGIN
    ALTER TABLE movies ADD external_id VARCHAR(255) NULL;
END

-- Check and add tmdb_id column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'tmdb_id')
BEGIN
    ALTER TABLE movies ADD tmdb_id VARCHAR(50) NULL;
END

-- Check and add imdb_id column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'imdb_id')
BEGIN
    ALTER TABLE movies ADD imdb_id VARCHAR(50) NULL;
END

-- Check and add original_title column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'original_title')
BEGIN
    ALTER TABLE movies ADD original_title VARCHAR(255) NULL;
END

-- Check and add banner_url column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'banner_url')
BEGIN
    ALTER TABLE movies ADD banner_url VARCHAR(500) NULL;
END

-- Check and add external_rating column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'external_rating')
BEGIN
    ALTER TABLE movies ADD external_rating DECIMAL(3,1) NULL;
END

-- Check and add external_rating_count column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'external_rating_count')
BEGIN
    ALTER TABLE movies ADD external_rating_count INT NULL;
END

-- Check and add external_view_count column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'external_view_count')
BEGIN
    ALTER TABLE movies ADD external_view_count INT NULL;
END

-- Check and add quality column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'quality')
BEGIN
    ALTER TABLE movies ADD quality VARCHAR(20) NULL;
END

-- Check and add language column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'language')
BEGIN
    ALTER TABLE movies ADD language VARCHAR(50) NULL;
END

-- Add indexes for better performance (with existence checks)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_movies_external_id' AND object_id = OBJECT_ID(N'[dbo].[movies]'))
BEGIN
    CREATE INDEX idx_movies_external_id ON movies(external_id);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_movies_tmdb_id' AND object_id = OBJECT_ID(N'[dbo].[movies]'))
BEGIN
    CREATE INDEX idx_movies_tmdb_id ON movies(tmdb_id);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_movies_imdb_id' AND object_id = OBJECT_ID(N'[dbo].[movies]'))
BEGIN
    CREATE INDEX idx_movies_imdb_id ON movies(imdb_id);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_movies_original_title' AND object_id = OBJECT_ID(N'[dbo].[movies]'))
BEGIN
    CREATE INDEX idx_movies_original_title ON movies(original_title);
END
