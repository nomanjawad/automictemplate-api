-- ============================================================================
-- Fix visitors_data Table - Simplify to match desired schema
-- This migration modifies the existing visitors_data table
-- ============================================================================

-- Drop the existing table if it has the wrong structure
DROP TABLE IF EXISTS visitors_data CASCADE;

-- Recreate with the correct simple structure
CREATE TABLE IF NOT EXISTS visitors_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Simple JSON objects for visitor tracking
  source JSONB,        -- Traffic source info (referrer, utm params, etc.)
  country JSONB,       -- Country information
  device_type JSONB,   -- Device type information

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Time-based queries (most common)
CREATE INDEX idx_visitors_created_at ON visitors_data(created_at DESC);

-- JSON field indexes for filtering
CREATE INDEX idx_visitors_source ON visitors_data USING GIN(source);
CREATE INDEX idx_visitors_country ON visitors_data USING GIN(country);
CREATE INDEX idx_visitors_device ON visitors_data USING GIN(device_type);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE visitors_data ENABLE ROW LEVEL SECURITY;

-- Only authenticated users (admins) can view analytics
CREATE POLICY "Authenticated users can view visitor data"
  ON visitors_data
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert visitor data
CREATE POLICY "Authenticated users can insert visitor data"
  ON visitors_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- Cleanup Function: Remove old data (Run monthly via cron)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_visitors_data(months_to_keep INTEGER DEFAULT 6)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM visitors_data
  WHERE created_at < NOW() - (months_to_keep || ' months')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_visitors_data IS
  'Deletes visitor data older than specified months. Default: 6 months.
   Usage: SELECT cleanup_old_visitors_data(6);';

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE visitors_data IS
  'Simple visitor analytics tracking with JSON objects for flexibility.
   Run cleanup_old_visitors_data() monthly to prevent table bloat.';

COMMENT ON COLUMN visitors_data.source IS
  'JSON object containing traffic source info:
   { "type": "direct|organic|social|referral", "referrer": "url", "utm_source": "...", etc. }';

COMMENT ON COLUMN visitors_data.country IS
  'JSON object containing country info:
   { "code": "PK", "name": "Pakistan", "region": "Punjab", "city": "Lahore", etc. }';

COMMENT ON COLUMN visitors_data.device_type IS
  'JSON object containing device info:
   { "type": "mobile|tablet|desktop", "os": "iOS", "browser": "Chrome", etc. }';
