import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Invoice as SupabaseInvoice } from '@/types/supabase'

// ===========================================
// QUERY KEYS
// ===========================================
export const invoiceKeys = {
    all: ['invoices'] as const,
    lists: () => [...invoiceKeys.all, 'list'] as const,
    list: (shulId: string, filters?: Record<string, unknown>) =>
        [...invoiceKeys.lists(), shulId, filters] as const,
    details: () => [...invoiceKeys.all, 'detail'] as const,
    detail: (id: string) => [...invoiceKeys.details(), id] as const,
}

// ===========================================
// TYPES (re-export from supabase types)
// ===========================================
export type Invoice = SupabaseInvoice

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'void' | 'all'

interface FetchInvoicesOptions {
    page?: number
    pageSize?: number
    status?: InvoiceStatus
    customerId?: string
    campaignId?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    dueDateFrom?: string
    dueDateTo?: string
}

// ===========================================
// FETCH FUNCTIONS
// ===========================================
export async function fetchInvoices(shulId: string, options?: FetchInvoicesOptions) {
    const supabase = createClient()
    const {
        page = 1,
        pageSize = 50,
        status,
        customerId,
        campaignId,
        sortBy = 'created_at',
        sortOrder = 'desc',
        dueDateFrom,
        dueDateTo,
    } = options || {}

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
        .from('invoices')
        .select('*', { count: 'exact' })
        .eq('shul_id', shulId)
        .is('archived_at', null)

    // Status filter
    if (status && status !== 'all') {
        query = query.eq('status', status)
    }

    // Customer filter - check both customer_id and member_id for legacy compatibility
    if (customerId) {
        query = query.or(`customer_id.eq.${customerId},member_id.eq.${customerId}`)
    }

    // Campaign filter
    if (campaignId) {
        query = query.eq('campaign_id', campaignId)
    }

    // Due date range
    if (dueDateFrom) {
        query = query.gte('due_date', dueDateFrom)
    }
    if (dueDateTo) {
        query = query.lte('due_date', dueDateTo)
    }

    // Sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Pagination
    query = query.range(from, to)

    const { data, count, error } = await query

    if (error) throw error

    return {
        data: (data ?? []) as Invoice[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
    }
}

export async function fetchInvoice(id: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw error

    // Fetch invoice items separately
    const { data: items } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id)

    return { ...data, invoice_items: items ?? [] } as Invoice & { invoice_items: unknown[] }
}

// ===========================================
// HOOKS
// ===========================================
export function useInvoices(shulId: string, options?: FetchInvoicesOptions) {
    return useQuery({
        queryKey: invoiceKeys.list(shulId, options as Record<string, unknown>),
        queryFn: () => fetchInvoices(shulId, options),
        enabled: !!shulId,
    })
}

export function useInvoice(id: string) {
    return useQuery({
        queryKey: invoiceKeys.detail(id),
        queryFn: () => fetchInvoice(id),
        enabled: !!id,
    })
}

interface CreateInvoiceData {
    shulId: string
    customerId: string
    customerName?: string
    customerEmail?: string
    dueDate?: string
    campaignId?: string
    notes?: string
    items: {
        description: string
        quantity: number
        unitPrice: number
        itemId?: string
        campaignId?: string
    }[]
}

export function useCreateInvoice() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async (data: CreateInvoiceData) => {
            // Generate invoice number using RPC or fallback
            let invoiceNumber: string
            try {
                const { data: generatedNumber } = await supabase
                    .rpc('generate_invoice_number', { p_shul_id: data.shulId })
                invoiceNumber = generatedNumber ?? `${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`
            } catch {
                invoiceNumber = `${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`
            }

            // Calculate totals
            const totalAmount = data.items.reduce(
                (sum, item) => sum + item.quantity * item.unitPrice,
                0
            )

            // Create invoice
            const { data: invoice, error } = await supabase
                .from('invoices')
                .insert({
                    shul_id: data.shulId,
                    invoice_number: invoiceNumber,
                    customer_id: data.customerId,
                    customer_name: data.customerName,
                    customer_email: data.customerEmail,
                    total: totalAmount,
                    balance: totalAmount,
                    status: 'draft',
                    due_date: data.dueDate,
                    campaign_id: data.campaignId,
                    notes: data.notes,
                })
                .select()
                .single()

            if (error) throw error

            // Create invoice items
            const invoiceItems = data.items.map((item) => ({
                invoice_id: invoice.id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                amount: item.quantity * item.unitPrice,
                item_id: item.itemId,
                campaign_id: item.campaignId,
            }))

            const { error: itemsError } = await supabase
                .from('invoice_items')
                .insert(invoiceItems)

            if (itemsError) throw itemsError

            return invoice as Invoice
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
        },
    })
}

export function useVoidInvoice() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('invoices')
                .update({
                    status: 'void',
                    voided_at: new Date().toISOString(),
                })
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) })
            queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
        },
    })
}
