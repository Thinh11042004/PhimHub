-- Migration: Add categories field to movies table
-- This migration adds a categories field to store genre slugs as comma-separated string
-- for compatibility with external APIs like PhimAPI

SET NOCOUNT ON;
GO

USE [PhimHub];
GO

-- Check and add categories column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'categories')
BEGIN
    ALTER TABLE movies ADD categories NVARCHAR(MAX) NULL;
    PRINT 'Added categories column to movies table';
END
ELSE
BEGIN
    PRINT 'Categories column already exists in movies table';
END
GO

-- Note: Cannot create index on NVARCHAR(MAX) column
-- Categories column is for storing JSON/comma-separated genre data
-- Full-text search or application-level filtering should be used instead

PRINT 'Migration 004_add_categories_to_movies completed successfully';
GO
