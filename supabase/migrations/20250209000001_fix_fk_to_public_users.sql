-- ============================================================================
-- Fix FK Constraints: Point to public.users instead of auth.users
-- Solves cross-schema relationship issue
-- ============================================================================

-- Update content_pages table
ALTER TABLE content_pages
  DROP CONSTRAINT IF EXISTS content_pages_author_id_fkey,
  DROP CONSTRAINT IF EXISTS content_pages_last_modified_by_fkey;

ALTER TABLE content_pages
  ADD CONSTRAINT content_pages_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT content_pages_last_modified_by_fkey
    FOREIGN KEY (last_modified_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Update content_common table if it has last_modified_by
ALTER TABLE IF EXISTS content_common
  DROP CONSTRAINT IF EXISTS content_common_last_modified_by_fkey;

ALTER TABLE IF EXISTS content_common
  ADD CONSTRAINT content_common_last_modified_by_fkey
    FOREIGN KEY (last_modified_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Update blog_posts table if it exists
ALTER TABLE IF EXISTS blog_posts
  DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey,
  DROP CONSTRAINT IF EXISTS blog_posts_last_modified_by_fkey;

ALTER TABLE IF EXISTS blog_posts
  ADD CONSTRAINT blog_posts_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT blog_posts_last_modified_by_fkey
    FOREIGN KEY (last_modified_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Update content_history table if it exists
ALTER TABLE IF EXISTS content_history
  DROP CONSTRAINT IF EXISTS content_history_changed_by_fkey;

ALTER TABLE IF EXISTS content_history
  ADD CONSTRAINT content_history_changed_by_fkey
    FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Update audit_log table to reference public.users instead of auth.users
ALTER TABLE IF EXISTS audit_log
  DROP CONSTRAINT IF EXISTS audit_log_user_id_fkey;

ALTER TABLE IF EXISTS audit_log
  ADD CONSTRAINT audit_log_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
