-- Add indexes for people selection performance
-- This migration adds indexes to improve search and pagination performance

-- Index for actors name search and ordering
CREATE INDEX IX_actors_name ON dbo.actors(name);

-- Index for directors name search and ordering  
CREATE INDEX IX_directors_name ON dbo.directors(name);

-- Optional: Composite index for better performance with nationality filtering
-- CREATE INDEX IX_actors_name_nationality ON dbo.actors(name, nationality);
-- CREATE INDEX IX_directors_name_nationality ON dbo.directors(name, nationality);
