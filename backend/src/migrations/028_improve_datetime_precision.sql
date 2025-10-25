-- Migration: Improve datetime precision for better timezone handling
-- This migration improves the precision of datetime columns for better timezone handling

-- Update comments table to use DATETIME2(3) for better precision
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.comments') AND name = 'created_at')
BEGIN
    ALTER TABLE dbo.comments ALTER COLUMN created_at DATETIME2(3) NOT NULL;
    PRINT 'Updated comments.created_at to DATETIME2(3)';
END
ELSE
BEGIN
    PRINT 'Column comments.created_at not found or already updated';
END
GO

-- Update external_comments table to use DATETIME2(3) for better precision
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.external_comments') AND name = 'created_at')
BEGIN
    ALTER TABLE dbo.external_comments ALTER COLUMN created_at DATETIME2(3) NOT NULL;
    PRINT 'Updated external_comments.created_at to DATETIME2(3)';
END
ELSE
BEGIN
    PRINT 'Column external_comments.created_at not found or already updated';
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.external_comments') AND name = 'updated_at')
BEGIN
    ALTER TABLE dbo.external_comments ALTER COLUMN updated_at DATETIME2(3) NOT NULL;
    PRINT 'Updated external_comments.updated_at to DATETIME2(3)';
END
ELSE
BEGIN
    PRINT 'Column external_comments.updated_at not found or already updated';
END
GO

-- Create trigger for external_comments updated_at if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_external_comments_touch')
BEGIN
    EXEC('
    CREATE TRIGGER dbo.trg_external_comments_touch
    ON dbo.external_comments
    AFTER UPDATE
    AS
    BEGIN
      SET NOCOUNT ON;
      UPDATE ec
      SET updated_at = SYSUTCDATETIME()
      FROM dbo.external_comments ec
      JOIN inserted i ON ec.id = i.id;
    END
    ');
    PRINT 'Created trigger trg_external_comments_touch';
END
ELSE
BEGIN
    PRINT 'Trigger trg_external_comments_touch already exists';
END
GO

PRINT 'Migration 028 completed: Improved datetime precision for timezone handling';
GO
