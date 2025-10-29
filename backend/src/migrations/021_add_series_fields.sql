-- Migration: Add series-specific fields to movies table
-- This migration adds fields to support TV series metadata

-- Check and add number_of_episodes column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'number_of_episodes')
BEGIN
    ALTER TABLE movies ADD number_of_episodes INT NULL;
END

-- Check and add number_of_seasons column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'number_of_seasons')
BEGIN
    ALTER TABLE movies ADD number_of_seasons INT NULL;
END

-- Check and add status column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'status')
BEGIN
    ALTER TABLE movies ADD status VARCHAR(50) NULL;
END

-- Check and add first_air_date column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'first_air_date')
BEGIN
    ALTER TABLE movies ADD first_air_date DATE NULL;
END

-- Check and add last_air_date column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'last_air_date')
BEGIN
    ALTER TABLE movies ADD last_air_date DATE NULL;
END

-- Check and add episode_run_time column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'episode_run_time')
BEGIN
    ALTER TABLE movies ADD episode_run_time INT NULL;
END

PRINT 'Series fields added to movies table successfully';
