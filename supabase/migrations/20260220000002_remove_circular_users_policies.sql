-- Remove circular admin policies that cause infinite recursion
-- The SERVICE_ROLE_KEY already bypasses RLS, so we don't need these

-- Drop the problematic admin policies
DROP POLICY IF EXISTS "Admins can view any user" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Admins can delete any user" ON public.users;

-- Keep only the service role policy (which service_role doesn't actually need since it bypasses RLS)
-- But we'll keep it for explicitness
-- The other policies from the original migration should remain:
-- - "Users can view their own profile" 
-- - "Users can update their own profile"
-- - "Public profiles are viewable by everyone"
-- - "Users can insert their own profile"

-- Add comment explaining why we removed the admin policies
COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth.users. RLS policies for self-management. Backend uses service_role key to bypass RLS for admin operations.';
