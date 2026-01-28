-- 010_simplify_policies.sql

-- 1. Create a Helper Function (Security Definer)
-- This runs with the privileges of the creator (postgres/admin), bypassing RLS on user_roles.
CREATE OR REPLACE FUNCTION is_shul_admin(organization_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is owner/admin of the shul
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.shul_id = organization_id
    AND user_roles.user_id = auth.uid()
    AND user_roles.role IN ('owner', 'admin')
  );
END;
$$;

-- Grant execute to authenticated
GRANT EXECUTE ON FUNCTION is_shul_admin TO authenticated;

-- 2. Update payment_processors Policy
DROP POLICY IF EXISTS "Admins can manage processors" ON payment_processors;
DROP POLICY IF EXISTS "Debug Access" ON payment_processors; -- cleanup if any

CREATE POLICY "Admins can manage processors" ON payment_processors
  FOR ALL
  USING (
    shul_id IS NULL -- Platform processors check
    OR is_shul_admin(shul_id)
  )
  WITH CHECK (
    shul_id IS NULL
    OR is_shul_admin(shul_id)
  );

-- 3. Update payment_processor_credentials Policy
-- Credentials link to a processor. We need to check the processor's shul.
DROP POLICY IF EXISTS "Admins can manage credentials" ON payment_processor_credentials; -- if exists (was anonymous in prev migration?)

-- Enable RLS just in case
ALTER TABLE payment_processor_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage credentials" ON payment_processor_credentials
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM payment_processors pp
      WHERE pp.id = payment_processor_credentials.processor_id
      AND (pp.shul_id IS NULL OR is_shul_admin(pp.shul_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM payment_processors pp
      WHERE pp.id = payment_processor_credentials.processor_id
      AND (pp.shul_id IS NULL OR is_shul_admin(pp.shul_id))
    )
  );

-- 4. Also enable for other payment tables for consistency
CREATE POLICY "Admins can manage payment customers" ON payment_customers
  FOR ALL USING (is_shul_admin(shul_id)) WITH CHECK (is_shul_admin(shul_id));

CREATE POLICY "Admins can manage payment methods" ON payment_methods
  FOR ALL USING (is_shul_admin(shul_id)) WITH CHECK (is_shul_admin(shul_id));

