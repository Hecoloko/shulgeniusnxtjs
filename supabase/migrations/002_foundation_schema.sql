-- ==========================================
-- ShulGenius IMPROVED Foundation Schema
-- Version: 2.0 (Post LEGACY Analysis)
-- Date: 2026-01-27
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For trigram search

-- ==========================================
-- 1. SHULS (Organizations/Tenants)
-- ==========================================
CREATE TABLE IF NOT EXISTS shuls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT,
  legal_name TEXT,
  ein_tax_id TEXT,
  
  -- Contact
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#D97706',
  accent_color TEXT DEFAULT '#78716C',
  
  -- Settings & Features
  settings JSONB DEFAULT '{}'::jsonb,
  enabled_modules TEXT[] DEFAULT ARRAY['members', 'invoices', 'payments', 'dashboard'],
  
  -- Subscription
  subscription_tier TEXT DEFAULT 'basic',
  
  -- Audit
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shuls_slug ON shuls(slug);
CREATE INDEX IF NOT EXISTS idx_shuls_search ON shuls USING gin(to_tsvector('english', name || ' ' || COALESCE(display_name, '')));

-- RLS
ALTER TABLE shuls ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read shuls they belong to
CREATE POLICY "Users can read their shuls" ON shuls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.shul_id = shuls.id 
      AND user_roles.user_id = auth.uid()
    )
    OR 
    -- Public access for public portal
    archived_at IS NULL
  );

-- Policy: Owners can update their shul
CREATE POLICY "Admins can update their shul" ON shuls
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.shul_id = shuls.id 
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('owner', 'admin')
    )
  );

-- ==========================================
-- 2. USERS (Extended Profiles)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Preferences
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Trigger: Create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to avoid error on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==========================================
-- 3. USER_ROLES (Shul Access Control)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shul_id UUID NOT NULL REFERENCES shuls(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'gabbai', 'secretary', 'viewer', 'member')),
  permissions JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, shul_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_shul ON user_roles(shul_id);

-- RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their roles" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles in their shul" ON user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.shul_id = user_roles.shul_id
      AND ur.user_id = auth.uid()
      AND ur.role IN ('owner', 'admin')
    )
  );

-- ==========================================
-- 4. PEOPLE (Members) - Complete Schema
-- ==========================================
CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shul_id UUID NOT NULL REFERENCES shuls(id) ON DELETE CASCADE,
  
  -- Identity
  member_number TEXT,
  title TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  hebrew_name TEXT,
  hebrew_last_name TEXT,
  gender TEXT,
  date_of_birth DATE,
  kohen_levi_yisroel TEXT CHECK (kohen_levi_yisroel IN ('kohen', 'levi', 'yisroel', NULL)),
  
  -- Contact
  email TEXT,
  phone TEXT,
  cell TEXT,
  mobile TEXT,
  sms_enabled BOOLEAN DEFAULT TRUE,
  
  -- Address
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  
  -- Spouse
  spouse_first_name TEXT,
  spouse_last_name TEXT,
  spouse_title TEXT,
  
  -- Extended
  company TEXT,
  notes TEXT,
  tags_raw TEXT[],
  
  -- Family
  parent_family_id UUID REFERENCES people(id),
  
  -- Financial
  balance NUMERIC DEFAULT 0,
  last_donation NUMERIC,
  last_donation_date DATE,
  
  -- Search optimization
  search_vector TSVECTOR,
  
  -- Extensible metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  last_login TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_people_shul ON people(shul_id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_people_search ON people USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_people_email ON people(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_people_member_number ON people(shul_id, member_number);
CREATE INDEX IF NOT EXISTS idx_people_balance ON people(shul_id, balance) WHERE balance != 0;
CREATE INDEX IF NOT EXISTS idx_people_family ON people(parent_family_id) WHERE parent_family_id IS NOT NULL;

-- RLS
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shul members can read their people" ON people
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = people.shul_id
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage people" ON people
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = people.shul_id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('owner', 'admin', 'gabbai', 'secretary')
    )
  );

