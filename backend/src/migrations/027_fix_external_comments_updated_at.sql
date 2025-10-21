-- Migration: Fix external_comments table to ensure updated_at column exists
-- This migration ensures the external_comments table has the correct structure

-- Check if external_comments table exists, if not create it
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='external_comments')
BEGIN
    CREATE TABLE dbo.external_comments (
        id         INT IDENTITY(1,1) PRIMARY KEY,
        user_id    INT NOT NULL,
        ext_key    NVARCHAR(255) NOT NULL,
        parent_id  INT NULL,
        content    NVARCHAR(MAX) NOT NULL,
        created_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_ext_cmt_user    FOREIGN KEY(user_id)    REFERENCES dbo.users(id)    ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT FK_ext_cmt_parent  FOREIGN KEY(parent_id)   REFERENCES dbo.external_comments(id) ON UPDATE NO ACTION ON DELETE NO ACTION
    );
END
ELSE
BEGIN
    -- If table exists, check if updated_at column exists
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[external_comments]') AND name = 'updated_at')
    BEGIN
        ALTER TABLE dbo.external_comments ADD updated_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME();
    END
END
GO

-- Create indexes if they don't exist
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_external_comments_ext_key' AND object_id = OBJECT_ID(N'[dbo].[external_comments]'))
BEGIN
    CREATE INDEX IX_external_comments_ext_key ON dbo.external_comments(ext_key);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_external_comments_user_id' AND object_id = OBJECT_ID(N'[dbo].[external_comments]'))
BEGIN
    CREATE INDEX IX_external_comments_user_id ON dbo.external_comments(user_id);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_external_comments_parent_id' AND object_id = OBJECT_ID(N'[dbo].[external_comments]'))
BEGIN
    CREATE INDEX IX_external_comments_parent_id ON dbo.external_comments(parent_id);
END
GO
