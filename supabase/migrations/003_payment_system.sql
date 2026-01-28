-- ==========================================
-- ShulGenius Payment System Schema
-- Version: 3.0 (Simplified Cardknox Integration)
-- Date: 2026-01-27
-- ==========================================

-- ==========================================
-- 1. PAYMENT PROCESSOR CREDENTIALS
-- Stores API keys (encrypted via app layer)
-- ==========================================
CREATE TABLE IF NOT EXISTS payment_processor_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processor_id UUID NOT NULL REFERENCES payment_processors(id) ON DELETE CASCADE,
  
  -- Cardknox Keys (stored encrypted)
  transaction_key TEXT,      -- xKey (used server-side only)
  ifields_key TEXT,          -- xIFieldsKey (safe for frontend)
  recurring_key TEXT,        -- For Sola Recurring API
  
  -- Software Info (required by Cardknox)
  software_name TEXT DEFAULT 'ShulGenius',
  software_version TEXT DEFAULT '2.0.0',
  
  -- Webhook Configuration
  webhook_secret TEXT,
  webhook_url TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(processor_id)
);

-- ==========================================
-- 2. PAYMENT CUSTOMERS
-- Links people to Cardknox customer records
-- One customer per person per processor
-- ==========================================
CREATE TABLE IF NOT EXISTS payment_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shul_id UUID NOT NULL REFERENCES shuls(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  processor_id UUID NOT NULL REFERENCES payment_processors(id) ON DELETE CASCADE,
  
  -- Cardknox Customer Reference
  external_customer_id TEXT NOT NULL,
  external_customer_number TEXT,
  
  -- Contact info at creation time (for sync reference)
  email TEXT,
  name TEXT,
  
  -- Sync tracking
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_error TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- CRITICAL: One customer per person per processor
  -- This prevents the "payments going to wrong account" bug
  UNIQUE(person_id, processor_id)
);

-- ==========================================
-- 3. PAYMENT METHODS
-- Saved cards and ACH accounts
-- ==========================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shul_id UUID NOT NULL REFERENCES shuls(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  processor_id UUID NOT NULL REFERENCES payment_processors(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES payment_customers(id) ON DELETE CASCADE,
  
  -- Cardknox Token (the persistent token for charging)
  external_token TEXT NOT NULL,
  external_method_id TEXT,
  
  -- Type
  type TEXT NOT NULL CHECK (type IN ('card', 'ach')),
  
  -- Card Details
  brand TEXT,                -- 'visa', 'mastercard', 'amex', 'discover'
  last4 TEXT NOT NULL,
  exp_month INTEGER,
  exp_year INTEGER,
  
  -- ACH Details (if applicable)
  bank_name TEXT,
  account_type TEXT,         -- 'checking', 'savings'
  
  -- Display
  label TEXT,                -- User-friendly name like "Corporate Visa"
  cardholder_name TEXT,
  
  -- Status
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. PAYMENT SCHEDULES
-- Recurring payment configurations
-- ==========================================
CREATE TABLE IF NOT EXISTS payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shul_id UUID NOT NULL REFERENCES shuls(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  processor_id UUID NOT NULL REFERENCES payment_processors(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
  
  -- Cardknox Schedule Reference
  external_schedule_id TEXT NOT NULL,
  
  -- Amount and Frequency
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'USD',
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  interval_count INTEGER DEFAULT 1,
  
  -- Scheduling
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_run_date DATE,
  end_date DATE,
  total_payments INTEGER,
  payments_made INTEGER DEFAULT 0,
  
  -- Purpose
  campaign_id UUID REFERENCES campaigns(id),
  description TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'canceled', 'completed', 'failed')),
  last_error TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. PAYMENT TRANSACTIONS LOG
-- Detailed record of all payment attempts
-- ==========================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shul_id UUID NOT NULL REFERENCES shuls(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id),
  processor_id UUID REFERENCES payment_processors(id),
  
  -- Link to payment record (if successful)
  payment_id UUID REFERENCES payments(id),
  
  -- Links
  invoice_id UUID REFERENCES invoices(id),
  schedule_id UUID REFERENCES payment_schedules(id),
  payment_method_id UUID REFERENCES payment_methods(id),
  
  -- Transaction Details
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- External References
  external_transaction_id TEXT,     -- Cardknox xRefNum
  external_batch_id TEXT,           -- Batch ID
  
  -- Result
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'approved', 'declined', 'error', 'voided', 'refunded')),
  response_code TEXT,
  response_message TEXT,
  avs_result TEXT,
  cvv_result TEXT,
  
  -- Card Info (at time of transaction)
  card_brand TEXT,
  card_last4 TEXT,
  
  -- Fees
  processor_fee NUMERIC DEFAULT 0,
  
  -- Request/Response for debugging
  request_payload JSONB DEFAULT '{}'::jsonb,
  response_payload JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. WEBHOOK EVENTS
