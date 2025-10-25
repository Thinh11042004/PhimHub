-- Migration: Add local media storage support, download metadata, and job runs tracking

SET NOCOUNT ON;

-- 1) Extend movies table for local/remote image paths
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'remote_thumbnail_url')
  ALTER TABLE dbo.movies ADD remote_thumbnail_url NVARCHAR(500) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'remote_banner_url')
  ALTER TABLE dbo.movies ADD remote_banner_url NVARCHAR(500) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'local_thumbnail_path')
  ALTER TABLE dbo.movies ADD local_thumbnail_path NVARCHAR(500) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[movies]') AND name = 'local_banner_path')
  ALTER TABLE dbo.movies ADD local_banner_path NVARCHAR(500) NULL;

-- 2) Extend episodes table for local HLS paths and download status
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[episodes]') AND name = 'source_url')
  ALTER TABLE dbo.episodes ADD source_url NVARCHAR(1000) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[episodes]') AND name = 'local_hls_path')
  ALTER TABLE dbo.episodes ADD local_hls_path NVARCHAR(500) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[episodes]') AND name = 'download_status')
  ALTER TABLE dbo.episodes ADD download_status NVARCHAR(20) NOT NULL DEFAULT N'pending';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[episodes]') AND name = 'last_download_error')
  ALTER TABLE dbo.episodes ADD last_download_error NVARCHAR(1000) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[episodes]') AND name = 'last_download_at')
  ALTER TABLE dbo.episodes ADD last_download_at DATETIME2(0) NULL;

GO

-- 3) Create job_runs table to persist crawler runs
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.job_runs') AND type = 'U')
BEGIN
  CREATE TABLE dbo.job_runs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    job_name NVARCHAR(100) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT N'running',
    started_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    finished_at DATETIME2(0) NULL,
    payload NVARCHAR(MAX) NULL,
    result NVARCHAR(MAX) NULL,
    error NVARCHAR(MAX) NULL
  );
  CREATE INDEX IX_job_runs_name_started ON dbo.job_runs(job_name, started_at DESC);
END

GO

-- 4) Create media_downloads queue table
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.media_downloads') AND type = 'U')
BEGIN
  CREATE TABLE dbo.media_downloads (
    id INT IDENTITY(1,1) PRIMARY KEY,
    kind NVARCHAR(20) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT N'pending',
    priority INT NOT NULL DEFAULT 0,
    attempt_count INT NOT NULL DEFAULT 0,
    movie_id INT NULL,
    episode_id INT NULL,
    source_url NVARCHAR(1000) NOT NULL,
    target_path NVARCHAR(500) NULL,
    checksum NVARCHAR(128) NULL,
    bytes_total BIGINT NULL,
    bytes_downloaded BIGINT NULL,
    last_error NVARCHAR(1000) NULL,
    created_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(0) NULL,
    started_at DATETIME2(0) NULL,
    finished_at DATETIME2(0) NULL,
    CONSTRAINT CK_media_downloads_kind CHECK (kind IN (N'image', N'hls')),
    CONSTRAINT CK_media_downloads_status CHECK (status IN (N'pending', N'in_progress', N'completed', N'failed')),
    CONSTRAINT FK_media_downloads_movie FOREIGN KEY(movie_id) REFERENCES dbo.movies(id) ON DELETE SET NULL,
    CONSTRAINT FK_media_downloads_episode FOREIGN KEY(episode_id) REFERENCES dbo.episodes(id) ON DELETE SET NULL
  );
  CREATE INDEX IX_media_dl_status_priority ON dbo.media_downloads(status, priority DESC, created_at ASC);
  CREATE INDEX IX_media_dl_movie_episode ON dbo.media_downloads(movie_id, episode_id);
END
