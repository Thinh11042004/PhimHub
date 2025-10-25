-- Migration: 002_add_slug_to_movies
SET NOCOUNT ON;
GO

USE [PhimHub];
GO

-- 1) Add slug column as nullable first to allow backfill
IF COL_LENGTH('dbo.movies', 'slug') IS NULL
ALTER TABLE dbo.movies ADD slug NVARCHAR(255) NULL;
GO

-- 2) Backfill slug for existing rows from title (basic slugify)
;WITH cte AS (
  SELECT id,
         -- Replace spaces, underscores, forward/back slashes with '-'
         LOWER(
           REPLACE(
             REPLACE(
               REPLACE(
                 REPLACE(title, N' ', N'-')
               , N'_', N'-')
             , N'/', N'-')
           , N'\\', N'-')
         ) AS base_slug
  FROM dbo.movies
)
UPDATE m
SET slug = s.slug
FROM dbo.movies m
JOIN (
  -- ensure uniqueness by appending -n if duplicates
  SELECT c1.id,
         c1.base_slug +
         CASE WHEN x.rn = 1 THEN '' ELSE '-' + CAST(x.rn - 1 AS NVARCHAR(10)) END AS slug
  FROM cte c1
  JOIN (
    SELECT base_slug,
           id,
           ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id) AS rn
    FROM cte
  ) x ON x.id = c1.id
) s ON s.id = m.id
WHERE m.slug IS NULL;
GO

-- 3) Set slug to NOT NULL
ALTER TABLE dbo.movies ALTER COLUMN slug NVARCHAR(255) NOT NULL;
GO

-- 4) Create unique index on slug
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes i
  WHERE i.name = 'UQ_movies_slug' AND i.object_id = OBJECT_ID('dbo.movies')
)
CREATE UNIQUE INDEX UQ_movies_slug ON dbo.movies(slug);
GO

