-- 009_ensure_users_and_roles.sql

-- 1. Ensure all auth users have specific public user records
INSERT INTO public.users (id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Get the default shul ID
DO $$
DECLARE
  v_default_shul_id UUID;
BEGIN
  SELECT id INTO v_default_shul_id FROM shuls WHERE slug = 'default' LIMIT 1;

  -- 3. Grant 'owner' role to all existing users for the default shul
  -- This is a dev-environment fix to ensure access
  IF v_default_shul_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, shul_id, role)
    SELECT id, v_default_shul_id, 'owner'
    FROM public.users
    ON CONFLICT (user_id, shul_id) DO UPDATE SET role = 'owner';
  END IF;
END $$;