-- Trigger: Update search vector
CREATE OR REPLACE FUNCTION update_people_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.first_name, '') || ' ' ||
    COALESCE(NEW.last_name, '') || ' ' ||
    COALESCE(NEW.email, '') || ' ' ||
    COALESCE(NEW.phone, '') || ' ' ||
    COALESCE(NEW.member_number, '') || ' ' ||
    COALESCE(NEW.hebrew_name, '')
  );
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS people_search_vector_update ON people;
CREATE TRIGGER people_search_vector_update
  BEFORE INSERT OR UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION update_people_search_vector();

-- ==========================================
-- 5. CAMPAIGNS
-- ==========================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shul_id UUID NOT NULL REFERENCES shuls(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('general', 'building_fund', 'yizkor', 'kiddush', 'scholarship', 'other', NULL)),
  
  goal NUMERIC,
  raised NUMERIC DEFAULT 0,
  
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  
  -- Payment processor preferences
  processors UUID[],
  
  -- Extensible
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_shul ON campaigns(shul_id, status);

-- RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shul members can read campaigns" ON campaigns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = campaigns.shul_id
      AND user_roles.user_id = auth.uid()
    )
    OR status = 'active' -- Public campaigns visible for donation page
  );

CREATE POLICY "Admins can manage campaigns" ON campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = campaigns.shul_id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('owner', 'admin')
    )
  );

-- ==========================================
-- 6. ITEMS (Billable Catalog)
-- ==========================================
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shul_id UUID NOT NULL REFERENCES shuls(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('membership', 'aliyah', 'donation', 'event', 'other', NULL)),
  category TEXT,
  
  -- Stripe integration
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_items_shul ON items(shul_id, is_active);

-- RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shul members can read items" ON items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = items.shul_id
      AND user_roles.user_id = auth.uid()
    )
    OR is_active = TRUE -- Active items visible for public transactions
  );

CREATE POLICY "Admins can manage items" ON items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = items.shul_id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('owner', 'admin')
    )
  );

-- ==========================================
-- 7. INVOICES
-- ==========================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shul_id UUID NOT NULL REFERENCES shuls(id) ON DELETE CASCADE,
  
  invoice_number TEXT NOT NULL,
  customer_id UUID REFERENCES people(id),
  customer_name TEXT,
  customer_email TEXT,
  
  total_amount NUMERIC NOT NULL,
  balance NUMERIC NOT NULL,
  
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'void')),
  due_date DATE,
  
  -- Timestamps for workflow
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  
  -- Optimistic locking
  version INTEGER DEFAULT 1,
  
  -- PDF caching
  pdf_url TEXT,
  
  payment_link TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(shul_id, invoice_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_shul_status ON invoices(shul_id, status) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices(shul_id, due_date) WHERE status IN ('sent', 'partial', 'overdue');
CREATE INDEX IF NOT EXISTS idx_invoices_campaign ON invoices(campaign_id);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shul members can read invoices" ON invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = invoices.shul_id
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage invoices" ON invoices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = invoices.shul_id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('owner', 'admin', 'gabbai', 'secretary')
    )
  );

-- ==========================================
-- 8. INVOICE_ITEMS (Normalized Line Items)
-- ==========================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  
  item_id UUID REFERENCES items(id),
  campaign_id UUID REFERENCES campaigns(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- RLS (inherits from invoice)
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invoice items follow invoice access" ON invoice_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      JOIN user_roles ON user_roles.shul_id = invoices.shul_id
      WHERE invoices.id = invoice_items.invoice_id
      AND user_roles.user_id = auth.uid()
    )
  );

