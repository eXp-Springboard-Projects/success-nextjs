-- Add archive functionality to posts table
-- This allows posts to be archived instead of deleted

-- Check if status already allows 'ARCHIVED'
-- If not, we may need to update the constraint or enum

-- For now, we'll just document that ARCHIVED is a valid status
-- The posts.status column should accept 'ARCHIVED' as a value

-- Note: In Supabase, if there's a CHECK constraint on status,
-- you may need to update it via the Supabase dashboard:
-- ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
-- ALTER TABLE posts ADD CONSTRAINT posts_status_check
-- CHECK (status IN ('DRAFT', 'PUBLISHED', 'PENDING', 'FUTURE', 'ARCHIVED'));

-- This is a documentation file - actual constraint changes should be made in Supabase dashboard
