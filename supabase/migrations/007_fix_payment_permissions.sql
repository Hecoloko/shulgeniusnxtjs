-- 007_fix_payment_permissions.sql

-- Ensure permissions are granted to authenticated users
GRANT ALL ON TABLE payment_processors TO authenticated;
GRANT ALL ON TABLE payment_processor_credentials TO authenticated;
GRANT ALL ON TABLE payment_customers TO authenticated;
GRANT ALL ON TABLE payment_methods TO authenticated;
GRANT ALL ON TABLE payment_schedules TO authenticated;
GRANT ALL ON TABLE payment_transactions TO authenticated;
GRANT ALL ON TABLE payment_webhook_events TO authenticated;

-- Ensure sequences are accessible if using serials (we use UUIDs so fine, but good practice)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Fix RLS for payment_processors just in case
-- We drop the policy first to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage processors" ON payment_processors;

-- Recreate policy with explicit permissions
CREATE POLICY "Admins can manage processors" ON payment_processors
  FOR ALL
  USING (
    shul_id IS NULL -- Platform processors are visible/manageable? maybe read only?
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = payment_processors.shul_id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('owner', 'admin')
    )
  );

-- Also ensure user_roles allows admins to see their own roles for the check above to work
-- The existing policy "Admins can manage roles in their shul" covers this.
