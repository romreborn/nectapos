import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export function createClient() {
    // Handle missing env vars during build time
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
        console.warn('Supabase env vars missing. Returning dummy client for build.')
        // Return a dummy client or throw a more descriptive error if needed.
        // For build stability, we can try to return a client with empty values if it's just for static analysis,
        // but @supabase/ssr might validate them.
        // Better to return undefined or handle it.
        // Actually, let's just pass empty strings if undefined, but @supabase/ssr might throw.
        // attempts to validation.

        // If we provide fallback values, it might pass the constructor check but fail later.
        // Let's rely on the fact that for client components, this should only run on client.
        // But Next.js pre-renders client components too.

        return createBrowserClient<Database>(
            url || 'https://placeholder.supabase.co',
            key || 'placeholder'
        )
    }

    return createBrowserClient<Database>(url, key)
}
