-- ==========================================
-- ShulGenius Schedule Schema
-- Version: 1.0
-- Date: 2026-01-27
-- ==========================================

-- ==========================================
-- 1. MINYAN SCHEDULES
-- Stores prayer times and classes
-- ==========================================
CREATE TABLE IF NOT EXISTS minyan_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shul_id UUID NOT NULL REFERENCES shuls(id) ON DELETE CASCADE,
    
    -- Schedule Details
    day_type TEXT NOT NULL,       -- 'sunday', 'monday', ..., 'rosh_chodesh', etc.
    service_type TEXT NOT NULL,   -- 'shacharis', 'mincha', 'maariv', 'shiur'
    time TEXT NOT NULL,           -- '7:00 AM', 'Sunset + 15', etc.
    is_zman BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    
    -- Additional Info
    notes TEXT,
    location TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_minyan_schedules_shul ON minyan_schedules(shul_id);
CREATE INDEX IF NOT EXISTS idx_minyan_schedules_day ON minyan_schedules(day_type);
CREATE INDEX IF NOT EXISTS idx_minyan_schedules_active ON minyan_schedules(shul_id) WHERE is_active = TRUE;

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE minyan_schedules ENABLE ROW LEVEL SECURITY;

-- Public Access: Anyone can read active schedules (if shul is public?)
-- Actually generic "Anyone" reading is fine for schedules usually, or check shul public flag.
-- For now allow public read for simplicity in public portal.

CREATE POLICY "Public can read schedules" ON minyan_schedules
    FOR SELECT USING (TRUE);

-- Admins: Full management
CREATE POLICY "Admins can manage schedules" ON minyan_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.shul_id = minyan_schedules.shul_id
            AND user_roles.user_id = auth.uid()
            AND user_roles.role IN ('owner', 'admin', 'gabbai')
        )
    );

-- Trigger: Update timestamps
DROP TRIGGER IF EXISTS minyan_schedules_updated_at ON minyan_schedules;
CREATE TRIGGER minyan_schedules_updated_at
    BEFORE UPDATE ON minyan_schedules
    FOR EACH ROW EXECUTE FUNCTION update_payment_updated_at(); -- Reusing existing function
