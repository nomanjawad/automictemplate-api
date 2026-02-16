-- ==========================================================================
-- Fix RLS Policies to Allow Service Role
-- The SERVICE_ROLE_KEY should bypass RLS, but explicitly allowing it
-- ensures backend operations work correctly
-- ==========================================================================

-- ============================================================================
-- Fix Media Table Policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated can create media" ON media;
DROP POLICY IF EXISTS "Authenticated can update media" ON media;
DROP POLICY IF EXISTS "Authenticated can delete media" ON media;

-- Recreate policies to allow both authenticated AND service role
CREATE POLICY "Authenticated and service can create media" ON media
  FOR INSERT TO authenticated, service_role
  WITH CHECK (true);

CREATE POLICY "Authenticated and service can update media" ON media
  FOR UPDATE TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated and service can delete media" ON media
  FOR DELETE TO authenticated, service_role
  USING (true);

-- ============================================================================
-- Fix Media Folders Policies
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated can create media folders" ON media_folders;
DROP POLICY IF EXISTS "Authenticated can delete media folders" ON media_folders;

CREATE POLICY "Authenticated and service can create folders" ON media_folders
  FOR INSERT TO authenticated, service_role
  WITH CHECK (true);

CREATE POLICY "Authenticated and service can delete folders" ON media_folders
  FOR DELETE TO authenticated, service_role
  USING (true);

-- ============================================================================
-- Fix Blog Posts Policies
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can create blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can update blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can delete blog posts" ON blog_posts;

CREATE POLICY "Authenticated and service can create blog posts" ON blog_posts
  FOR INSERT TO authenticated, service_role
  WITH CHECK (true);

CREATE POLICY "Authenticated and service can update blog posts" ON blog_posts
  FOR UPDATE TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated and service can delete blog posts" ON blog_posts
  FOR DELETE TO authenticated, service_role
  USING (true);

-- ============================================================================
-- Fix Blog Categories Policies
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated can create categories" ON blog_categories;
DROP POLICY IF EXISTS "Authenticated can update categories" ON blog_categories;

CREATE POLICY "Authenticated and service can create categories" ON blog_categories
  FOR INSERT TO authenticated, service_role
  WITH CHECK (true);

CREATE POLICY "Authenticated and service can update categories" ON blog_categories
  FOR UPDATE TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Fix Blog Tags Policies
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated can create tags" ON blog_tags;
DROP POLICY IF EXISTS "Authenticated can update tags" ON blog_tags;

CREATE POLICY "Authenticated and service can create tags" ON blog_tags
  FOR INSERT TO authenticated, service_role
  WITH CHECK (true);

CREATE POLICY "Authenticated and service can update tags" ON blog_tags
  FOR UPDATE TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Fix Blog Post Tags Policies
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated can manage post tags" ON blog_post_tags;
DROP POLICY IF EXISTS "Authenticated can delete post tags" ON blog_post_tags;

CREATE POLICY "Authenticated and service can manage post tags" ON blog_post_tags
  FOR INSERT TO authenticated, service_role
  WITH CHECK (true);

CREATE POLICY "Authenticated and service can delete post tags" ON blog_post_tags
  FOR DELETE TO authenticated, service_role
  USING (true);