-- Log of all incoming webhook events
-- ==========================================
CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processor_id UUID REFERENCES payment_processors(id),
  
  -- Event Details
  event_type TEXT NOT NULL,
  event_id TEXT,              -- External event ID for deduplication
  
  -- Payload
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Processing
  processed_at TIMESTAMPTZ,
  process_error TEXT,
  
  -- Links (populated after processing)
  payment_id UUID REFERENCES payments(id),
  transaction_id UUID REFERENCES payment_transactions(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================

-- Payment Customers
CREATE INDEX IF NOT EXISTS idx_payment_customers_person ON payment_customers(person_id);
CREATE INDEX IF NOT EXISTS idx_payment_customers_processor ON payment_customers(processor_id);
CREATE INDEX IF NOT EXISTS idx_payment_customers_shul ON payment_customers(shul_id);

-- Payment Methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_person ON payment_methods(person_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_processor ON payment_methods(processor_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_customer ON payment_methods(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(person_id) WHERE is_active = TRUE;

-- Payment Schedules
CREATE INDEX IF NOT EXISTS idx_payment_schedules_person ON payment_schedules(person_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_active ON payment_schedules(next_run_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_payment_schedules_processor ON payment_schedules(processor_id);

-- Payment Transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_shul_date ON payment_transactions(shul_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_person ON payment_transactions(person_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_external ON payment_transactions(external_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status, created_at DESC);

-- Webhook Events
CREATE INDEX IF NOT EXISTS idx_webhook_events_processor ON payment_webhook_events(processor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON payment_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_unprocessed ON payment_webhook_events(created_at) WHERE processed_at IS NULL;

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE payment_processor_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- Credentials: Only admins (and service role for edge functions)
CREATE POLICY "Admins manage processor credentials" ON payment_processor_credentials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM payment_processors pp
      JOIN user_roles ur ON ur.shul_id = pp.shul_id
      WHERE pp.id = payment_processor_credentials.processor_id
      AND ur.user_id = auth.uid()
      AND ur.role IN ('owner', 'admin')
    )
  );

-- Customers: Shul members can read
CREATE POLICY "Shul members can read customers" ON payment_customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = payment_customers.shul_id
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage customers" ON payment_customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = payment_customers.shul_id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('owner', 'admin', 'gabbai', 'secretary')
    )
  );

-- Payment Methods: Shul members can read
CREATE POLICY "Shul members can read payment methods" ON payment_methods
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = payment_methods.shul_id
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage payment methods" ON payment_methods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = payment_methods.shul_id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('owner', 'admin', 'gabbai', 'secretary')
    )
  );

-- Schedules: Shul members can read
CREATE POLICY "Shul members can read schedules" ON payment_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = payment_schedules.shul_id
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage schedules" ON payment_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = payment_schedules.shul_id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('owner', 'admin', 'gabbai', 'secretary')
    )
  );

-- Transactions: Shul members can read
CREATE POLICY "Shul members can read transactions" ON payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = payment_transactions.shul_id
      AND user_roles.user_id = auth.uid()
    )
  );

