'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { cookies } from 'next/headers'

async function createClient() {
    const cookieStore = await cookies()

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch (error) {
                        // The `set` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options })
                    } catch (error) {
                        // The `delete` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Debug logging for deployment issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    console.log('[Login Action] Attempting login for:', email)
    console.log('[Login Action] Supabase URL exists:', !!supabaseUrl)
    console.log('[Login Action] Supabase URL prefix:', supabaseUrl?.substring(0, 8))

    try {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            console.error('[Login Action] Supabase auth error:', error.message)
            return { error: error.message }
        }

        console.log('[Login Action] Login successful')
    } catch (err) {
        console.error('[Login Action] Unexpected error:', err)
        return { error: 'Unexpected error during login: ' + (err instanceof Error ? err.message : String(err)) }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    revalidatePath('/', 'layout')
    redirect('/login')
}
