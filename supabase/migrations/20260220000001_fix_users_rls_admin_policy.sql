-- Fix RLS policies to allow service role / admin operations
-- This migration adds policies for admin users to manage other users

-- Add policy for service role to bypass RLS (explicit)
-- Service role should already bypass RLS, but this ensures it
DROP POLICY IF EXISTS "Service role can do anything" ON public.users;
CREATE POLICY "Service role can do anything"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add policy for admins to update any user
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
CREATE POLICY "Admins can update any user"
  ON public.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add policy for admins to delete any user
DROP POLICY IF EXISTS "Admins can delete any user" ON public.users;
CREATE POLICY "Admins can delete any user"
  ON public.users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add policy for admins to view any user
DROP POLICY IF EXISTS "Admins can view any user" ON public.users;
CREATE POLICY "Admins can view any user"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add comment
COMMENT ON POLICY "Service role can do anything" ON public.users IS 
  'Allows service role (backend) to perform any operation on users table';
COMMENT ON POLICY "Admins can update any user" ON public.users IS 
  'Allows admin users to update any user profile';
COMMENT ON POLICY "Admins can delete any user" ON public.users IS 
  'Allows admin users to delete any user account';
COMMENT ON POLICY "Admins can view any user" ON public.users IS 
  'Allows admin users to view any user profile';