-- Insert via service role only (edge functions)
CREATE POLICY "Service role inserts transactions" ON payment_transactions
  FOR INSERT WITH CHECK (TRUE);

-- Webhook Events: Admin view only
CREATE POLICY "Admins can view webhook events" ON payment_webhook_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM payment_processors pp
      JOIN user_roles ur ON ur.shul_id = pp.shul_id
      WHERE pp.id = payment_webhook_events.processor_id
      AND ur.user_id = auth.uid()
      AND ur.role IN ('owner', 'admin')
    )
  );

-- Insert via service role only
CREATE POLICY "Service role inserts webhook events" ON payment_webhook_events
  FOR INSERT WITH CHECK (TRUE);

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Function: Get processor for a transaction
-- This implements the simplified logic: 
-- 1. Check campaign-specific processor
-- 2. Fall back to shul default
CREATE OR REPLACE FUNCTION get_payment_processor(
  p_shul_id UUID,
  p_campaign_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_processor_id UUID;
BEGIN
  -- 1. Check campaign-specific processor
  IF p_campaign_id IS NOT NULL THEN
    SELECT processors[1] INTO v_processor_id
    FROM campaigns
    WHERE id = p_campaign_id
    AND processors IS NOT NULL
    AND array_length(processors, 1) > 0;
    
    IF v_processor_id IS NOT NULL THEN
      RETURN v_processor_id;
    END IF;
  END IF;
  
  -- 2. Fall back to shul default
  SELECT id INTO v_processor_id
  FROM payment_processors
  WHERE shul_id = p_shul_id
  AND is_default = TRUE
  AND is_active = TRUE
  LIMIT 1;
  
  -- 3. If no default, get any active processor
  IF v_processor_id IS NULL THEN
    SELECT id INTO v_processor_id
    FROM payment_processors
    WHERE shul_id = p_shul_id
    AND is_active = TRUE
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;
  
  RETURN v_processor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get or create payment customer
-- Ensures we always have a customer record before charging
CREATE OR REPLACE FUNCTION get_payment_customer(
  p_person_id UUID,
  p_processor_id UUID
) RETURNS UUID AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  SELECT id INTO v_customer_id
  FROM payment_customers
  WHERE person_id = p_person_id
  AND processor_id = p_processor_id;
  
  RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update timestamps
CREATE OR REPLACE FUNCTION update_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_customers_updated_at ON payment_customers;
CREATE TRIGGER payment_customers_updated_at
  BEFORE UPDATE ON payment_customers
  FOR EACH ROW EXECUTE FUNCTION update_payment_updated_at();

DROP TRIGGER IF EXISTS payment_methods_updated_at ON payment_methods;
CREATE TRIGGER payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_payment_updated_at();

DROP TRIGGER IF EXISTS payment_schedules_updated_at ON payment_schedules;
CREATE TRIGGER payment_schedules_updated_at
  BEFORE UPDATE ON payment_schedules
  FOR EACH ROW EXECUTE FUNCTION update_payment_updated_at();

DROP TRIGGER IF EXISTS payment_processor_credentials_updated_at ON payment_processor_credentials;
CREATE TRIGGER payment_processor_credentials_updated_at
  BEFORE UPDATE ON payment_processor_credentials
  FOR EACH ROW EXECUTE FUNCTION update_payment_updated_at();

-- ==========================================
-- NOTES
-- ==========================================
-- 
-- This schema implements a SIMPLIFIED payment architecture:
-- 
-- 1. ONE processor per shul is the default (with campaign overrides)
-- 2. ONE customer per person per processor (prevents cross-account issues)
-- 3. All external tokens are tied to a specific processor
-- 4. Transaction log captures all payment attempts (success and failure)
-- 5. Webhook events are logged for debugging and reconciliation
--
-- The edge functions handle:
-- - Customer creation in Cardknox (synced to payment_customers)
-- - Payment method creation (synced to payment_methods)
-- - Transaction processing (logged to payment_transactions)
-- - Recurring schedule management (synced to payment_schedules)
