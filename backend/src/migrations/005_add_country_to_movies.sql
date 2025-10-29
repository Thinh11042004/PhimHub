-- Migration: Add country column to movies table
-- This migration adds a country field to store the primary country of origin

SET NOCOUNT ON;
GO

USE [PhimHub];
GO

-- Check and add country column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'country')
BEGIN
    ALTER TABLE movies ADD country NVARCHAR(100) NULL;
    PRINT 'Added country column to movies table';
END
ELSE
BEGIN
    PRINT 'Country column already exists in movies table';
END
GO

-- Note: Cannot create index on NVARCHAR(100) column for country
-- Country column is for storing primary country of origin
-- Full-text search or application-level filtering should be used instead

PRINT 'Migration 005_add_country_to_movies completed successfully';
GO
