-- ============================================================================
-- Content History Table
-- Tracks version history for all content (pages, blog posts, common content)
-- Automatically cleaned up monthly to prevent table bloat
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which table and record this history belongs to
  table_name TEXT NOT NULL CHECK (table_name IN ('content_pages', 'blog_posts', 'content_common')),
  record_id UUID NOT NULL,

  -- Version information
  version INTEGER NOT NULL,

  -- Content snapshot
  title TEXT,
  content_snapshot JSONB NOT NULL,  -- Full snapshot of data/content at this version
  meta_snapshot JSONB,              -- Snapshot of meta_data if applicable

  -- Status at this version
  status TEXT,                       -- Status at the time of this version

  -- Change metadata
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_summary TEXT,               -- Optional: Brief description of what changed

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Most common query: Get history for a specific record
CREATE INDEX idx_content_history_record ON content_history(table_name, record_id, version DESC);

-- Date-based cleanup queries
CREATE INDEX idx_content_history_created ON content_history(created_at);

-- User activity queries
CREATE INDEX idx_content_history_user ON content_history(changed_by);

-- Composite index for efficient history browsing
CREATE INDEX idx_content_history_composite ON content_history(
  table_name,
  record_id,
  created_at DESC
);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE content_history ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view history
CREATE POLICY "Authenticated users can view content history"
  ON content_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can insert history
CREATE POLICY "Authenticated users can insert content history"
  ON content_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No one can update or delete history (immutable audit trail)
-- Cleanup is done via the cleanup function with elevated privileges

-- ============================================================================
-- Trigger Functions: Auto-create history on content changes
-- ============================================================================

