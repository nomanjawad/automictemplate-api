-- ============================================================================
-- Content Common Table
-- Stores reusable JSON content blocks (header, footer, global CTA, banner, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_common (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,  -- 'header', 'footer', 'globalCta', 'banner', etc.
  data JSONB NOT NULL,       -- JSON content validated by @atomictemplate/validations schemas
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by key
CREATE INDEX idx_content_common_key ON content_common(key);

-- Index for timestamp-based queries
CREATE INDEX idx_content_common_updated_at ON content_common(updated_at DESC);

-- ============================================================================
-- Trigger: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_content_common_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_content_common_timestamp
  BEFORE UPDATE ON content_common
  FOR EACH ROW
  EXECUTE FUNCTION update_content_common_updated_at();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE content_common ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view common content)
CREATE POLICY "Public users can view common content"
  ON content_common
  FOR SELECT
  USING (true);

-- Authenticated users can insert/update/delete (admin-level access)
-- TODO: Add role-based check if you want only admins to modify
CREATE POLICY "Authenticated users can insert common content"
  ON content_common
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update common content"
  ON content_common
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete common content"
  ON content_common
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- Seed Data (Optional starter content)
-- ============================================================================

-- Example: Insert a default header structure
-- INSERT INTO content_common (key, data) VALUES (
--   'header',
--   '{
--     "logo": "/logo.png",
--     "navigation": [
--       {"text": "Home", "url": "/"},
--       {"text": "About", "url": "/about"},
--       {"text": "Contact", "url": "/contact"}
--     ]
--   }'::jsonb
-- ) ON CONFLICT (key) DO NOTHING;
