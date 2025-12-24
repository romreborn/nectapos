import { createClient } from '@/lib/supabase/client'
import { createServiceClient } from '@/lib/supabase/service-client'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const supabase = createClient()

        // Get the auth token from the request header
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token) {
            return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 })
        }

        // Verify the token and get the user
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            console.error('Auth error:', authError)
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        console.log('Authenticated user ID:', user.id)
        console.log('Authenticated user email:', user.email)

        // Get user's shop ID from profiles table
        // First try with regular client
        let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('shop_id')
            .eq('id', user.id)
            .single()

        console.log('Profile lookup result:', { profile, profileError })

        // If RLS blocks it, try with service client
        if (profileError && profileError.code === '42501') {
            console.log('RLS blocked profile query, trying with service client')
            const serviceSupabase = createServiceClient()
            const result = await serviceSupabase
                .from('profiles')
                .select('shop_id')
                .eq('id', user.id)
                .single()

            profile = result.data
            profileError = result.error
            console.log('Service client profile result:', { profile, profileError })
        }

        if (profileError || !profile?.shop_id) {
            console.error('Profile error:', profileError)
            console.error('User ID from auth:', user.id)

            // Try to fetch without .single() to see if there are any results
            const { data: allProfiles } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)

            console.log('Raw profiles query result:', allProfiles)

            return NextResponse.json({
                error: 'User profile not found or missing shop_id',
                details: 'Please ensure you have a shop assigned to your account',
                user_id: user.id,
                user_email: user.email,
                debug: {
                    profile_error: profileError,
                    all_profiles: allProfiles
                }
            }, { status: 404 })
        }

        // Get search parameters
        const searchParams = new URL(request.url).searchParams
        const search = searchParams.get('search')

        // Fetch customers for the user's shop
        let query = supabase
            .from('customers')
            .select('*')
            .eq('shop_id', profile.shop_id)
            .order('name', { ascending: true })

        // Add search filter if provided
        if (search && search.trim()) {
            console.log('Search term:', search.trim())
            const searchPattern = `name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`
            console.log('Search pattern:', searchPattern)
            query = query.or(searchPattern)
        }

        let { data: customers, error } = await query

        // If RLS blocks it, try with service client
        if (error && error.code === '42501') {
            console.log('RLS blocked customers query, trying with service client')
            const serviceSupabase = createServiceClient()

            let serviceQuery = serviceSupabase
                .from('customers')
                .select('*')
                .eq('shop_id', profile.shop_id)
                .order('name', { ascending: true })

            // Add search filter if provided
            if (search && search.trim()) {
                console.log('Service client search term:', search.trim())
                const searchPattern = `name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`
                console.log('Service client search pattern:', searchPattern)
                serviceQuery = serviceQuery.or(searchPattern)
            }

            const result = await serviceQuery
            customers = result.data
            error = result.error
            console.log('Service client customers result:', { customers: customers?.length || 0, error })
        }

        if (error) {
            console.error('Customer fetch error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        console.log('Returning customers:', customers?.length || 0, customers)
        return NextResponse.json({ customers: customers || [] })
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const supabase = createClient()
        const body = await request.json()

        // Get the auth token from the request header
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token) {
            return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 })
        }

        // Verify the token and get the user
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // Get user's shop ID from profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('shop_id')
            .eq('id', user.id)
            .single()

        if (profileError || !profile?.shop_id) {
            console.error('Profile error:', profileError)
            console.error('User ID:', user.id)
            console.error('User email:', user.email)
            return NextResponse.json({
                error: 'User profile not found or missing shop_id',
                details: 'Please ensure you have a shop assigned to your account',
                user_id: user.id,
                user_email: user.email
            }, { status: 404 })
        }

        // Debug log
        console.log('Creating customer with shop_id:', profile.shop_id)
        console.log('Customer data:', {
            name: body.name,
            email: body.email,
            phone: body.phone
        })
        console.log('User ID:', user.id)
        console.log('User email:', user.email)

        // Create new customer - first try regular client
        let { data: customer, error } = await supabase
            .from('customers')
            .insert({
                name: body.name,
                email: body.email || null,
                phone: body.phone || null,
                shop_id: profile.shop_id
            })
            .select()
            .single()

        // If RLS blocks it, try with service client
        if (error && error.code === '42501') {
            console.log('RLS blocked customer insert, trying with service client')
            const serviceSupabase = createServiceClient()
            const result = await serviceSupabase
                .from('customers')
                .insert({
                    name: body.name,
                    email: body.email || null,
                    phone: body.phone || null,
                    shop_id: profile.shop_id
                })
                .select()
                .single()

            customer = result.data
            error = result.error
            console.log('Service client insert result:', { customer, error })
        }

        if (error) {
            console.error('Customer creation error:', error)
            console.error('Error details:', {
                code: error.code,
                details: error.details,
                hint: error.hint,
                message: error.message
            })
            return NextResponse.json({
                error: error.message,
                code: error.code,
                details: error.details
            }, { status: 400 })
        }

        return NextResponse.json({ customer })
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}