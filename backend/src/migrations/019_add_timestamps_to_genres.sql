-- Add timestamps to genres table to match repository logic
SET NOCOUNT ON;
GO

IF COL_LENGTH('dbo.genres', 'created_at') IS NULL
BEGIN
  ALTER TABLE dbo.genres ADD created_at DATETIME2(0) NOT NULL CONSTRAINT DF_genres_created_at DEFAULT SYSUTCDATETIME();
END
GO

IF COL_LENGTH('dbo.genres', 'updated_at') IS NULL
BEGIN
  ALTER TABLE dbo.genres ADD updated_at DATETIME2(0) NULL;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_genres_set_updated_at
ON dbo.genres
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE g
    SET updated_at = SYSUTCDATETIME()
  FROM dbo.genres g
  INNER JOIN inserted i ON g.id = i.id;
END;
GO

PRINT 'Timestamps for genres ensured.';
GO


