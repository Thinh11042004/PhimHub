-- Create custom lists table (idempotent)
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.custom_lists') AND type = 'U')
BEGIN
  CREATE TABLE dbo.custom_lists (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    is_public BIT NOT NULL DEFAULT 0,
    created_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(0) NULL
  );
END
GO

-- Add foreign key constraint if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_custom_lists_user')
BEGIN
  ALTER TABLE dbo.custom_lists 
  ADD CONSTRAINT FK_custom_lists_user 
  FOREIGN KEY(user_id) REFERENCES dbo.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
END
GO

-- Create custom list items table (idempotent)
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.custom_list_items') AND type = 'U')
BEGIN
  CREATE TABLE dbo.custom_list_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    list_id INT NOT NULL,
    content_id INT NOT NULL,
    added_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO

-- Add foreign key constraints if they don't exist
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_cli_list')
BEGIN
  ALTER TABLE dbo.custom_list_items 
  ADD CONSTRAINT FK_cli_list 
  FOREIGN KEY(list_id) REFERENCES dbo.custom_lists(id) ON UPDATE CASCADE ON DELETE CASCADE;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_cli_content')
BEGIN
  ALTER TABLE dbo.custom_list_items 
  ADD CONSTRAINT FK_cli_content 
  FOREIGN KEY(content_id) REFERENCES dbo.contents(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
END
GO

-- Add unique constraint if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_cli_list_content' AND object_id = OBJECT_ID(N'dbo.custom_list_items'))
BEGIN
  ALTER TABLE dbo.custom_list_items 
  ADD CONSTRAINT UQ_cli_list_content UNIQUE (list_id, content_id);
END
GO

-- Create trigger for custom_lists updated_at (idempotent)
IF NOT EXISTS (SELECT 1 FROM sys.triggers WHERE name = 'trg_custom_lists_set_updated_at')
BEGIN
  EXEC('CREATE TRIGGER dbo.trg_custom_lists_set_updated_at
  ON dbo.custom_lists
  AFTER UPDATE
  AS
  BEGIN
    SET NOCOUNT ON;
    UPDATE cl
      SET updated_at = SYSUTCDATETIME()
    FROM dbo.custom_lists cl
    INNER JOIN inserted i ON cl.id = i.id;
  END');
END
GO

-- Create indexes for performance (idempotent)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_custom_lists_user' AND object_id = OBJECT_ID(N'dbo.custom_lists'))
BEGIN
  CREATE INDEX IX_custom_lists_user ON dbo.custom_lists(user_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_custom_lists_public' AND object_id = OBJECT_ID(N'dbo.custom_lists'))
BEGIN
  CREATE INDEX IX_custom_lists_public ON dbo.custom_lists(is_public);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_custom_list_items_list' AND object_id = OBJECT_ID(N'dbo.custom_list_items'))
BEGIN
  CREATE INDEX IX_custom_list_items_list ON dbo.custom_list_items(list_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_custom_list_items_content' AND object_id = OBJECT_ID(N'dbo.custom_list_items'))
BEGIN
  CREATE INDEX IX_custom_list_items_content ON dbo.custom_list_items(content_id);
END
GO
