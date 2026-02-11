import { createServerClientFromToken } from '@/lib/supabase/server-client-token'
import { NextResponse } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: Request) {
    try {
        // Get the auth token from the request header
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token) {
            return errorResponse('No authorization token provided', 401)
        }

        // Create server client with the token - this properly sets up RLS context
        const supabase = await createServerClientFromToken(token)

        // Verify the token and get the user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return errorResponse('Invalid token', 401)
        }

        // Get user's shop ID from profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('shop_id')
            .eq('id', user.id)
            .single()

        if (profileError || !(profile as any)?.shop_id) {
            return errorResponse('User profile not found or missing shop_id', 404, {
                details: 'Please ensure you have a shop assigned to your account',
                user_id: user.id
            })
        }

        const shopId = (profile as any).shop_id

        // Get search parameters
        const searchParams = new URL(request.url).searchParams
        const search = searchParams.get('search')

        // Fetch customers for the user's shop
        let query = supabase
            .from('customers')
            .select('*')
            .eq('shop_id', shopId)
            .order('name', { ascending: true })

        // Add search filter if provided
        if (search && search.trim()) {
            const searchPattern = `name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`
            query = query.or(searchPattern)
        }

        const { data: customers, error } = await query

        if (error) {
            return errorResponse(error.message, 500)
        }

        return successResponse({ customers: customers || [] })
    } catch (error: any) {
        return errorResponse('Internal server error', 500, { error: error.message })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Get the auth token from the request header
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token) {
            return errorResponse('No authorization token provided', 401)
        }

        // Create server client with the token - this properly sets up RLS context
        const supabase = await createServerClientFromToken(token)

        // Verify the token and get the user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return errorResponse('Invalid token', 401)
        }

        // Get user's shop ID from profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('shop_id')
            .eq('id', user.id)
            .single()

        if (profileError || !(profile as any)?.shop_id) {
            return errorResponse('User profile not found or missing shop_id', 404, {
                details: 'Please ensure you have a shop assigned to your account',
                user_id: user.id
            })
        }

        const shopId = (profile as any).shop_id

        // Create new customer
        const { data: customer, error } = await (supabase
            .from('customers') as any)
            .insert({
                name: body.name,
                email: body.email || null,
                phone: body.phone || null,
                shop_id: shopId
            })
            .select()
            .single()

        if (error) {
            return errorResponse(error.message, 400, {
                code: error.code,
                details: error.details
            })
        }

        return successResponse({ customer })
    } catch (error: any) {
        return errorResponse('Internal server error', 500, { error: error.message })
    }
}