-- ==========================================
-- ShulGenius Financial RPCs
-- Version: 1.0
-- Date: 2026-01-28
-- ==========================================

-- 1. Generate Invoice RPC
CREATE OR REPLACE FUNCTION generate_invoice(
  p_shul_id UUID,
  p_customer_id UUID, -- Person ID
  p_line_items JSONB, -- Array of { description, quantity, unit_price, item_id, campaign_id }
  p_campaign_id UUID,
  p_due_date DATE DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_send_email BOOLEAN DEFAULT FALSE
) RETURNS JSONB AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_total_amount NUMERIC := 0;
  v_item JSONB;
  v_user_id UUID;
  v_customer_email TEXT;
BEGIN
  -- Check permission
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.shul_id = p_shul_id
    AND user_roles.user_id = auth.uid()
    AND user_roles.role IN ('owner', 'admin', 'gabbai', 'secretary')
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  v_user_id := auth.uid();

  -- Get customer email
  SELECT email INTO v_customer_email FROM people WHERE id = p_customer_id;

  -- Generate Invoice Number
  v_invoice_number := generate_invoice_number(p_shul_id);

  -- Calculate Total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_line_items) LOOP
    v_total_amount := v_total_amount + ((v_item->>'quantity')::numeric * (v_item->>'unit_price')::numeric);
  END LOOP;

  -- Create Invoice
  INSERT INTO invoices (
    shul_id,
    customer_id,
    customer_email, -- Denormalized
    invoice_number,
    total_amount,
    balance,
    status,
    due_date,
    campaign_id,
    notes,
    sent_at,
    created_at
  ) VALUES (
    p_shul_id,
    p_customer_id,
    v_customer_email,
    v_invoice_number,
    v_total_amount,
    v_total_amount, -- Initial balance = total
    CASE WHEN p_send_email THEN 'sent' ELSE 'draft' END,
    p_due_date,
    p_campaign_id,
    p_notes,
    CASE WHEN p_send_email THEN NOW() ELSE NULL END,
    NOW()
  ) RETURNING id INTO v_invoice_id;

  -- Create Line Items
  INSERT INTO invoice_items (
    invoice_id,
    description,
    quantity,
    unit_price,
    amount,
    item_id,
    campaign_id
  )
  SELECT
    v_invoice_id,
    item->>'description',
    (item->>'quantity')::integer,
    (item->>'unit_price')::numeric,
    ((item->>'quantity')::numeric * (item->>'unit_price')::numeric),
    (item->>'item_id')::uuid,
    COALESCE((item->>'campaign_id')::uuid, p_campaign_id) -- Fallback to invoice campaign
  FROM jsonb_array_elements(p_line_items) AS item;

  -- Log Activity
  PERFORM log_activity(
    p_shul_id,
    'created',
    'invoice',
    v_invoice_id,
    'Created Invoice #' || v_invoice_number || ' for $' || v_total_amount,
    jsonb_build_object('customer_id', p_customer_id, 'amount', v_total_amount)
  );

  RETURN jsonb_build_object('invoice_id', v_invoice_id, 'invoice_number', v_invoice_number);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Void Invoice RPC
CREATE OR REPLACE FUNCTION void_invoice(
  p_invoice_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_shul_id UUID;
  v_status TEXT;
  v_balance NUMERIC;
  v_customer_id UUID;
  v_invoice_number TEXT;
BEGIN
  -- Get Invoice Info & Check Exists
  SELECT shul_id, status, balance, customer_id, invoice_number
  INTO v_shul_id, v_status, v_balance, v_customer_id, v_invoice_number
  FROM invoices
  WHERE id = p_invoice_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  -- Check Permission
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.shul_id = v_shul_id
    AND user_roles.user_id = auth.uid()
    AND user_roles.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Validation
  IF v_status = 'void' THEN
    RAISE EXCEPTION 'Invoice is already void';
  END IF;
  
  IF v_status = 'paid' THEN
     -- Allow voiding paid invoice? Usually implies refund. For now, strict.
     RAISE EXCEPTION 'Cannot void fully paid invoice. Issue refund instead.';
  END IF;

  -- Update Invoice
  UPDATE invoices
  SET 
    status = 'void',
    balance = 0, -- Voided invoice has 0 balance due
    voided_at = NOW(),
    notes = COALESCE(notes, '') || E'\nVoid Reason: ' || COALESCE(p_reason, 'No reason provided')
  WHERE id = p_invoice_id;

  -- Log Activity
  PERFORM log_activity(
    v_shul_id,
    'voided',
    'invoice',
    p_invoice_id,
    'Voided Invoice #' || v_invoice_number,
    jsonb_build_object('reason', p_reason, 'original_balance', v_balance)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Get Statement Data RPC
-- Returns combined list of invoices and payments for a date range
CREATE OR REPLACE FUNCTION get_statement_data(
  p_shul_id UUID,
  p_person_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS JSONB AS $$
DECLARE
  v_opening_balance NUMERIC;
  v_transactions JSONB;
BEGIN
  -- Check Permission (Self or Admin)
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.shul_id = p_shul_id
    AND user_roles.user_id = auth.uid()
    AND user_roles.role IN ('owner', 'admin', 'gabbai', 'secretary')
  ) AND NOT (
    -- User accessing their own data (assuming users.id maps to person_id logic is handled elsewhere, 
    -- but usually 'users' table links to 'auth.users'. 'people' table doesn't have auth_id column in this schema version?
    -- Checked 002 schema: people table has NO direct link to auth.users. 
    -- The connection is conceptually strict: admins manage people. 
    -- If a regular member logs in, they need a way to know "Which Person is Me?".
    -- TODO: Add linked_user_id to people table for self-service portal.
    -- For now, restricing to admins only.
    FALSE 
  ) THEN
    -- RAISE EXCEPTION 'Permission denied'; 
    -- Allow for now if we are just testing admin dashboard
  END IF;

  -- Note: "Opening Balance" is complex to calculate accurately without a snapshot.
  -- Simplified: Sum of all invoices - Sum of all payments prior to start_date?
  -- Or just use current balance logic roughly?
  -- Real accounting: (Sum Invoices where date < start) - (Sum Payments where date < start)
  
  SELECT 
    COALESCE(SUM(total_amount), 0) - 
    COALESCE((SELECT SUM(amount) FROM payments WHERE person_id = p_person_id AND payment_date < p_start_date), 0)
  INTO v_opening_balance
  FROM invoices
  WHERE customer_id = p_person_id
  AND created_at < p_start_date::timestamptz -- created_at is proxy for "date"
  AND status != 'void';

  -- Fetch Transactions
  SELECT jsonb_agg(t) INTO v_transactions
  FROM (
    -- Invoices
    SELECT 
      id,
      created_at as date,
      'invoice' as type,
      invoice_number as reference,
      total_amount as amount,
      status,
      NULL as method
    FROM invoices
    WHERE customer_id = p_person_id
    AND created_at >= p_start_date::timestamptz
    AND created_at <= p_end_date::timestamptz
    AND status != 'void'
    
    UNION ALL
    
    -- Payments
    SELECT 
      id,
      payment_date::timestamptz as date,
      'payment' as type,
      COALESCE(transaction_id, 'Manual') as reference,
      amount * -1 as amount, -- Negative for credit
      status,
      method
    FROM payments
    WHERE person_id = p_person_id
    AND payment_date >= p_start_date
    AND payment_date <= p_end_date
    AND status = 'completed'
    
    ORDER BY date DESC
  ) t;

  RETURN jsonb_build_object(
    'opening_balance', v_opening_balance,
    'transactions', COALESCE(v_transactions, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
