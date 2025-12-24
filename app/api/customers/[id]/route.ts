import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
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
            return NextResponse.json({
                error: 'User profile not found or missing shop_id',
                details: 'Please ensure you have a shop assigned to your account'
            }, { status: 404 })
        }

        // Update customer
        const { data: customer, error } = await supabase
            .from('customers')
            .update({
                name: body.name,
                email: body.email || null,
                phone: body.phone || null
            })
            .eq('id', params.id)
            .eq('shop_id', profile.shop_id) // Ensure user can only update their shop's customers
            .select()
            .single()

        if (error) {
            console.error('Customer update error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
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

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
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
            return NextResponse.json({
                error: 'User profile not found or missing shop_id',
                details: 'Please ensure you have a shop assigned to your account'
            }, { status: 404 })
        }

        // Delete customer
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', params.id)
            .eq('shop_id', profile.shop_id) // Ensure user can only delete their shop's customers

        if (error) {
            console.error('Customer delete error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}