-- ============================================================================
-- Create Categories and Tags Tables for Blog Posts
-- Enables structured category and tag management with relationships
-- ============================================================================

-- ============================================================================
-- 1. Create Categories Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for slug lookups
CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX idx_blog_categories_name ON blog_categories(name);

-- Comments
COMMENT ON TABLE blog_categories IS 'Blog post categories for organization and filtering';
COMMENT ON COLUMN blog_categories.name IS 'Category name (e.g., "Technology", "Business")';
COMMENT ON COLUMN blog_categories.slug IS 'URL-friendly slug for category';
COMMENT ON COLUMN blog_categories.description IS 'Optional description of the category';

-- ============================================================================
-- 2. Create Tags Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for lookups
CREATE INDEX idx_blog_tags_slug ON blog_tags(slug);
CREATE INDEX idx_blog_tags_name ON blog_tags(name);

-- Comments
COMMENT ON TABLE blog_tags IS 'Tags for blog posts (many-to-many relationship)';
COMMENT ON COLUMN blog_tags.name IS 'Tag name (e.g., "javascript", "nodejs")';
COMMENT ON COLUMN blog_tags.slug IS 'URL-friendly slug for tag';

-- ============================================================================
-- 3. Create Junction Table for Blog Posts and Tags
-- ============================================================================

CREATE TABLE IF NOT EXISTS blog_post_tags (
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (blog_post_id, tag_id)
);

-- Add indexes for efficient queries
CREATE INDEX idx_blog_post_tags_post ON blog_post_tags(blog_post_id);
CREATE INDEX idx_blog_post_tags_tag ON blog_post_tags(tag_id);

-- Comments
COMMENT ON TABLE blog_post_tags IS 'Junction table for many-to-many relationship between blog posts and tags';

-- ============================================================================
-- 4. Alter blog_posts to Add Category FK and Remove Old Columns
-- ============================================================================

-- Add category_id foreign key if it doesn't exist
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL;

-- Drop old TEXT[] tags column and TEXT category column
ALTER TABLE blog_posts DROP COLUMN IF EXISTS tags;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS category;

-- Add index for category lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);

-- Comments
COMMENT ON COLUMN blog_posts.category_id IS 'Foreign key to blog_categories (one-to-many)';

-- ============================================================================
-- 5. Auto-update Updated_at Timestamps
-- ============================================================================

-- For blog_categories
CREATE OR REPLACE FUNCTION update_blog_categories_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_blog_categories_timestamp ON blog_categories;
CREATE TRIGGER trigger_update_blog_categories_timestamp
  BEFORE UPDATE ON blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_categories_timestamp();

-- For blog_tags
CREATE OR REPLACE FUNCTION update_blog_tags_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_blog_tags_timestamp ON blog_tags;
CREATE TRIGGER trigger_update_blog_tags_timestamp
  BEFORE UPDATE ON blog_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_tags_timestamp();

-- ============================================================================
-- 6. Seed Data (Optional - Comment out if not needed)
-- ============================================================================

/*
INSERT INTO blog_categories (name, slug, description) VALUES
  ('Technology', 'technology', 'Tech news, updates, and discussions'),
  ('Business', 'business', 'Business insights and strategies'),
  ('Tutorial', 'tutorial', 'Step-by-step guides and tutorials'),
  ('News', 'news', 'Latest news and announcements')
ON CONFLICT (name) DO NOTHING;

INSERT INTO blog_tags (name, slug) VALUES
  ('javascript', 'javascript'),
  ('nodejs', 'nodejs'),
  ('typescript', 'typescript'),
  ('react', 'react'),
  ('backend', 'backend'),
  ('frontend', 'frontend'),
  ('database', 'database'),
  ('api', 'api')
ON CONFLICT (name) DO NOTHING;
*/

-- ============================================================================
-- 7. Row Level Security (RLS)
-- ============================================================================

ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

-- Public can read categories
CREATE POLICY "Public can read categories" ON blog_categories
  FOR SELECT USING (true);

-- Authenticated can create/update categories
CREATE POLICY "Authenticated can create categories" ON blog_categories
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update categories" ON blog_categories
  FOR UPDATE TO authenticated
  USING (true);

-- Public can read tags
CREATE POLICY "Public can read tags" ON blog_tags
  FOR SELECT USING (true);

-- Authenticated can create/update tags
CREATE POLICY "Authenticated can create tags" ON blog_tags
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update tags" ON blog_tags
  FOR UPDATE TO authenticated
  USING (true);

-- Public can read post tags relationship
CREATE POLICY "Public can read post tags" ON blog_post_tags
  FOR SELECT USING (true);

-- Authenticated can manage post tags
CREATE POLICY "Authenticated can manage post tags" ON blog_post_tags
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete post tags" ON blog_post_tags
  FOR DELETE TO authenticated
  USING (true);
