
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
    CONSTRAINT FK_md_movie FOREIGN KEY(movie_id) REFERENCES dbo.movies(id) ON DELETE SET NULL,
    CONSTRAINT FK_md_episode FOREIGN KEY(episode_id) REFERENCES dbo.episodes(id) ON DELETE SET NULL
  );
  CREATE INDEX IX_media_dl_status_priority ON dbo.media_downloads(status, priority DESC, created_at ASC);
  CREATE INDEX IX_media_dl_movie_episode ON dbo.media_downloads(movie_id, episode_id);
END

