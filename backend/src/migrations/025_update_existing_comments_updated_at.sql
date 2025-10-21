-- Update existing comments to set updated_at = created_at
-- This migration sets updated_at for existing comments that have NULL values

SET NOCOUNT ON;
GO

PRINT 'Updating existing comments updated_at values...';

-- Update all comments where updated_at is NULL
UPDATE dbo.comments 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Get the count of updated records
DECLARE @UpdatedCount INT;
SELECT @UpdatedCount = @@ROWCOUNT;

PRINT 'Updated ' + CAST(@UpdatedCount AS VARCHAR(10)) + ' comments';

-- Show the results
SELECT 
    c.id,
    c.content,
    c.created_at,
    c.updated_at,
    u.username,
    u.fullname
FROM dbo.comments c
INNER JOIN dbo.users u ON c.user_id = u.id
ORDER BY c.created_at DESC;

PRINT 'Comments updated_at migration completed.';
GO
