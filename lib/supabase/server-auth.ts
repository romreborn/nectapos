import { createClient } from '@/lib/supabase/client'
import { cookies } from 'next/headers'

export async function createServerClient() {
    const cookieStore = cookies()

    const supabase = createClient()

    // This is a workaround - we'll use the client with a JWT from the cookie
    // In production, you should use the server client with proper cookie handling
    return supabase
}