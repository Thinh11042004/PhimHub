-- Complete PhimHub Database Schema
SET NOCOUNT ON;
GO

-- Ensure we're using the correct database
USE [PhimHub];
GO

-- Create roles table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='roles')
CREATE TABLE dbo.roles (
  id   INT IDENTITY(1,1) PRIMARY KEY,
  code NVARCHAR(50)  NOT NULL UNIQUE,
  name NVARCHAR(100) NOT NULL
);
GO

-- Create users table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='users')
CREATE TABLE dbo.users (
  id            INT IDENTITY(1,1) PRIMARY KEY,
  username      NVARCHAR(100) NOT NULL UNIQUE,
  email         NVARCHAR(255) NOT NULL UNIQUE,
  password_hash NVARCHAR(255) NOT NULL,
  fullname      NVARCHAR(255) NULL,
  avatar        NVARCHAR(255) NULL,
  phone        NVARCHAR(50)  NULL,
  role_id       INT NULL,
  last_login    DATETIME2(0) NULL,
  created_at    DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at    DATETIME2(0) NULL,
  status        NVARCHAR(50) NOT NULL DEFAULT N'active',
  CONSTRAINT FK_users_role FOREIGN KEY(role_id) REFERENCES dbo.roles(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT CK_users_status CHECK (status IN (N'active', N'inactive', N'banned'))
);
GO

-- Create trigger for users updated_at
CREATE OR ALTER TRIGGER dbo.trg_users_set_updated_at
ON dbo.users
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE u
    SET updated_at = SYSUTCDATETIME()
  FROM dbo.users u
  INNER JOIN inserted i ON u.id = i.id;
END;
GO

-- Create movies table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='movies')
CREATE TABLE dbo.movies (
  id            INT IDENTITY(1,1) PRIMARY KEY,
  title         NVARCHAR(255) NOT NULL,
  description   NVARCHAR(MAX) NULL,
  release_year  INT NULL,
  duration      INT NULL,
  age_rating    NVARCHAR(50) NULL,
  thumbnail_url NVARCHAR(255) NULL,
  trailer_url   NVARCHAR(255) NULL,
  is_series     BIT NOT NULL DEFAULT 0,
  view_count    BIGINT NOT NULL DEFAULT 0,
  created_at    DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at    DATETIME2(0) NULL,
  status        NVARCHAR(50) NOT NULL DEFAULT N'published',
  CONSTRAINT CK_movies_status CHECK (status IN (N'published', N'draft', N'archived'))
);
GO

-- Create trigger for movies updated_at
CREATE OR ALTER TRIGGER dbo.trg_movies_set_updated_at
ON dbo.movies
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE m
    SET updated_at = SYSUTCDATETIME()
  FROM dbo.movies m
  INNER JOIN inserted i ON m.id = i.id;
END;
GO

-- Create seasons table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='seasons')
CREATE TABLE dbo.seasons (
  id            INT IDENTITY(1,1) PRIMARY KEY,
  movie_id      INT NOT NULL,
  season_number INT NOT NULL,
  title         NVARCHAR(255) NULL,
  created_at    DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_seasons_movie_season UNIQUE (movie_id, season_number),
  CONSTRAINT FK_seasons_movie FOREIGN KEY(movie_id) REFERENCES dbo.movies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
GO

-- Create episodes table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='episodes')
CREATE TABLE dbo.episodes (
  id             INT IDENTITY(1,1) PRIMARY KEY,
  movie_id       INT NOT NULL,
  season_id      INT NULL,
  episode_number INT NOT NULL,
  title          NVARCHAR(255) NULL,
  duration       INT NULL,
  episode_url    NVARCHAR(255) NULL,
  created_at     DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_episodes_movie FOREIGN KEY(movie_id) REFERENCES dbo.movies(id) ON UPDATE CASCADE ON DELETE NO ACTION,
  CONSTRAINT FK_episodes_season FOREIGN KEY(season_id) REFERENCES dbo.seasons(id) ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT UQ_episode UNIQUE (movie_id, season_id, episode_number)
);
GO

-- Create genres table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='genres')
CREATE TABLE dbo.genres (
  id   INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(100) NOT NULL UNIQUE
);
GO

-- Create actors table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='actors')
CREATE TABLE dbo.actors (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  name        NVARCHAR(255) NOT NULL,
  dob         DATE NULL,
  nationality  NVARCHAR(100) NULL,
  photo_url   NVARCHAR(255) NULL
);
GO

