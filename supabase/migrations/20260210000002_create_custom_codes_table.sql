-- ============================================================================
-- Create Custom Codes Table for Analytics and Meta Tags
-- Stores tracking codes, analytics scripts, and other custom code snippets
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL, -- 'analytics', 'meta', 'tracking', 'verification', 'custom'
  position TEXT NOT NULL, -- 'head', 'body_start', 'body_end'
  author_name TEXT,
  status BOOLEAN DEFAULT true, -- true = active, false = inactive
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_position CHECK (position IN ('head', 'body_start', 'body_end')),
  CONSTRAINT valid_type CHECK (type IN ('analytics', 'meta', 'tracking', 'verification', 'custom'))
);

-- Add indexes for performance
CREATE INDEX idx_custom_codes_status ON custom_codes(status);
CREATE INDEX idx_custom_codes_type ON custom_codes(type);
CREATE INDEX idx_custom_codes_position ON custom_codes(position);
CREATE INDEX idx_custom_codes_created_at ON custom_codes(created_at DESC);

-- Comments
COMMENT ON TABLE custom_codes IS 'Custom code snippets for analytics, meta tags, and tracking codes';
COMMENT ON COLUMN custom_codes.name IS 'Descriptive name for the code (e.g., "Google Analytics", "Facebook Pixel")';
COMMENT ON COLUMN custom_codes.code IS 'The actual code snippet to inject (HTML, JavaScript, etc.)';
COMMENT ON COLUMN custom_codes.type IS 'Type of code: analytics, meta, tracking, verification, or custom';
COMMENT ON COLUMN custom_codes.position IS 'Where to inject: head (in <head>), body_start (after <body>), body_end (before </body>)';
COMMENT ON COLUMN custom_codes.author_name IS 'Name of the person who created/last modified the code';
COMMENT ON COLUMN custom_codes.status IS 'Whether the code is active (true) or disabled (false)';

-- ============================================================================
-- Auto-update Updated_at Timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_custom_codes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_custom_codes_timestamp ON custom_codes;
CREATE TRIGGER trigger_update_custom_codes_timestamp
  BEFORE UPDATE ON custom_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_codes_timestamp();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE custom_codes ENABLE ROW LEVEL SECURITY;

-- Admin/authenticated users can read all codes
CREATE POLICY "Authenticated can read codes" ON custom_codes
  FOR SELECT TO authenticated
  USING (true);

-- Only authenticated users can create codes
CREATE POLICY "Authenticated can create codes" ON custom_codes
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update codes
CREATE POLICY "Authenticated can update codes" ON custom_codes
  FOR UPDATE TO authenticated
  USING (true);

-- Only authenticated users can delete codes
CREATE POLICY "Authenticated can delete codes" ON custom_codes
  FOR DELETE TO authenticated
  USING (true);

-- Optional: Allow public to read only ACTIVE codes (for frontend use)
-- CREATE POLICY "Public can read active codes" ON custom_codes
--   FOR SELECT USING (status = true);
