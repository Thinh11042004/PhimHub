-- Remove test watch history data
-- This migration removes all test data that was added by previous migrations

USE [PhimHub];
GO

PRINT 'Starting removal of test watch history data...';
GO

-- Get the test user ID (first user)
DECLARE @test_user_id INT = (SELECT TOP 1 id FROM dbo.users ORDER BY id);
PRINT 'Removing test data for user ID: ' + CAST(@test_user_id AS VARCHAR(10));

-- Remove all watch history for the test user
DELETE FROM dbo.watch_history WHERE user_id = @test_user_id;

-- Show remaining watch history (should be empty or only real user data)
SELECT 
    COUNT(*) as remaining_watch_history_count
FROM dbo.watch_history;

PRINT '✓ Test watch history data removed successfully';
PRINT 'Only real user watch history data remains in the database';
GO
