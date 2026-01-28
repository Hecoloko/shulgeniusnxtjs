import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Person as SupabasePerson, Insertable, Updatable } from '@/types/supabase'

// ===========================================
// QUERY KEYS
// ===========================================
export const peopleKeys = {
    all: ['people'] as const,
    lists: () => [...peopleKeys.all, 'list'] as const,
    list: (shulId: string, filters?: Record<string, unknown>) =>
        [...peopleKeys.lists(), shulId, filters] as const,
    details: () => [...peopleKeys.all, 'detail'] as const,
    detail: (id: string) => [...peopleKeys.details(), id] as const,
}

// ===========================================
// TYPES (re-export from supabase types)
// ===========================================
export type Person = SupabasePerson

interface FetchPeopleOptions {
    page?: number
    pageSize?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    tags?: string[]
    hasBalance?: boolean
}

// ===========================================
// FETCH FUNCTIONS
// ===========================================
export async function fetchPeople(
    shulId: string,
    options?: FetchPeopleOptions
) {
    const supabase = createClient()
    const {
        page = 1,
        pageSize = 50,
        search,
        sortBy = 'last_name',
        sortOrder = 'asc',
        tags,
        hasBalance,
    } = options || {}

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
        .from('people')
        .select('*', { count: 'exact' })
        .eq('shul_id', shulId)
        .is('archived_at', null)

    // Search - use ilike for simple search since search_vector may not exist
    if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Tag filter
    if (tags && tags.length > 0) {
        query = query.overlaps('tags_raw', tags)
    }

    // Balance filter
    if (hasBalance !== undefined) {
        if (hasBalance) {
            query = query.neq('balance', 0)
        } else {
            query = query.eq('balance', 0)
        }
    }

    // Sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Pagination
    query = query.range(from, to)

    const { data, count, error } = await query

    if (error) throw error

    return {
        data: (data ?? []) as Person[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
    }
}

export async function fetchPerson(id: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw error

    return data as Person
}

// ===========================================
// HOOKS
// ===========================================
export function usePeople(
    shulId: string,
    options?: FetchPeopleOptions
) {
    return useQuery({
        queryKey: peopleKeys.list(shulId, options as Record<string, unknown>),
        queryFn: () => fetchPeople(shulId, options),
        enabled: !!shulId,
    })
}

export function usePerson(id: string) {
    return useQuery({
        queryKey: peopleKeys.detail(id),
        queryFn: () => fetchPerson(id),
        enabled: !!id,
    })
}

export function useCreatePerson() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async (data: Insertable<'people'>) => {
            const { data: person, error } = await supabase
                .from('people')
                .insert(data)
                .select()
                .single()

            if (error) throw error
            return person as Person
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.lists() })
        },
    })
}

export function useUpdatePerson() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string
            data: Updatable<'people'>
        }) => {
            const { data: person, error } = await supabase
                .from('people')
                .update(data)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return person as Person
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(variables.id) })
            queryClient.invalidateQueries({ queryKey: peopleKeys.lists() })
        },
    })
}

export function useDeletePerson() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async (id: string) => {
            // Soft delete
            const { error } = await supabase
                .from('people')
                .update({ archived_at: new Date().toISOString() })
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.lists() })
        },
    })
}
