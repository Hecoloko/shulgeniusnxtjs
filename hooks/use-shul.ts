import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Shul, UserRole } from '@/types/supabase'

// ===========================================
// QUERY KEYS
// ===========================================
export const shulKeys = {
    all: ['shuls'] as const,
    lists: () => [...shulKeys.all, 'list'] as const,
    userShuls: () => [...shulKeys.all, 'user'] as const,
    details: () => [...shulKeys.all, 'detail'] as const,
    detail: (id: string) => [...shulKeys.details(), id] as const,
    bySlug: (slug: string) => [...shulKeys.all, 'slug', slug] as const,
}

// ===========================================
// TYPES
// ===========================================
interface UserShul {
    shul_id: string
    shul_name: string
    shul_slug: string
    role: string
}

// ===========================================
// FETCH FUNCTIONS
// ===========================================
export async function fetchUserShuls(): Promise<UserShul[]> {
    const supabase = createClient()

    // Use the RPC function we created
    const { data, error } = await supabase.rpc('get_user_shuls')

    if (error) throw error

    return data as UserShul[]
}

export async function fetchShul(id: string): Promise<Shul> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('shuls')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw error

    return data as Shul
}

export async function fetchShulBySlug(slug: string): Promise<Shul> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('shuls')
        .select('*')
        .eq('slug', slug)
        .is('archived_at', null)
        .single()

    if (error) throw error

    return data as Shul
}

// ===========================================
// HOOKS
// ===========================================

/**
 * Get all shuls the current user has access to
 */
export function useUserShuls() {
    return useQuery({
        queryKey: shulKeys.userShuls(),
        queryFn: fetchUserShuls,
    })
}

/**
 * Get a shul by ID
 */
export function useShul(id: string) {
    return useQuery({
        queryKey: shulKeys.detail(id),
        queryFn: () => fetchShul(id),
        enabled: !!id,
    })
}

/**
 * Get a shul by slug (for public portal)
 */
export function useShulBySlug(slug: string) {
    return useQuery({
        queryKey: shulKeys.bySlug(slug),
        queryFn: () => fetchShulBySlug(slug),
        enabled: !!slug,
    })
}
