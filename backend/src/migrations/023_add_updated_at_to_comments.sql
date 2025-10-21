-- Add updated_at column to comments table
-- This migration adds the missing updated_at column to the comments table

SET NOCOUNT ON;
GO

-- Add updated_at column to comments table if it doesn't exist
IF COL_LENGTH('dbo.comments', 'updated_at') IS NULL
BEGIN
  ALTER TABLE dbo.comments ADD updated_at DATETIME2(0) NULL;
  PRINT 'Added updated_at column to comments table';
END
ELSE
BEGIN
  PRINT 'updated_at column already exists in comments table';
END
GO

-- Create trigger to automatically update updated_at when comment is modified
CREATE OR ALTER TRIGGER dbo.trg_comments_set_updated_at
ON dbo.comments
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE c
    SET updated_at = SYSUTCDATETIME()
  FROM dbo.comments c
  INNER JOIN inserted i ON c.id = i.id;
END;
GO

PRINT 'Comments table updated with updated_at column and trigger';
GO
