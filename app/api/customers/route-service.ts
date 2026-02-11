import { createClient } from '@/lib/supabase/client'
import { createServiceClient } from '@/lib/supabase/service-client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const serviceSupabase = createServiceClient()

        // For now, we'll use a default shop ID
        // In a real app, you'd get this from the authenticated user's profile
        const defaultShopId = '550e8400-e29b-41d4-a716-446655440000'

        // Create new customer using service role (bypasses RLS)
        const { data: customer, error } = await (serviceSupabase
            .from('customers') as any)
            .insert({
                name: body.name,
                email: body.email || null,
                phone: body.phone || null,
                shop_id: defaultShopId
            })
            .select()
            .single()

        if (error) {
            console.error('Customer creation error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
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

export async function GET(request: Request) {
    try {
        const serviceSupabase = createServiceClient()
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')

        // For now, use a default shop ID
        const defaultShopId = '550e8400-e29b-41d4-a716-446655440000'

        let query = serviceSupabase
            .from('customers')
            .select('*')
            .eq('shop_id', defaultShopId)
            .order('name', { ascending: true })

        if (search && search.trim()) {
            query = query.or(
                `name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`
            )
        }

        const { data: customers, error } = await query

        if (error) {
            console.error('Customer fetch error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ customers: customers || [] })
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}