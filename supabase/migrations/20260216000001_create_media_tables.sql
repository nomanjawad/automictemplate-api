-- ==========================================================================
-- Create Media Folders and Media Tables
-- Stores image metadata and folder types for Supabase Storage
-- ==========================================================================

CREATE TABLE IF NOT EXISTS media_folders (
  name TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT media_folder_name_format CHECK (name = lower(name) AND name ~ '^[a-z0-9][a-z0-9_-]*$')
);

COMMENT ON TABLE media_folders IS 'Folder types available in the Supabase storage bucket';
COMMENT ON COLUMN media_folders.name IS 'Folder name/type (lowercase, URL-safe)';

CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  alt_text TEXT,
  type TEXT NOT NULL REFERENCES media_folders(name) ON UPDATE CASCADE ON DELETE RESTRICT,
  author_name TEXT NOT NULL,
  upload_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  path TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT media_path_unique UNIQUE (path)
);

COMMENT ON TABLE media IS 'Media library items stored in Supabase Storage';
COMMENT ON COLUMN media.title IS 'Display title for the image';
COMMENT ON COLUMN media.description IS 'Optional description of the image';
COMMENT ON COLUMN media.alt_text IS 'Alt text for accessibility';
COMMENT ON COLUMN media.type IS 'Folder/type where the image is stored';
COMMENT ON COLUMN media.author_name IS 'Name of the user who uploaded the image';
COMMENT ON COLUMN media.upload_date IS 'Date the image was uploaded';
COMMENT ON COLUMN media.path IS 'Storage path inside the bucket (folder/filename)';
COMMENT ON COLUMN media.url IS 'Public URL for the stored image';
COMMENT ON COLUMN media.size IS 'File size in bytes';
COMMENT ON COLUMN media.mime_type IS 'Uploaded MIME type';

-- Indexes
CREATE INDEX idx_media_type ON media(type);
CREATE INDEX idx_media_author_name ON media(author_name);
CREATE INDEX idx_media_upload_date ON media(upload_date DESC);
CREATE INDEX idx_media_created_at ON media(created_at DESC);

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_media_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_media_timestamp ON media;
CREATE TRIGGER trigger_update_media_timestamp
  BEFORE UPDATE ON media
  FOR EACH ROW
  EXECUTE FUNCTION update_media_timestamp();

-- Row Level Security (RLS)
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can read media folders" ON media_folders
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Public can read media" ON media
  FOR SELECT TO anon
  USING (true);

-- Authenticated read access
CREATE POLICY "Authenticated can read media folders" ON media_folders
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can read media" ON media
  FOR SELECT TO authenticated
  USING (true);

-- Authenticated write access
CREATE POLICY "Authenticated can create media folders" ON media_folders
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete media folders" ON media_folders
  FOR DELETE TO authenticated
  USING (true);

CREATE POLICY "Authenticated can create media" ON media
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update media" ON media
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete media" ON media
  FOR DELETE TO authenticated
  USING (true);

-- Seed initial folder types
INSERT INTO media_folders (name)
VALUES ('blog'), ('page'), ('event'), ('gallery')
ON CONFLICT (name) DO NOTHING;
