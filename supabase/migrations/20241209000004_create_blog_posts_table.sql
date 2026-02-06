-- ============================================================================
-- Blog Posts Table
-- Stores blog post content with rich JSON content and metadata
-- ============================================================================

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,         -- URL-friendly identifier
  title TEXT NOT NULL,               -- Post title
  excerpt TEXT,                      -- Short description/preview
  content JSONB NOT NULL,            -- Rich content as JSON (blocks, paragraphs, images, etc.)
  featured_image TEXT,               -- Supabase storage URL or external URL
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- Link to authenticated user
  tags TEXT[],                       -- Array of tags for categorization
  meta_data JSONB,                   -- SEO metadata (title, description, keywords, og tags)
  published BOOLEAN DEFAULT false,   -- Draft/published status
  published_at TIMESTAMPTZ,          -- When it was published
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by slug (most common query)
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);

-- Index for listing published posts
CREATE INDEX idx_blog_posts_published ON blog_posts(published, published_at DESC) WHERE published = true;

-- Index for author queries
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);

-- Index for tag searches using GIN (Generalized Inverted Index)
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN(tags);

-- Index for timestamp-based queries
CREATE INDEX idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX idx_blog_posts_updated_at ON blog_posts(updated_at DESC);

-- ============================================================================
-- Trigger: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_blog_posts_timestamp
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- ============================================================================
-- Trigger: Auto-set published_at when published status changes
-- ============================================================================

CREATE OR REPLACE FUNCTION set_blog_posts_published_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set published_at when changing from draft to published
  IF NEW.published = true AND (OLD.published = false OR OLD.published IS NULL) AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  END IF;

  -- Clear published_at when unpublishing
  IF NEW.published = false AND OLD.published = true THEN
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
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read access for published posts only
CREATE POLICY "Public users can view published blog posts"
  ON blog_posts
  FOR SELECT
  USING (published = true);

-- Authenticated users can view all posts (including drafts)
CREATE POLICY "Authenticated users can view all blog posts"
  ON blog_posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert posts
CREATE POLICY "Authenticated users can create blog posts"
  ON blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authors can update their own posts, or any authenticated user (if you want admin-level access)
-- TODO: Modify this to role-based if needed
CREATE POLICY "Authenticated users can update blog posts"
  ON blog_posts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authors can delete their own posts, or any authenticated user (if you want admin-level access)
CREATE POLICY "Authenticated users can delete blog posts"
  ON blog_posts
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- Seed Data (Optional example post)
-- ============================================================================

-- Example: Insert a sample blog post
-- INSERT INTO blog_posts (slug, title, excerpt, content, tags, meta_data, published, published_at) VALUES (
--   'welcome-to-skytech',
--   'Welcome to SkyTech Blog',
--   'Our first blog post introducing SkyTech and our mission.',
--   '{
--     "blocks": [
--       {
--         "type": "paragraph",
--         "content": "Welcome to the SkyTech blog! We are excited to share our journey with you."
--       },
--       {
--         "type": "heading",
--         "level": 2,
--         "content": "Our Mission"
--       },
--       {
--         "type": "paragraph",
--         "content": "At SkyTech, we build innovative solutions for the modern web."
--       }
--     ]
--   }'::jsonb,
--   ARRAY['announcement', 'welcome'],
--   '{
--     "metaTitle": "Welcome to SkyTech Blog",
--     "metaDescription": "Our first blog post introducing SkyTech and our mission."
--   }'::jsonb,
--   true,
--   NOW()
-- ) ON CONFLICT (slug) DO NOTHING;
