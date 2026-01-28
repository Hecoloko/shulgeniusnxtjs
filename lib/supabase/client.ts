import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://site.com',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
    )
}

