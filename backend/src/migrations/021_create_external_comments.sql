-- Migration: Create external_comments table
-- This table stores comments for external content (not in our database)

-- Create external_comments table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='external_comments')
CREATE TABLE dbo.external_comments (
  id         INT IDENTITY(1,1) PRIMARY KEY,
  user_id    INT NOT NULL,
  ext_key    NVARCHAR(255) NOT NULL, -- Format: "provider:slug" (e.g., "local:thon-phe-tinh-khong")
  parent_id  INT NULL,
  content    NVARCHAR(MAX) NOT NULL,
  created_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_ext_cmt_user    FOREIGN KEY(user_id)    REFERENCES dbo.users(id)    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT FK_ext_cmt_parent  FOREIGN KEY(parent_id)   REFERENCES dbo.external_comments(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- Create indexes for performance
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
