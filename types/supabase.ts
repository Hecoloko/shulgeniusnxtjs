// Auto-generated Supabase types
// Generated: 2026-01-27

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            activity_logs: {
                Row: {
                    action: string
                    created_at: string | null
                    description: string | null
                    entity_id: string | null
                    entity_type: string
                    id: string
                    ip_address: unknown
                    metadata: Json | null
                    shul_id: string
                    user_agent: string | null
                    user_email: string | null
                    user_id: string | null
                }
                Insert: {
                    action: string
                    created_at?: string | null
                    description?: string | null
                    entity_id?: string | null
                    entity_type: string
                    id?: string
                    ip_address?: unknown
                    metadata?: Json | null
                    shul_id: string
                    user_agent?: string | null
                    user_email?: string | null
                    user_id?: string | null
                }
                Update: {
                    action?: string
                    created_at?: string | null
                    description?: string | null
                    entity_id?: string | null
                    entity_type?: string
                    id?: string
                    ip_address?: unknown
                    metadata?: Json | null
                    shul_id?: string
                    user_agent?: string | null
                    user_email?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "activity_logs_shul_id_fkey"
                        columns: ["shul_id"]
                        isOneToOne: false
                        referencedRelation: "shuls"
                        referencedColumns: ["id"]
                    },
                ]
            }
            admin_users: {
                Row: {
                    created_at: string | null
                    email: string
                    id: string
                    name: string | null
                    role: string | null
                    status: string | null
                }
                Insert: {
                    created_at?: string | null
                    email: string
                    id?: string
                    name?: string | null
                    role?: string | null
                    status?: string | null
                }
                Update: {
                    created_at?: string | null
                    email?: string
                    id?: string
                    name?: string | null
                    role?: string | null
                    status?: string | null
                }
                Relationships: []
            }
            campaigns: {
                Row: {
                    archived_at: string | null
                    created_at: string | null
                    description: string | null
                    end_date: string | null
                    goal: number | null
                    id: string
                    metadata: Json | null
                    name: string
                    raised: number | null
                    shul_id: string | null
                    start_date: string | null
                    status: string | null
                    updated_at: string | null
                }
                Insert: {
                    archived_at?: string | null
                    created_at?: string | null
                    description?: string | null
                    end_date?: string | null
                    goal?: number | null
                    id?: string
                    metadata?: Json | null
                    name: string
                    raised?: number | null
                    shul_id?: string | null
                    start_date?: string | null
                    status?: string | null
                    updated_at?: string | null
                }
                Update: {
                    archived_at?: string | null
                    created_at?: string | null
                    description?: string | null
                    end_date?: string | null
                    goal?: number | null
                    id?: string
                    metadata?: Json | null
                    name?: string
                    raised?: number | null
                    shul_id?: string | null
                    start_date?: string | null
                    status?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "campaigns_shul_id_fkey"
                        columns: ["shul_id"]
                        isOneToOne: false
                        referencedRelation: "shuls"
                        referencedColumns: ["id"]
                    },
                ]
            }
            invoice_items: {
                Row: {
                    amount: number
                    campaign_id: string | null
                    created_at: string | null
                    description: string
                    id: string
                    invoice_id: string
                    item_id: string | null
                    quantity: number | null
                    unit_price: number
                }
                Insert: {
                    amount: number
                    campaign_id?: string | null
                    created_at?: string | null
                    description: string
                    id?: string
                    invoice_id: string
                    item_id?: string | null
                    quantity?: number | null
                    unit_price: number
                }
                Update: {
                    amount?: number
                    campaign_id?: string | null
                    created_at?: string | null
                    description?: string
                    id?: string
                    invoice_id?: string
                    item_id?: string | null
                    quantity?: number | null
                    unit_price?: number
                }
                Relationships: []
            }
            invoices: {
                Row: {
                    archived_at: string | null
                    balance: number | null
                    campaign_id: string | null
                    created_at: string | null
                    customer_email: string | null
                    customer_id: string | null
                    customer_name: string | null
                    due_date: string | null
                    id: string
                    invoice_number: string
                    items: string | null
                    member_email: string | null
                    member_id: string | null
                    member_name: string | null
                    metadata: Json | null
                    notes: string | null
                    paid_at: string | null
                    payment_link: string | null
                    pdf_url: string | null
                    sent_at: string | null
                    shul_id: string | null
                    status: string | null
                    total: number | null
                    updated_at: string | null
                    version: number | null
                    voided_at: string | null
                }
                Insert: {
                    archived_at?: string | null
                    balance?: number | null
                    campaign_id?: string | null
                    created_at?: string | null
                    customer_email?: string | null
                    customer_id?: string | null
                    customer_name?: string | null
                    due_date?: string | null
                    id?: string
                    invoice_number: string
                    items?: string | null
                    member_email?: string | null
                    member_id?: string | null
                    member_name?: string | null
                    metadata?: Json | null
                    notes?: string | null
                    paid_at?: string | null
                    payment_link?: string | null
                    pdf_url?: string | null
                    sent_at?: string | null
                    shul_id?: string | null
                    status?: string | null
                    total?: number | null
                    updated_at?: string | null
                    version?: number | null
                    voided_at?: string | null
                }
                Update: {
                    archived_at?: string | null
                    balance?: number | null
                    campaign_id?: string | null
                    created_at?: string | null
                    customer_email?: string | null
                    customer_id?: string | null
                    customer_name?: string | null
                    due_date?: string | null
                    id?: string
                    invoice_number?: string
                    items?: string | null
                    member_email?: string | null
                    member_id?: string | null
                    member_name?: string | null
                    metadata?: Json | null
                    notes?: string | null
                    paid_at?: string | null
                    payment_link?: string | null
                    pdf_url?: string | null
                    sent_at?: string | null
                    shul_id?: string | null
                    status?: string | null
                    total?: number | null
                    updated_at?: string | null
                    version?: number | null
                    voided_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "invoices_shul_id_fkey"
                        columns: ["shul_id"]
                        isOneToOne: false
                        referencedRelation: "shuls"
                        referencedColumns: ["id"]
                    },
                ]
            }
            items: {
                Row: {
                    archived_at: string | null
                    category: string | null
                    created_at: string | null
                    description: string | null
                    id: string
                    is_active: boolean | null
                    name: string
                    price: number | null
                    shul_id: string | null
                    stripe_price_id: string | null
                    stripe_product_id: string | null
                    type: string | null
                }
                Insert: {
                    archived_at?: string | null
                    category?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    is_active?: boolean | null
                    name: string
                    price?: number | null
                    shul_id?: string | null
                    stripe_price_id?: string | null
                    stripe_product_id?: string | null
                    type?: string | null
                }
                Update: {
                    archived_at?: string | null
                    category?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    is_active?: boolean | null
                    name?: string
                    price?: number | null
                    shul_id?: string | null
                    stripe_price_id?: string | null
                    stripe_product_id?: string | null
                    type?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "items_shul_id_fkey"
                        columns: ["shul_id"]
                        isOneToOne: false
                        referencedRelation: "shuls"
                        referencedColumns: ["id"]
                    },
                ]
            }
            kibbudim: {
                Row: {
                    amount: number | null
                    created_at: string | null
                    date: string | null
                    id: string
                    invoice_id: string | null
                    kibbud_type: string | null
                    member_id: string | null
                    member_name: string | null
                    notes: string | null
                    parsha_chodesh: string | null
                    shul_id: string | null
                    year: number | null
                }
                Insert: {
                    amount?: number | null
                    created_at?: string | null
                    date?: string | null
                    id?: string
                    invoice_id?: string | null
                    kibbud_type?: string | null
                    member_id?: string | null
                    member_name?: string | null
                    notes?: string | null
                    parsha_chodesh?: string | null
                    shul_id?: string | null
                    year?: number | null
                }
                Update: {
                    amount?: number | null
                    created_at?: string | null
                    date?: string | null
                    id?: string
                    invoice_id?: string | null
                    kibbud_type?: string | null
                    member_id?: string | null
                    member_name?: string | null
                    notes?: string | null
                    parsha_chodesh?: string | null
                    shul_id?: string | null
                    year?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "kibbudim_shul_id_fkey"
                        columns: ["shul_id"]
                        isOneToOne: false
                        referencedRelation: "shuls"
                        referencedColumns: ["id"]
                    },
                ]
            }
            members: {
                Row: {
                    address: string | null
                    balance: number | null
                    city: string | null
                    created_at: string | null
                    date_of_birth: string | null
                    email: string | null
                    gender: string | null
                    id: string
                    jewish_info: string | null
                    location: string | null
                    name: string
                    phone: string | null
                    role: string | null
                    spouse: string | null
                    state: string | null
                    status: string | null
                    tags: string[] | null
                    updated_at: string | null
                    zip: string | null
                }
                Insert: {
                    address?: string | null
                    balance?: number | null
                    city?: string | null
                    created_at?: string | null
                    date_of_birth?: string | null
                    email?: string | null
                    gender?: string | null
                    id?: string
                    jewish_info?: string | null
                    location?: string | null
                    name: string
                    phone?: string | null
                    role?: string | null
                    spouse?: string | null
                    state?: string | null
                    status?: string | null
                    tags?: string[] | null
                    updated_at?: string | null
                    zip?: string | null
                }
                Update: {
                    address?: string | null
                    balance?: number | null
                    city?: string | null
                    created_at?: string | null
                    date_of_birth?: string | null
                    email?: string | null
                    gender?: string | null
                    id?: string
                    jewish_info?: string | null
                    location?: string | null
                    name?: string
                    phone?: string | null
                    role?: string | null
                    spouse?: string | null
                    state?: string | null
                    status?: string | null
                    tags?: string[] | null
                    updated_at?: string | null
                    zip?: string | null
                }
                Relationships: []
            }
            payment_customers: {
                Row: {
                    id: string
                    shul_id: string
                    person_id: string
                    processor_id: string
                    external_customer_id: string
                    external_customer_number: string | null
                    email: string | null
                    name: string | null
                    synced_at: string | null
                    sync_error: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    shul_id: string
                    person_id: string
                    processor_id: string
                    external_customer_id: string
                    external_customer_number?: string | null
                    email?: string | null
                    name?: string | null
                    synced_at?: string | null
                    sync_error?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    shul_id?: string
                    person_id?: string
                    processor_id?: string
                    external_customer_id?: string
                    external_customer_number?: string | null
                    email?: string | null
                    name?: string | null
                    synced_at?: string | null
                    sync_error?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            payment_methods: {
                Row: {
                    id: string
                    shul_id: string
                    person_id: string
                    processor_id: string
                    customer_id: string
                    external_token: string
                    external_method_id: string | null
                    type: string
                    brand: string | null
                    last4: string
                    exp_month: number | null
                    exp_year: number | null
                    bank_name: string | null
                    account_type: string | null
                    label: string | null
                    cardholder_name: string | null
                    is_default: boolean | null
                    is_active: boolean | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    shul_id: string
                    person_id: string
                    processor_id: string
                    customer_id: string
                    external_token: string
                    external_method_id?: string | null
                    type: string
                    brand?: string | null
                    last4: string
                    exp_month?: number | null
                    exp_year?: number | null
                    bank_name?: string | null
                    account_type?: string | null
                    label?: string | null
                    cardholder_name?: string | null
                    is_default?: boolean | null
                    is_active?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    shul_id?: string
                    person_id?: string
                    processor_id?: string
                    customer_id?: string
                    external_token?: string
                    external_method_id?: string | null
                    type?: string
                    brand?: string | null
                    last4?: string
                    exp_month?: number | null
                    exp_year?: number | null
                    bank_name?: string | null
                    account_type?: string | null
                    label?: string | null
                    cardholder_name?: string | null
                    is_default?: boolean | null
                    is_active?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            payment_processor_credentials: {
                Row: {
                    id: string
                    processor_id: string
                    transaction_key: string | null
                    ifields_key: string | null
                    recurring_key: string | null
                    software_name: string | null
                    software_version: string | null
                    webhook_secret: string | null
                    webhook_url: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    processor_id: string
                    transaction_key?: string | null
                    ifields_key?: string | null
                    recurring_key?: string | null
                    software_name?: string | null
                    software_version?: string | null
                    webhook_secret?: string | null
                    webhook_url?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    processor_id?: string
                    transaction_key?: string | null
                    ifields_key?: string | null
                    recurring_key?: string | null
                    software_name?: string | null
                    software_version?: string | null
                    webhook_secret?: string | null
                    webhook_url?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            payment_processors: {
                Row: {
                    config: Json | null
                    created_at: string | null
                    id: string
                    is_active: boolean | null
                    is_default: boolean | null
                    name: string
                    public_key: string | null
                    secret_key: string | null
                    shul_id: string | null
                    type: string | null
                    updated_at: string | null
                    vault_secret_id: string | null
                }
                Insert: {
                    config?: Json | null
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    is_default?: boolean | null
                    name: string
                    public_key?: string | null
                    secret_key?: string | null
                    shul_id?: string | null
                    type?: string | null
                    updated_at?: string | null
                    vault_secret_id?: string | null
                }
                Update: {
                    config?: Json | null
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    is_default?: boolean | null
                    name?: string
                    public_key?: string | null
                    secret_key?: string | null
                    shul_id?: string | null
                    type?: string | null
                    updated_at?: string | null
                    vault_secret_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "payment_processors_shul_id_fkey"
                        columns: ["shul_id"]
                        isOneToOne: false
                        referencedRelation: "shuls"
                        referencedColumns: ["id"]
                    },
                ]
            }
            payment_schedules: {
                Row: {
                    id: string
                    shul_id: string
                    person_id: string
                    processor_id: string
                    payment_method_id: string
                    external_schedule_id: string
                    amount: number
                    currency: string | null
                    frequency: string
                    interval_count: number | null
                    start_date: string
                    next_run_date: string | null
                    end_date: string | null
                    total_payments: number | null
                    payments_made: number | null
                    campaign_id: string | null
                    description: string | null
                    status: string | null
                    last_error: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    shul_id: string
                    person_id: string
                    processor_id: string
                    payment_method_id: string
                    external_schedule_id: string
                    amount: number
                    currency?: string | null
                    frequency: string
                    interval_count?: number | null
                    start_date?: string
                    next_run_date?: string | null
                    end_date?: string | null
                    total_payments?: number | null
                    payments_made?: number | null
                    campaign_id?: string | null
                    description?: string | null
                    status?: string | null
                    last_error?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    shul_id?: string
                    person_id?: string
                    processor_id?: string
                    payment_method_id?: string
                    external_schedule_id?: string
                    amount?: number
                    currency?: string | null
                    frequency?: string
                    interval_count?: number | null
                    start_date?: string
                    next_run_date?: string | null
                    end_date?: string | null
                    total_payments?: number | null
                    payments_made?: number | null
                    campaign_id?: string | null
                    description?: string | null
                    status?: string | null
                    last_error?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            payment_transactions: {
                Row: {
                    id: string
                    shul_id: string
                    person_id: string | null
                    processor_id: string | null
                    payment_id: string | null
                    invoice_id: string | null
                    schedule_id: string | null
                    payment_method_id: string | null
                    amount: number
                    currency: string | null
                    external_transaction_id: string | null
                    external_batch_id: string | null
                    status: string
                    response_code: string | null
                    response_message: string | null
                    avs_result: string | null
                    cvv_result: string | null
                    card_brand: string | null
                    card_last4: string | null
                    processor_fee: number | null
                    request_payload: Json | null
                    response_payload: Json | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    shul_id: string
                    person_id?: string | null
                    processor_id?: string | null
                    payment_id?: string | null
                    invoice_id?: string | null
                    schedule_id?: string | null
                    payment_method_id?: string | null
                    amount: number
                    currency?: string | null
                    external_transaction_id?: string | null
                    external_batch_id?: string | null
                    status: string
                    response_code?: string | null
                    response_message?: string | null
                    avs_result?: string | null
                    cvv_result?: string | null
                    card_brand?: string | null
                    card_last4?: string | null
                    processor_fee?: number | null
                    request_payload?: Json | null
                    response_payload?: Json | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    shul_id?: string
                    person_id?: string | null
                    processor_id?: string | null
                    payment_id?: string | null
                    invoice_id?: string | null
                    schedule_id?: string | null
                    payment_method_id?: string | null
                    amount?: number
                    currency?: string | null
                    external_transaction_id?: string | null
                    external_batch_id?: string | null
                    status?: string
                    response_code?: string | null
                    response_message?: string | null
                    avs_result?: string | null
                    cvv_result?: string | null
                    card_brand?: string | null
                    card_last4?: string | null
                    processor_fee?: number | null
                    request_payload?: Json | null
                    response_payload?: Json | null
                    created_at?: string | null
                }
                Relationships: []
            }
            payment_webhook_events: {
                Row: {
                    id: string
                    processor_id: string | null
                    event_type: string
                    event_id: string | null
                    payload: Json
                    processed_at: string | null
                    process_error: string | null
                    payment_id: string | null
                    transaction_id: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    processor_id?: string | null
                    event_type: string
                    event_id?: string | null
                    payload?: Json
                    processed_at?: string | null
                    process_error?: string | null
                    payment_id?: string | null
                    transaction_id?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    processor_id?: string | null
                    event_type?: string
                    event_id?: string | null
                    payload?: Json
                    processed_at?: string | null
                    process_error?: string | null
                    payment_id?: string | null
                    transaction_id?: string | null
                    created_at?: string | null
                }
                Relationships: []
            }
            payments: {
                Row: {
                    amount: number
                    created_at: string | null
                    id: string
                    idempotency_key: string | null
                    invoice_ids: string[] | null
                    metadata: Json | null
                    method: string
                    notes: string | null
                    payment_date: string
                    person_id: string | null
                    processor_fee: number | null
                    processor_id: string | null
                    reconciled_at: string | null
                    shul_id: string
                    status: string | null
                    transaction_id: string | null
                    updated_at: string | null
                }
                Insert: {
                    amount: number
                    created_at?: string | null
                    id?: string
                    idempotency_key?: string | null
                    invoice_ids?: string[] | null
                    metadata?: Json | null
                    method: string
                    notes?: string | null
                    payment_date?: string
                    person_id?: string | null
                    processor_fee?: number | null
                    processor_id?: string | null
                    reconciled_at?: string | null
                    shul_id: string
                    status?: string | null
                    transaction_id?: string | null
                    updated_at?: string | null
                }
                Update: {
                    amount?: number
                    created_at?: string | null
                    id?: string
                    idempotency_key?: string | null
                    invoice_ids?: string[] | null
                    metadata?: Json | null
                    method?: string
                    notes?: string | null
                    payment_date?: string
                    person_id?: string | null
                    processor_fee?: number | null
                    processor_id?: string | null
                    reconciled_at?: string | null
                    shul_id?: string
                    status?: string | null
                    transaction_id?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "payments_person_id_fkey"
                        columns: ["person_id"]
                        isOneToOne: false
                        referencedRelation: "people"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "payments_shul_id_fkey"
                        columns: ["shul_id"]
                        isOneToOne: false
                        referencedRelation: "shuls"
                        referencedColumns: ["id"]
                    },
                ]
            }
            minyan_schedules: {
                Row: {
                    id: string
                    shul_id: string
                    day_type: string
                    service_type: string
                    time: string
                    is_zman: boolean | null
                    sort_order: number | null
                    notes: string | null
                    location: string | null
                    is_active: boolean | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    shul_id: string
                    day_type: string
                    service_type: string
                    time: string
                    is_zman?: boolean | null
                    sort_order?: number | null
                    notes?: string | null
                    location?: string | null
                    is_active?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    shul_id?: string
                    day_type?: string
                    service_type?: string
                    time?: string
                    is_zman?: boolean | null
                    sort_order?: number | null
                    notes?: string | null
                    location?: string | null
                    is_active?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "minyan_schedules_shul_id_fkey"
                        columns: ["shul_id"]
                        isOneToOne: false
                        referencedRelation: "shuls"
                        referencedColumns: ["id"]
                    }
                ]
            }
            people: {
                Row: {
                    address: string | null
                    archived_at: string | null
                    balance: number | null
                    cell: string | null
                    city: string | null
                    company: string | null
                    country: string | null
                    created_at: string | null
                    date_of_birth: string | null
                    email: string | null
                    first_name: string
                    gender: string | null
                    hebrew_last_name: string | null
                    hebrew_name: string | null
                    id: string
                    kohen_levi_yisroel: string | null
                    last_donation: number | null
                    last_donation_date: string | null
                    last_login: string | null
                    last_name: string
                    member_number: string | null
                    metadata: Json | null
                    mobile: string | null
                    notes: string | null
                    parent_family_id: string | null
                    phone: string | null
                    search_vector: unknown | null
                    shul_id: string
                    sms_enabled: boolean | null
                    spouse_first_name: string | null
                    spouse_last_name: string | null
                    spouse_title: string | null
                    state: string | null
                    tags_raw: string[] | null
                    title: string | null
                    updated_at: string | null
                    zip: string | null
                }
                Insert: {
                    address?: string | null
                    archived_at?: string | null
                    balance?: number | null
                    cell?: string | null
                    city?: string | null
                    company?: string | null
                    country?: string | null
                    created_at?: string | null
                    date_of_birth?: string | null
                    email?: string | null
                    first_name: string
                    gender?: string | null
                    hebrew_last_name?: string | null
                    hebrew_name?: string | null
                    id?: string
                    kohen_levi_yisroel?: string | null
                    last_donation?: number | null
                    last_donation_date?: string | null
                    last_login?: string | null
                    last_name: string
                    member_number?: string | null
                    metadata?: Json | null
                    mobile?: string | null
                    notes?: string | null
                    parent_family_id?: string | null
                    phone?: string | null
                    search_vector?: unknown | null
                    shul_id: string
                    sms_enabled?: boolean | null
                    spouse_first_name?: string | null
                    spouse_last_name?: string | null
                    spouse_title?: string | null
                    state?: string | null
                    tags_raw?: string[] | null
                    title?: string | null
                    updated_at?: string | null
                    zip?: string | null
                }
                Update: {
                    address?: string | null
                    archived_at?: string | null
                    balance?: number | null
                    cell?: string | null
                    city?: string | null
                    company?: string | null
                    country?: string | null
                    created_at?: string | null
                    date_of_birth?: string | null
                    email?: string | null
                    first_name?: string
                    gender?: string | null
                    hebrew_last_name?: string | null
                    hebrew_name?: string | null
                    id?: string
                    kohen_levi_yisroel?: string | null
                    last_donation?: number | null
                    last_donation_date?: string | null
                    last_login?: string | null
                    last_name?: string
                    member_number?: string | null
                    metadata?: Json | null
                    mobile?: string | null
                    notes?: string | null
                    parent_family_id?: string | null
                    phone?: string | null
                    search_vector?: unknown | null
                    shul_id?: string
                    sms_enabled?: boolean | null
                    spouse_first_name?: string | null
                    spouse_last_name?: string | null
                    spouse_title?: string | null
                    state?: string | null
                    tags_raw?: string[] | null
                    title?: string | null
                    updated_at?: string | null
                    zip?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "people_parent_family_id_fkey"
                        columns: ["parent_family_id"]
                        isOneToOne: false
                        referencedRelation: "people"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "people_shul_id_fkey"
                        columns: ["shul_id"]
                        isOneToOne: false
                        referencedRelation: "shuls"
                        referencedColumns: ["id"]
                    },
                ]
            }
            settings: {
                Row: {
                    category: string | null
                    created_at: string | null
                    id: string
                    key: string
                    shul_id: string | null
                    updated_at: string | null
                    value: string | null
                }
                Insert: {
                    category?: string | null
                    created_at?: string | null
                    id?: string
                    key: string
                    shul_id?: string | null
                    updated_at?: string | null
                    value?: string | null
                }
                Update: {
                    category?: string | null
                    created_at?: string | null
                    id?: string
                    key?: string
                    shul_id?: string | null
                    updated_at?: string | null
                    value?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "settings_shul_id_fkey"
                        columns: ["shul_id"]
                        isOneToOne: false
                        referencedRelation: "shuls"
                        referencedColumns: ["id"]
                    },
                ]
            }
            shuls: {
                Row: {
                    accent_color: string | null
                    address: string | null
                    archived_at: string | null
                    city: string | null
                    country: string | null
                    created_at: string | null
                    display_name: string | null
                    ein_tax_id: string | null
                    email: string | null
                    enabled_modules: string[] | null
                    id: string
                    legal_name: string | null
                    logo_url: string | null
                    name: string
                    phone: string | null
                    primary_color: string | null
                    settings: Json | null
                    slug: string
                    state: string | null
                    subscription_tier: string | null
                    updated_at: string | null
                    zip: string | null
                }
                Insert: {
                    accent_color?: string | null
                    address?: string | null
                    archived_at?: string | null
                    city?: string | null
                    country?: string | null
                    created_at?: string | null
                    display_name?: string | null
                    ein_tax_id?: string | null
                    email?: string | null
                    enabled_modules?: string[] | null
                    id?: string
                    legal_name?: string | null
                    logo_url?: string | null
                    name: string
                    phone?: string | null
                    primary_color?: string | null
                    settings?: Json | null
                    slug: string
                    state?: string | null
                    subscription_tier?: string | null
                    updated_at?: string | null
                    zip?: string | null
                }
                Update: {
                    accent_color?: string | null
                    address?: string | null
                    archived_at?: string | null
                    city?: string | null
                    country?: string | null
                    created_at?: string | null
                    display_name?: string | null
                    ein_tax_id?: string | null
                    email?: string | null
                    enabled_modules?: string[] | null
                    id?: string
                    legal_name?: string | null
                    logo_url?: string | null
                    name?: string
                    phone?: string | null
                    primary_color?: string | null
                    settings?: Json | null
                    slug?: string
                    state?: string | null
                    subscription_tier?: string | null
                    updated_at?: string | null
                    zip?: string | null
                }
                Relationships: []
            }
            user_roles: {
                Row: {
                    created_at: string | null
                    id: string
                    permissions: Json | null
                    role: string
                    shul_id: string
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    permissions?: Json | null
                    role: string
                    shul_id: string
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    permissions?: Json | null
                    role?: string
                    shul_id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_roles_shul_id_fkey"
                        columns: ["shul_id"]
                        isOneToOne: false
                        referencedRelation: "shuls"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_roles_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            users: {
                Row: {
                    avatar_url: string | null
                    created_at: string | null
                    email: string
                    full_name: string | null
                    id: string
                    last_login: string | null
                    settings: Json | null
                    updated_at: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string | null
                    email: string
                    full_name?: string | null
                    id: string
                    last_login?: string | null
                    settings?: Json | null
                    updated_at?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string | null
                    email?: string
                    full_name?: string | null
                    id?: string
                    last_login?: string | null
                    settings?: Json | null
                    updated_at?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            generate_invoice_number: {
                Args: {
                    p_shul_id: string
                }
                Returns: string
            }
            get_dashboard_stats: {
                Args: {
                    p_shul_id: string
                }
                Returns: Json
            }
            get_recent_activity: {
                Args: {
                    p_shul_id: string
                    p_limit?: number
                }
                Returns: {
                    id: string
                    action: string
                    entity_type: string
                    description: string
                    user_email: string
                    created_at: string
                }[]
            }
            get_user_shuls: {
                Args: Record<PropertyKey, never>
                Returns: {
                    shul_id: string
                    shul_name: string
                    shul_slug: string
                    role: string
                }[]
            }
            log_activity: {
                Args: {
                    p_shul_id: string
                    p_action: string
                    p_entity_type: string
                    p_entity_id?: string
                    p_description?: string
                    p_metadata?: Json
                }
                Returns: string
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience exports
export type Shul = Tables<'shuls'>
export type User = Tables<'users'>
export type UserRole = Tables<'user_roles'>
export type Person = Tables<'people'>
export type Campaign = Tables<'campaigns'>
export type Item = Tables<'items'>
export type Invoice = Tables<'invoices'>
export type InvoiceItem = Tables<'invoice_items'>
export type Payment = Tables<'payments'>
export type PaymentProcessor = Tables<'payment_processors'>
export type ActivityLog = Tables<'activity_logs'>
export type Setting = Tables<'settings'>
export type Kibbud = Tables<'kibbudim'>
export type Member = Tables<'members'> // Legacy table