-- ==========================================
-- 9. PAYMENT_PROCESSORS
-- ==========================================
CREATE TABLE IF NOT EXISTS payment_processors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shul_id UUID REFERENCES shuls(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sola_ach', 'cardknox', 'stripe', 'manual')),
  
  -- Store sensitive credentials in Supabase Vault (reference only here)
  vault_secret_id UUID,
  
  -- Non-sensitive config
  config JSONB DEFAULT '{}'::jsonb,
  
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_processors_shul ON payment_processors(shul_id, is_active);

-- RLS
ALTER TABLE payment_processors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage processors" ON payment_processors
  FOR ALL
  USING (
    shul_id IS NULL -- Platform processors
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = payment_processors.shul_id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('owner', 'admin')
    )
  );

-- ==========================================
-- 10. PAYMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shul_id UUID NOT NULL REFERENCES shuls(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id),
  
  amount NUMERIC NOT NULL,
  processor_fee NUMERIC DEFAULT 0,
  
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  method TEXT NOT NULL CHECK (method IN ('card', 'ach', 'check', 'cash', 'wire', 'other')),
  
  processor_id UUID REFERENCES payment_processors(id),
  transaction_id TEXT,
  
  -- Idempotency
  idempotency_key TEXT UNIQUE,
  
  -- Payment application
  invoice_ids UUID[],
  
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Reconciliation
  reconciled_at TIMESTAMPTZ,
  
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_shul_date ON payments(shul_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_person ON payments(person_id);
CREATE INDEX IF NOT EXISTS idx_payments_idempotency ON payments(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_unreconciled ON payments(shul_id) WHERE reconciled_at IS NULL;

-- RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shul members can read payments" ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = payments.shul_id
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage payments" ON payments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = payments.shul_id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('owner', 'admin', 'gabbai', 'secretary')
    )
  );

-- ==========================================
-- 11. ACTIVITY_LOGS (Audit Trail)
-- ==========================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shul_id UUID NOT NULL REFERENCES shuls(id) ON DELETE CASCADE,
  
  user_id UUID REFERENCES users(id),
  user_email TEXT,
  
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_shul_date ON activity_logs(shul_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);

-- RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shul members can read activity logs" ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.shul_id = activity_logs.shul_id
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT
  WITH CHECK (TRUE);

-- ==========================================
-- 12. HELPER FUNCTIONS
-- ==========================================

-- Function: Log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_shul_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_log_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  SELECT email INTO v_user_email FROM users WHERE id = v_user_id;
  
  INSERT INTO activity_logs (shul_id, user_id, user_email, action, entity_type, entity_id, description, metadata)
  VALUES (p_shul_id, v_user_id, v_user_email, p_action, p_entity_type, p_entity_id, p_description, p_metadata)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's accessible shuls
CREATE OR REPLACE FUNCTION get_user_shuls()
RETURNS TABLE (
  shul_id UUID,
  shul_name TEXT,
  shul_slug TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as shul_id,
    s.name as shul_name,
    s.slug as shul_slug,
    ur.role
  FROM user_roles ur
  JOIN shuls s ON s.id = ur.shul_id
  WHERE ur.user_id = auth.uid()
  AND s.archived_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(p_shul_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
  v_year TEXT;
BEGIN
  v_year := to_char(NOW(), 'YYYY');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM invoices
  WHERE shul_id = p_shul_id
  AND invoice_number LIKE v_year || '-%';
  
  RETURN v_year || '-' || LPAD(v_count::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 13. SEED DEFAULT DATA
-- ==========================================

-- Note: This would be run separately for new shul setup
-- INSERT INTO campaigns (shul_id, name, type, status) VALUES
--   (:shul_id, 'General Fund', 'general', 'active'),
--   (:shul_id, 'Building Fund', 'building_fund', 'active');

-- INSERT INTO items (shul_id, name, price, type) VALUES
--   (:shul_id, 'Aliyah', 18.00, 'aliyah'),
--   (:shul_id, 'Maftir', 36.00, 'aliyah'),
--   (:shul_id, 'Annual Membership', 500.00, 'membership');