-- Function: Save content_pages history
CREATE OR REPLACE FUNCTION save_content_pages_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only save history if content actually changed
  IF (NEW.data IS DISTINCT FROM OLD.data) OR
     (NEW.title IS DISTINCT FROM OLD.title) OR
     (NEW.meta_data IS DISTINCT FROM OLD.meta_data) OR
     (NEW.status IS DISTINCT FROM OLD.status) THEN

    INSERT INTO content_history (
      table_name,
      record_id,
      version,
      title,
      content_snapshot,
      meta_snapshot,
      status,
      changed_by
    ) VALUES (
      'content_pages',
      OLD.id,
      OLD.version,
      OLD.title,
      OLD.data,
      OLD.meta_data,
      OLD.status::TEXT,
      NEW.last_modified_by
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Save blog_posts history
CREATE OR REPLACE FUNCTION save_blog_posts_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only save history if content actually changed
  IF (NEW.content IS DISTINCT FROM OLD.content) OR
     (NEW.title IS DISTINCT FROM OLD.title) OR
     (NEW.excerpt IS DISTINCT FROM OLD.excerpt) OR
     (NEW.meta_data IS DISTINCT FROM OLD.meta_data) OR
     (NEW.status IS DISTINCT FROM OLD.status) THEN

    INSERT INTO content_history (
      table_name,
      record_id,
      version,
      title,
      content_snapshot,
      meta_snapshot,
      status,
      changed_by
    ) VALUES (
      'blog_posts',
      OLD.id,
      OLD.version,
      OLD.title,
      jsonb_build_object(
        'content', OLD.content,
        'excerpt', OLD.excerpt,
        'featured_image', OLD.featured_image,
        'tags', OLD.tags,
        'category', OLD.category
      ),
      OLD.meta_data,
      OLD.status::TEXT,
      NEW.last_modified_by
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Save content_common history
CREATE OR REPLACE FUNCTION save_content_common_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only save history if content actually changed
  IF (NEW.data IS DISTINCT FROM OLD.data) THEN

    INSERT INTO content_history (
      table_name,
      record_id,
      version,
      title,
      content_snapshot,
      changed_by
    ) VALUES (
      'content_common',
      OLD.id,
      1,  -- content_common doesn't have version field, so use 1
      OLD.title,
      OLD.data,
      NEW.last_modified_by
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Attach Triggers
-- ============================================================================

CREATE TRIGGER trigger_save_content_pages_history
  AFTER UPDATE ON content_pages
  FOR EACH ROW
  EXECUTE FUNCTION save_content_pages_history();

CREATE TRIGGER trigger_save_blog_posts_history
  AFTER UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION save_blog_posts_history();

CREATE TRIGGER trigger_save_content_common_history
  AFTER UPDATE ON content_common
  FOR EACH ROW
  EXECUTE FUNCTION save_content_common_history();

-- ============================================================================
-- Cleanup Function: Remove old history (Run monthly via cron)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_content_history(months_to_keep INTEGER DEFAULT 1)
RETURNS TABLE(
  deleted_pages INTEGER,
  deleted_blogs INTEGER,
  deleted_common INTEGER,
  total_deleted INTEGER
) AS $$
DECLARE
  v_deleted_pages INTEGER;
  v_deleted_blogs INTEGER;
  v_deleted_common INTEGER;
BEGIN
  -- Delete old content_pages history
  DELETE FROM content_history
  WHERE table_name = 'content_pages'
    AND created_at < NOW() - (months_to_keep || ' months')::INTERVAL;
  GET DIAGNOSTICS v_deleted_pages = ROW_COUNT;

  -- Delete old blog_posts history
  DELETE FROM content_history
  WHERE table_name = 'blog_posts'
    AND created_at < NOW() - (months_to_keep || ' months')::INTERVAL;
  GET DIAGNOSTICS v_deleted_blogs = ROW_COUNT;

  -- Delete old content_common history
  DELETE FROM content_history
  WHERE table_name = 'content_common'
    AND created_at < NOW() - (months_to_keep || ' months')::INTERVAL;
  GET DIAGNOSTICS v_deleted_common = ROW_COUNT;

  -- Return results
  RETURN QUERY SELECT
    v_deleted_pages,
    v_deleted_blogs,
    v_deleted_common,
    v_deleted_pages + v_deleted_blogs + v_deleted_common;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_content_history IS
  'Deletes content history older than specified months. Default: 1 month.
   Returns count of deleted records per table.
   Usage: SELECT * FROM cleanup_old_content_history(1);

   **IMPORTANT**: Set up a cron job to run this monthly:
   - Supabase: Use pg_cron extension
   - External: Use your server cron or scheduled task';

-- ============================================================================
-- Helper Function: Get history for a specific record
-- ============================================================================

CREATE OR REPLACE FUNCTION get_content_history(
  p_table_name TEXT,
  p_record_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  version INTEGER,
  title TEXT,
  status TEXT,
  changed_by_email TEXT,
  changed_by_name TEXT,
  change_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ch.version,
    ch.title,
    ch.status,
    u.email as changed_by_email,
    u.full_name as changed_by_name,
    ch.created_at as change_date
  FROM content_history ch
  LEFT JOIN public.users u ON ch.changed_by = u.id
  WHERE ch.table_name = p_table_name
    AND ch.record_id = p_record_id
  ORDER BY ch.version DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_content_history IS
  'Get version history for a specific content record.
   Usage: SELECT * FROM get_content_history(''content_pages'', ''uuid-here'', 10);';

-- ============================================================================
-- Helper Function: Restore a previous version
-- ============================================================================

CREATE OR REPLACE FUNCTION restore_content_version(
  p_table_name TEXT,
  p_record_id UUID,
  p_version INTEGER,
  p_restored_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_history_record RECORD;
BEGIN
  -- Get the history record
  SELECT * INTO v_history_record
  FROM content_history
  WHERE table_name = p_table_name
    AND record_id = p_record_id
    AND version = p_version;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'History version not found: % v%', p_table_name, p_version;
  END IF;

  -- Restore based on table type
  IF p_table_name = 'content_pages' THEN
    UPDATE content_pages SET
      title = v_history_record.title,
      data = v_history_record.content_snapshot,
      meta_data = v_history_record.meta_snapshot,
      last_modified_by = p_restored_by,
      updated_at = NOW()
    WHERE id = p_record_id;

  ELSIF p_table_name = 'blog_posts' THEN
    UPDATE blog_posts SET
      title = v_history_record.title,
      content = v_history_record.content_snapshot->'content',
      excerpt = v_history_record.content_snapshot->>'excerpt',
      featured_image = v_history_record.content_snapshot->>'featured_image',
      meta_data = v_history_record.meta_snapshot,
      last_modified_by = p_restored_by,
      updated_at = NOW()
    WHERE id = p_record_id;

  ELSIF p_table_name = 'content_common' THEN
    UPDATE content_common SET
      data = v_history_record.content_snapshot,
      last_modified_by = p_restored_by,
      updated_at = NOW()
    WHERE id = p_record_id;

  ELSE
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION restore_content_version IS
  'Restore a previous version of content. Creates a new version with old content.
   Usage: SELECT restore_content_version(''content_pages'', ''uuid'', 5, ''user-uuid'');';

-- ============================================================================
-- Helper View: Recent content changes across all tables
-- ============================================================================

CREATE OR REPLACE VIEW recent_content_changes AS
SELECT
  ch.table_name,
  ch.record_id,
  ch.version,
  ch.title,
  ch.status,
  u.email as changed_by_email,
  u.full_name as changed_by_name,
  ch.change_summary,
  ch.created_at
FROM content_history ch
LEFT JOIN public.users u ON ch.changed_by = u.id
WHERE ch.created_at >= NOW() - INTERVAL '7 days'
ORDER BY ch.created_at DESC
LIMIT 100;

COMMENT ON VIEW recent_content_changes IS
  'Shows recent content changes across all tables (last 7 days)';

-- ============================================================================
-- Add Table Comments
-- ============================================================================

COMMENT ON TABLE content_history IS
  'Version history for all content tables. Automatically populated on updates.
   Old records (>1 month) are automatically cleaned via cleanup_old_content_history().

   **Monthly Cleanup Required**: Run cleanup_old_content_history() monthly to
   prevent unlimited table growth. Set up a cron job or scheduled task.';

COMMENT ON COLUMN content_history.table_name IS
  'Source table: content_pages, blog_posts, or content_common';

COMMENT ON COLUMN content_history.record_id IS
  'UUID of the record in the source table';

COMMENT ON COLUMN content_history.version IS
  'Version number at the time of this snapshot';

COMMENT ON COLUMN content_history.content_snapshot IS
  'Full JSON snapshot of content at this version';

COMMENT ON COLUMN content_history.change_summary IS
  'Optional human-readable description of what changed';
