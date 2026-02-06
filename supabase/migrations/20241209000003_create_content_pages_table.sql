-- ============================================================================
-- Content Pages Table
-- Stores page-specific JSON content (home, about, contact, gallery, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,  -- 'home', 'about', 'contact', 'gallery', etc.
  title TEXT NOT NULL,         -- Page title for reference
  data JSONB NOT NULL,         -- JSON content validated by @atomictemplate/validations page schemas
  meta_data JSONB,             -- SEO metadata (title, description, og tags, etc.)
  published BOOLEAN DEFAULT false,  -- Draft/published status
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by slug (most common query)
CREATE INDEX idx_content_pages_slug ON content_pages(slug);

-- Index for listing published pages
CREATE INDEX idx_content_pages_published ON content_pages(published) WHERE published = true;

-- Index for timestamp-based queries
CREATE INDEX idx_content_pages_updated_at ON content_pages(updated_at DESC);

-- ============================================================================
-- Trigger: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_content_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_content_pages_timestamp
  BEFORE UPDATE ON content_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_content_pages_updated_at();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;

-- Public read access for published pages only
CREATE POLICY "Public users can view published pages"
  ON content_pages
  FOR SELECT
  USING (published = true);

-- Authenticated users can view all pages (including drafts)
CREATE POLICY "Authenticated users can view all pages"
  ON content_pages
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert/update/delete pages
-- TODO: Add role-based check if you want only admins to modify
CREATE POLICY "Authenticated users can insert pages"
  ON content_pages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update pages"
  ON content_pages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete pages"
  ON content_pages
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- Seed Data (Optional starter pages)
-- ============================================================================

-- Example: Insert a default home page structure
-- INSERT INTO content_pages (slug, title, data, meta_data, published) VALUES (
--   'home',
--   'Home Page',
--   '{
--     "hero": {
--       "title": "Welcome to SkyTech",
--       "description": "Building the future with technology",
--       "backgroundImageUrl": "/hero-bg.jpg"
--     },
--     "features": [],
--     "cta": {
--       "ctaTitle": "Get Started Today",
--       "ctaButton": {"text": "Learn More", "url": "/contact"}
--     }
--   }'::jsonb,
--   '{
--     "metaTitle": "Home - SkyTech",
--     "metaDescription": "Welcome to SkyTech - Building the future with technology"
--   }'::jsonb,
--   true
-- ) ON CONFLICT (slug) DO NOTHING;
