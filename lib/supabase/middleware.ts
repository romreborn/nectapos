import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    // Create an unmodified response
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Handle missing env vars gracefully to prevent crashes
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        // If env vars are missing, we can't do anything meaningful with Supabase.
        // Return the response as is, or maybe redirect to an error page if strict.
        // For now, return response to allow the request to proceed (or fail downstream if auth is needed).
        return response
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refreshing the auth token
    const { data: { user }, error } = await supabase.auth.getUser()

    // Protected routes logic
    if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/pos') || request.nextUrl.pathname.startsWith('/admin')) {
        if (error || !user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // Role-based redirection for root and login
    if (user && (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/login'))) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = (profile as any)?.role || 'cashier'

        if (role === 'superadmin') {
            return NextResponse.redirect(new URL('/admin', request.url))
        } else if (role === 'cashier') {
            return NextResponse.redirect(new URL('/dashboard/pos', request.url))
        } else {
            // owner, manager
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return response
}