-- Create directors table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='directors')
CREATE TABLE dbo.directors (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  name        NVARCHAR(255) NOT NULL,
  dob         DATE NULL,
  nationality NVARCHAR(100) NULL
);
GO

-- Create contents table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='contents')
CREATE TABLE dbo.contents (
  id           INT IDENTITY(1,1) PRIMARY KEY,
  content_type NVARCHAR(10) NOT NULL,
  movie_id     INT NULL,
  episode_id   INT NULL,
  created_at   DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_contents_type CHECK (content_type IN (N'movie', N'episode')),
  CONSTRAINT CK_contents_one_side CHECK (
      (content_type = N'movie'  AND movie_id  IS NOT NULL AND episode_id IS NULL) OR
      (content_type = N'episode' AND episode_id IS NOT NULL AND movie_id  IS NULL)
  ),
  CONSTRAINT UQ_contents_movie   UNIQUE (movie_id),
  CONSTRAINT UQ_contents_episode UNIQUE (episode_id),
  CONSTRAINT FK_contents_movie   FOREIGN KEY(movie_id)  REFERENCES dbo.movies(id)   ON UPDATE CASCADE ON DELETE NO ACTION,
  CONSTRAINT FK_contents_episode FOREIGN KEY(episode_id) REFERENCES dbo.episodes(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- Create favorites table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='favorites')
CREATE TABLE dbo.favorites (
  user_id    INT NOT NULL,
  content_id INT NOT NULL,
  added_at   DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_favorites PRIMARY KEY (user_id, content_id),
  CONSTRAINT FK_fav_user    FOREIGN KEY(user_id)    REFERENCES dbo.users(id)    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT FK_fav_content FOREIGN KEY(content_id) REFERENCES dbo.contents(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- Create ratings table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='ratings')
CREATE TABLE dbo.ratings (
  id           INT IDENTITY(1,1) PRIMARY KEY,
  user_id      INT NOT NULL,
  content_id   INT NOT NULL,
  rating_value TINYINT NOT NULL,
  created_at   DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_rating_value CHECK (rating_value BETWEEN 1 AND 5),
  CONSTRAINT UQ_ratings_user_content UNIQUE (user_id, content_id),
  CONSTRAINT FK_rate_user    FOREIGN KEY(user_id)    REFERENCES dbo.users(id)    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT FK_rate_content FOREIGN KEY(content_id) REFERENCES dbo.contents(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- Create comments table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='comments')
CREATE TABLE dbo.comments (
  id         INT IDENTITY(1,1) PRIMARY KEY,
  user_id    INT NOT NULL,
  content_id INT NOT NULL,
  parent_id  INT NULL,
  content    NVARCHAR(MAX) NOT NULL,
  created_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_cmt_user    FOREIGN KEY(user_id)    REFERENCES dbo.users(id)    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT FK_cmt_content FOREIGN KEY(content_id) REFERENCES dbo.contents(id) ON UPDATE CASCADE ON DELETE NO ACTION,
  CONSTRAINT FK_cmt_parent  FOREIGN KEY(parent_id)  REFERENCES dbo.comments(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- Create watch_history table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='watch_history')
CREATE TABLE dbo.watch_history (
  id              INT IDENTITY(1,1) PRIMARY KEY,
  user_id         INT NOT NULL,
  content_id      INT NOT NULL,
  last_watched_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
  progress        INT NULL,
  device          NVARCHAR(100) NULL,
  CONSTRAINT UQ_wh_user_content UNIQUE (user_id, content_id),
  CONSTRAINT FK_wh_user    FOREIGN KEY(user_id)    REFERENCES dbo.users(id)    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT FK_wh_content FOREIGN KEY(content_id) REFERENCES dbo.contents(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- Create notifications table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='notifications')
CREATE TABLE dbo.notifications (
  id         INT IDENTITY(1,1) PRIMARY KEY,
  user_id    INT NOT NULL,
  [type]     NVARCHAR(20) NOT NULL DEFAULT N'other',
  title      NVARCHAR(255) NULL,
  content    NVARCHAR(MAX) NULL,
  content_id INT NULL,
  is_read    BIT NOT NULL DEFAULT 0,
  created_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_notif_type CHECK ([type] IN (N'new_episode', N'system_message', N'promotion', N'comment_reply', N'other')),
  CONSTRAINT FK_notif_user    FOREIGN KEY(user_id)    REFERENCES dbo.users(id)    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT FK_notif_content FOREIGN KEY(content_id) REFERENCES dbo.contents(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- Create movie_actors table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='movie_actors')
CREATE TABLE dbo.movie_actors (
  movie_id  INT NOT NULL,
  actor_id  INT NOT NULL,
  role_name NVARCHAR(255) NULL,
  CONSTRAINT PK_movie_actors PRIMARY KEY (movie_id, actor_id),
  CONSTRAINT FK_ma_movie FOREIGN KEY(movie_id) REFERENCES dbo.movies(id)   ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT FK_ma_actor FOREIGN KEY(actor_id) REFERENCES dbo.actors(id)   ON UPDATE CASCADE ON DELETE CASCADE
);
GO

-- Create movie_directors table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='movie_directors')
CREATE TABLE dbo.movie_directors (
  movie_id    INT NOT NULL,
  director_id INT NOT NULL,
  CONSTRAINT PK_movie_directors PRIMARY KEY (movie_id, director_id),
  CONSTRAINT FK_md_movie    FOREIGN KEY(movie_id)    REFERENCES dbo.movies(id)    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT FK_md_director FOREIGN KEY(director_id) REFERENCES dbo.directors(id) ON UPDATE CASCADE ON DELETE CASCADE
);
GO

-- Create movie_genres table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='movie_genres')
CREATE TABLE dbo.movie_genres (
  movie_id INT NOT NULL,
  genre_id INT NOT NULL,
  CONSTRAINT PK_movie_genres PRIMARY KEY (movie_id, genre_id),
  CONSTRAINT FK_mg_movie FOREIGN KEY(movie_id) REFERENCES dbo.movies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT FK_mg_genre FOREIGN KEY(genre_id) REFERENCES dbo.genres(id) ON UPDATE CASCADE ON DELETE CASCADE
);
GO

-- Create subtitles table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='subtitles')
CREATE TABLE dbo.subtitles (
  id           INT IDENTITY(1,1) PRIMARY KEY,
  content_id   INT NOT NULL,
  language     NVARCHAR(20) NOT NULL,
  subtitle_url NVARCHAR(255) NOT NULL,
  created_at   DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_subtitle UNIQUE (content_id, language),
  CONSTRAINT FK_sub_content FOREIGN KEY(content_id) REFERENCES dbo.contents(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- Create reports table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='reports')
CREATE TABLE dbo.reports (
  id         INT IDENTITY(1,1) PRIMARY KEY,
  user_id    INT NOT NULL,
  content_id INT NULL,
  comment_id INT NULL,
  reason     NVARCHAR(255) NULL,
  status     NVARCHAR(50) NOT NULL DEFAULT N'pending',
  created_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_reports_status CHECK (status IN (N'pending', N'processing', N'resolved', N'rejected')),
  CONSTRAINT FK_rp_user    FOREIGN KEY(user_id)    REFERENCES dbo.users(id)    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT FK_rp_content FOREIGN KEY(content_id) REFERENCES dbo.contents(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT FK_rp_comment FOREIGN KEY(comment_id) REFERENCES dbo.comments(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- Create indexes for performance
CREATE INDEX IX_ep_movie_season_ep ON dbo.episodes(movie_id, season_id, episode_number);
CREATE INDEX IX_movies_status_year ON dbo.movies(status, release_year);
CREATE INDEX IX_contents_type ON dbo.contents(content_type);
CREATE INDEX IX_users_email ON dbo.users(email);
CREATE INDEX IX_users_username ON dbo.users(username);
CREATE INDEX IX_ratings_user_content ON dbo.ratings(user_id, content_id);
CREATE INDEX IX_comments_content ON dbo.comments(content_id);
CREATE INDEX IX_watch_history_user ON dbo.watch_history(user_id);
CREATE INDEX IX_notifications_user ON dbo.notifications(user_id);
GO

-- Create view for movies with episode counts
CREATE VIEW dbo.movies_with_counts
AS
SELECT
  m.*,
  (SELECT COUNT(*) FROM dbo.episodes e WHERE e.movie_id = m.id) AS total_episodes
FROM dbo.movies m;
GO

-- Insert basic roles
INSERT INTO dbo.roles(code, name) VALUES
 (N'admin', N'Administrator'),
 (N'pm',    N'Project Manager'),
 (N'user',  N'User');
GO
  