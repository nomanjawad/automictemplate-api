-- ============================================================================
-- Alter Content Tables: Add User Tracking and Status Management
-- ============================================================================

-- ============================================================================
-- 1. Create Status Enum Type (Reusable)
-- ============================================================================

CREATE TYPE content_status AS ENUM (
  'draft',      -- Initial state, not visible to public
  'review',     -- Submitted for review
  'scheduled',  -- Scheduled for future publishing
  'published',  -- Live and visible to public
  'archived'    -- Hidden but kept for history
);

COMMENT ON TYPE content_status IS
  'Content lifecycle status for pages, blog posts, and common content';

-- ============================================================================
-- 2. Alter content_pages Table
-- ============================================================================

-- Add author tracking columns
ALTER TABLE content_pages
  ADD COLUMN author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN last_modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add new status column (keeping old published for migration)
ALTER TABLE content_pages
  ADD COLUMN status content_status DEFAULT 'draft';

-- Migrate existing data: published = true → 'published', false → 'draft'
UPDATE content_pages
SET status = CASE
  WHEN published = true THEN 'published'::content_status
  ELSE 'draft'::content_status
END;

-- Make status NOT NULL after migration
ALTER TABLE content_pages
  ALTER COLUMN status SET NOT NULL;

-- Add version tracking
ALTER TABLE content_pages
  ADD COLUMN version INTEGER DEFAULT 1 NOT NULL,
  ADD COLUMN order_index INTEGER DEFAULT 0;

-- Add indexes for new columns
CREATE INDEX idx_content_pages_author ON content_pages(author_id);
CREATE INDEX idx_content_pages_status ON content_pages(status);
CREATE INDEX idx_content_pages_version ON content_pages(version DESC);
CREATE INDEX idx_content_pages_order ON content_pages(order_index);

-- Update the published index to use status instead
DROP INDEX IF EXISTS idx_content_pages_published;
CREATE INDEX idx_content_pages_published_status ON content_pages(status) WHERE status = 'published';

-- Comments
COMMENT ON COLUMN content_pages.author_id IS
  'User who created this page';
COMMENT ON COLUMN content_pages.last_modified_by IS
  'User who last modified this page';
COMMENT ON COLUMN content_pages.status IS
  'Content lifecycle status: draft, review, scheduled, published, archived';
COMMENT ON COLUMN content_pages.version IS
  'Version number, incremented on each update';
COMMENT ON COLUMN content_pages.order_index IS
  'Custom ordering for navigation menus (lower numbers appear first)';

-- ============================================================================
-- 3. Alter content_common Table
-- ============================================================================

-- Add title and description for better admin UX
ALTER TABLE content_common
  ADD COLUMN title TEXT,
  ADD COLUMN description TEXT,
  ADD COLUMN last_modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN active BOOLEAN DEFAULT true NOT NULL;

-- Create index for active status
CREATE INDEX idx_content_common_active ON content_common(active) WHERE active = true;
CREATE INDEX idx_content_common_last_modified ON content_common(last_modified_by);

-- Comments
COMMENT ON COLUMN content_common.title IS
  'Human-readable name for admin UI (e.g., "Site Header", "Footer Links")';
COMMENT ON COLUMN content_common.description IS
  'Description of what this common content is used for';
COMMENT ON COLUMN content_common.last_modified_by IS
  'User who last modified this common content';
COMMENT ON COLUMN content_common.active IS
  'Whether this common content is active (can be toggled without deleting)';

-- ============================================================================
-- 4. Alter blog_posts Table
-- ============================================================================

-- Add new status column (keeping old published for migration)
ALTER TABLE blog_posts
  ADD COLUMN status content_status DEFAULT 'draft';

-- Migrate existing data
UPDATE blog_posts
SET status = CASE
  WHEN published = true THEN 'published'::content_status
  ELSE 'draft'::content_status
END;

-- Make status NOT NULL after migration
ALTER TABLE blog_posts
  ALTER COLUMN status SET NOT NULL;

-- Add additional useful columns
ALTER TABLE blog_posts
  ADD COLUMN last_modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN version INTEGER DEFAULT 1 NOT NULL,
  ADD COLUMN view_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN reading_time_minutes INTEGER,
  ADD COLUMN category TEXT,
  ADD COLUMN scheduled_at TIMESTAMPTZ;

