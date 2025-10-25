-- Add missing timestamp columns for actors and directors to match repository expectations
SET NOCOUNT ON;
GO

-- Actors: add created_at and updated_at if missing
IF COL_LENGTH('dbo.actors', 'created_at') IS NULL
BEGIN
  ALTER TABLE dbo.actors ADD created_at DATETIME2(0) NOT NULL CONSTRAINT DF_actors_created_at DEFAULT SYSUTCDATETIME();
END
GO

IF COL_LENGTH('dbo.actors', 'updated_at') IS NULL
BEGIN
  ALTER TABLE dbo.actors ADD updated_at DATETIME2(0) NULL;
END
GO

-- Directors: add created_at and updated_at if missing
IF COL_LENGTH('dbo.directors', 'created_at') IS NULL
BEGIN
  ALTER TABLE dbo.directors ADD created_at DATETIME2(0) NOT NULL CONSTRAINT DF_directors_created_at DEFAULT SYSUTCDATETIME();
END
GO

IF COL_LENGTH('dbo.directors', 'updated_at') IS NULL
BEGIN
  ALTER TABLE dbo.directors ADD updated_at DATETIME2(0) NULL;
END
GO

-- Update triggers to maintain updated_at on update
CREATE OR ALTER TRIGGER dbo.trg_actors_set_updated_at
ON dbo.actors
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE a
    SET updated_at = SYSUTCDATETIME()
  FROM dbo.actors a
  INNER JOIN inserted i ON a.id = i.id;
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_directors_set_updated_at
ON dbo.directors
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE d
    SET updated_at = SYSUTCDATETIME()
  FROM dbo.directors d
  INNER JOIN inserted i ON d.id = i.id;
END;
GO

PRINT 'Timestamps for actors/directors ensured.';
GO


