import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Json } from '@/types/supabase'

// ===========================================
// QUERY KEYS
// ===========================================
export const dashboardKeys = {
    all: ['dashboard'] as const,
    stats: (shulId: string) => [...dashboardKeys.all, 'stats', shulId] as const,
    activity: (shulId: string) => [...dashboardKeys.all, 'activity', shulId] as const,
}

// ===========================================
// TYPES
// ===========================================
export interface DashboardStats {
    total_members: number
    total_balance: number
    members_with_balance: number
    total_invoices: number
    unpaid_invoices: number
    total_unpaid_amount: number
    total_payments_this_month: number
    payment_count_this_month: number
    active_campaigns: number
    campaign_raised: number
}

export interface ActivityItem {
    id: string
    action: string
    entity_type: string
    description: string | null
    user_email: string | null
    created_at: string
}

// ===========================================
// FETCH FUNCTIONS
// ===========================================
async function fetchDashboardStats(shulId: string): Promise<DashboardStats> {
    const supabase = createClient()

    const { data, error } = await supabase
        .rpc('get_dashboard_stats', { p_shul_id: shulId })

    if (error) throw error

    // Handle the response - it returns JSON
    const stats = data as unknown as DashboardStats
    return {
        total_members: stats?.total_members ?? 0,
        total_balance: stats?.total_balance ?? 0,
        members_with_balance: stats?.members_with_balance ?? 0,
        total_invoices: stats?.total_invoices ?? 0,
        unpaid_invoices: stats?.unpaid_invoices ?? 0,
        total_unpaid_amount: stats?.total_unpaid_amount ?? 0,
        total_payments_this_month: stats?.total_payments_this_month ?? 0,
        payment_count_this_month: stats?.payment_count_this_month ?? 0,
        active_campaigns: stats?.active_campaigns ?? 0,
        campaign_raised: stats?.campaign_raised ?? 0,
    }
}

async function fetchRecentActivity(shulId: string, limit = 10): Promise<ActivityItem[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .rpc('get_recent_activity', {
            p_shul_id: shulId,
            p_limit: limit,
        })

    if (error) throw error

    return (data ?? []) as ActivityItem[]
}

// ===========================================
// HOOKS
// ===========================================

/**
 * Hook to fetch dashboard statistics for a shul
 */
export function useDashboardStats(shulId: string) {
    return useQuery({
        queryKey: dashboardKeys.stats(shulId),
        queryFn: () => fetchDashboardStats(shulId),
        enabled: !!shulId,
        // Refresh stats every 30 seconds
        refetchInterval: 30000,
        staleTime: 10000,
    })
}

/**
 * Hook to fetch recent activity for a shul
 */
export function useRecentActivity(shulId: string, limit = 10) {
    return useQuery({
        queryKey: dashboardKeys.activity(shulId),
        queryFn: () => fetchRecentActivity(shulId, limit),
        enabled: !!shulId,
        // Activity refreshes every minute
        refetchInterval: 60000,
        staleTime: 30000,
    })
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount)
}

/**
 * Get action icon and color based on activity type
 */
export function getActivityStyle(action: string): { icon: string; color: string } {
    const styles: Record<string, { icon: string; color: string }> = {
        create: { icon: '➕', color: 'text-green-600' },
        update: { icon: '✏️', color: 'text-blue-600' },
        delete: { icon: '🗑️', color: 'text-red-600' },
        payment: { icon: '💰', color: 'text-amber-600' },
        invoice: { icon: '📄', color: 'text-purple-600' },
        login: { icon: '🔐', color: 'text-gray-600' },
        default: { icon: '📌', color: 'text-gray-500' },
    }
    return styles[action] ?? styles.default
}

/**
 * Format relative time for activity feed
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    })
}