-- Add indexes
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_last_modified ON blog_posts(last_modified_by);
CREATE INDEX idx_blog_posts_version ON blog_posts(version DESC);
CREATE INDEX idx_blog_posts_views ON blog_posts(view_count DESC);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_scheduled ON blog_posts(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Update the published index to use status instead
DROP INDEX IF EXISTS idx_blog_posts_published;
CREATE INDEX idx_blog_posts_published_status ON blog_posts(status, published_at DESC) WHERE status = 'published';

-- Comments
COMMENT ON COLUMN blog_posts.status IS
  'Content lifecycle status: draft, review, scheduled, published, archived';
COMMENT ON COLUMN blog_posts.last_modified_by IS
  'User who last edited this post (may differ from author)';
COMMENT ON COLUMN blog_posts.version IS
  'Version number, incremented on each update';
COMMENT ON COLUMN blog_posts.view_count IS
  'Number of times this post has been viewed';
COMMENT ON COLUMN blog_posts.reading_time_minutes IS
  'Estimated reading time in minutes';
COMMENT ON COLUMN blog_posts.category IS
  'Primary category (different from tags which are for filtering)';
COMMENT ON COLUMN blog_posts.scheduled_at IS
  'When to automatically publish (for scheduled posts)';

-- ============================================================================
-- 5. Update Triggers for Version Tracking
-- ============================================================================

-- Trigger for content_pages: Increment version on update
CREATE OR REPLACE FUNCTION increment_content_pages_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment version if actual content changed (not just timestamps)
  IF (NEW.data IS DISTINCT FROM OLD.data) OR
     (NEW.title IS DISTINCT FROM OLD.title) OR
     (NEW.meta_data IS DISTINCT FROM OLD.meta_data) OR
     (NEW.status IS DISTINCT FROM OLD.status) THEN
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_content_pages_version
  BEFORE UPDATE ON content_pages
  FOR EACH ROW
  EXECUTE FUNCTION increment_content_pages_version();

-- Trigger for blog_posts: Increment version on update
CREATE OR REPLACE FUNCTION increment_blog_posts_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment version if actual content changed
  IF (NEW.content IS DISTINCT FROM OLD.content) OR
     (NEW.title IS DISTINCT FROM OLD.title) OR
     (NEW.excerpt IS DISTINCT FROM OLD.excerpt) OR
     (NEW.meta_data IS DISTINCT FROM OLD.meta_data) OR
     (NEW.status IS DISTINCT FROM OLD.status) THEN
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_blog_posts_version
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION increment_blog_posts_version();

-- ============================================================================
-- 6. Update Existing Triggers for Status
-- ============================================================================

-- Update blog_posts published_at trigger to work with status enum
DROP TRIGGER IF EXISTS trigger_set_blog_posts_published_at ON blog_posts;

CREATE OR REPLACE FUNCTION set_blog_posts_published_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set published_at when changing to published status
  IF NEW.status = 'published' AND
     (OLD.status IS DISTINCT FROM 'published') AND
     NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  END IF;

  -- Clear published_at when unpublishing
  IF NEW.status != 'published' AND OLD.status = 'published' THEN
    NEW.published_at = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_blog_posts_published_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION set_blog_posts_published_at();

-- ============================================================================
-- 7. Update RLS Policies for New Status Field
-- ============================================================================

-- Drop old policies that reference published boolean
DROP POLICY IF EXISTS "Public users can view published pages" ON content_pages;
DROP POLICY IF EXISTS "Public users can view published blog posts" ON blog_posts;

-- Create new policies using status enum
CREATE POLICY "Public users can view published pages"
  ON content_pages
  FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public users can view published blog posts"
  ON blog_posts
  FOR SELECT
  USING (status = 'published');

-- ============================================================================
-- 8. Add Helpful Comments
-- ============================================================================

COMMENT ON TABLE content_pages IS
  'Page-specific content (home, about, contact, etc.) with version tracking,
   author attribution, and status lifecycle management.';

COMMENT ON TABLE content_common IS
  'Reusable common content blocks (header, footer, etc.) with activity toggle
   and modification tracking.';

COMMENT ON TABLE blog_posts IS
  'Blog posts with rich metadata, version tracking, view counts, and
   status lifecycle management including scheduled publishing.';

-- ============================================================================
-- 9. Optional: Set author_id for existing records
-- ============================================================================

-- If you have existing records and want to set a default author,
-- you can run this (replace with actual admin user UUID):

-- UPDATE content_pages SET author_id = 'YOUR_ADMIN_USER_UUID'
-- WHERE author_id IS NULL;

-- UPDATE blog_posts SET last_modified_by = author_id
-- WHERE last_modified_by IS NULL AND author_id IS NOT NULL;
