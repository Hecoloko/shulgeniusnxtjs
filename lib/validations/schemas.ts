import { z } from 'zod'

// ===========================================
// SHUL SCHEMAS
// ===========================================
export const shulSchema = z.object({
    id: z.string().uuid().optional(),
    slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
    name: z.string().min(2).max(200),
    display_name: z.string().max(200).optional().nullable(),
    legal_name: z.string().max(200).optional().nullable(),
    ein_tax_id: z.string().max(20).optional().nullable(),
    email: z.string().email().optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    state: z.string().max(50).optional().nullable(),
    zip: z.string().max(20).optional().nullable(),
    country: z.string().max(50).optional().nullable(),
    logo_url: z.string().url().optional().nullable(),
    primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
    accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
    settings: z.record(z.string(), z.unknown()).optional().nullable(),
    enabled_modules: z.array(z.string()).optional().nullable(),
    subscription_tier: z.enum(['basic', 'pro', 'enterprise']).optional().nullable(),
})

export type ShulInput = z.infer<typeof shulSchema>

// ===========================================
// USER SCHEMAS
// ===========================================
export const userRoleSchema = z.object({
    id: z.string().uuid().optional(),
    user_id: z.string().uuid(),
    shul_id: z.string().uuid(),
    role: z.enum(['owner', 'admin', 'gabbai', 'secretary', 'viewer']),
    permissions: z.record(z.string(), z.unknown()).optional().nullable(),
})

export type UserRoleInput = z.infer<typeof userRoleSchema>

// ===========================================
// PERSON (MEMBER) SCHEMAS
// ===========================================
export const personSchema = z.object({
    id: z.string().uuid().optional(),
    shul_id: z.string().uuid(),
    member_number: z.string().max(50).optional().nullable(),
    title: z.enum(['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Rabbi', 'Rev.', 'Cantor', '']).optional().nullable(),
    first_name: z.string().min(1).max(100),
    last_name: z.string().min(1).max(100),
    hebrew_name: z.string().max(100).optional().nullable(),
    hebrew_last_name: z.string().max(100).optional().nullable(),
    gender: z.enum(['male', 'female', 'other', '']).optional().nullable(),
    date_of_birth: z.string().optional().nullable(),
    kohen_levi_yisroel: z.enum(['kohen', 'levi', 'yisroel', '']).optional().nullable(),
    email: z.string().email().optional().nullable().or(z.literal('')),
    phone: z.string().max(20).optional().nullable(),
    cell: z.string().max(20).optional().nullable(),
    mobile: z.string().max(20).optional().nullable(),
    sms_enabled: z.boolean().optional(),
    address: z.string().max(500).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    state: z.string().max(50).optional().nullable(),
    zip: z.string().max(20).optional().nullable(),
    country: z.string().max(50).optional().nullable(),
    spouse_first_name: z.string().max(100).optional().nullable(),
    spouse_last_name: z.string().max(100).optional().nullable(),
    spouse_title: z.string().max(20).optional().nullable(),
    company: z.string().max(200).optional().nullable(),
    notes: z.string().optional().nullable(),
    tags_raw: z.array(z.string()).optional().nullable(),
    parent_family_id: z.string().uuid().optional().nullable(),
    metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export type PersonInput = z.infer<typeof personSchema>

// Search/filter schema
export const personSearchSchema = z.object({
    query: z.string().optional(),
    page: z.number().min(1).optional(),
    pageSize: z.number().min(10).max(100).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    tags: z.array(z.string()).optional(),
    hasBalance: z.boolean().optional(),
})

export type PersonSearch = z.infer<typeof personSearchSchema>

// ===========================================
// CAMPAIGN SCHEMAS
// ===========================================
export const campaignSchema = z.object({
    id: z.string().uuid().optional(),
    shul_id: z.string().uuid(),
    name: z.string().min(1).max(200),
    description: z.string().optional().nullable(),
    type: z.enum(['general', 'building_fund', 'yizkor', 'kiddush', 'scholarship', 'other']).optional().nullable(),
    goal: z.number().min(0).optional().nullable(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    status: z.enum(['active', 'completed', 'archived']).optional(),
    processors: z.array(z.string().uuid()).optional().nullable(),
    metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export type CampaignInput = z.infer<typeof campaignSchema>

// ===========================================
// ITEM (CATALOG) SCHEMAS
// ===========================================
export const itemSchema = z.object({
    id: z.string().uuid().optional(),
    shul_id: z.string().uuid(),
    name: z.string().min(1).max(200),
    description: z.string().optional().nullable(),
    price: z.number().min(0),
    type: z.enum(['membership', 'aliyah', 'donation', 'event', 'other']).optional().nullable(),
    category: z.string().max(100).optional().nullable(),
    is_active: z.boolean().optional(),
})

export type ItemInput = z.infer<typeof itemSchema>

// ===========================================
// INVOICE SCHEMAS
// ===========================================
export const invoiceItemSchema = z.object({
    description: z.string().min(1),
    quantity: z.number().min(1).optional(),
    unit_price: z.number().min(0),
    item_id: z.string().uuid().optional().nullable(),
    campaign_id: z.string().uuid().optional().nullable(),
})

export const invoiceSchema = z.object({
    id: z.string().uuid().optional(),
    shul_id: z.string().uuid(),
    customer_id: z.string().uuid(),
    customer_name: z.string().optional().nullable(),
    customer_email: z.string().email().optional().nullable(),
    due_date: z.string().optional().nullable(),
    campaign_id: z.string().uuid().optional().nullable(),
    notes: z.string().optional().nullable(),
    items: z.array(invoiceItemSchema).min(1, 'At least one line item is required'),
})

export type InvoiceInput = z.infer<typeof invoiceSchema>
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>

// ===========================================
// PAYMENT SCHEMAS
// ===========================================
export const paymentSchema = z.object({
    id: z.string().uuid().optional(),
    shul_id: z.string().uuid(),
    person_id: z.string().uuid().optional().nullable(),
    amount: z.number().min(0.01),
    method: z.enum(['card', 'ach', 'check', 'cash', 'wire', 'other']),
    processor_id: z.string().uuid().optional().nullable(),
    transaction_id: z.string().optional().nullable(),
    idempotency_key: z.string().optional().nullable(),
    invoice_ids: z.array(z.string().uuid()).optional().nullable(),
    notes: z.string().optional().nullable(),
})

export type PaymentInput = z.infer<typeof paymentSchema>

// ===========================================
// DONATION (PUBLIC) SCHEMAS
// ===========================================
export const donationSchema = z.object({
    shul_id: z.string().uuid(),
    campaign_id: z.string().uuid().optional().nullable(),
    amount: z.number().min(1),
    frequency: z.enum(['one-time', 'monthly', 'annual']).optional(),
    donor: z.object({
        first_name: z.string().min(1),
        last_name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
    }),
    payment_method: z.enum(['card', 'ach']),
    payment_token: z.string().optional(), // Token from payment processor
    idempotency_key: z.string(),
})

export type DonationInput = z.infer<typeof donationSchema>
