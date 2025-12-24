import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create a Supabase client with service role key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const shopId = searchParams.get('shopId') || '550e8400-e29b-41d4-a716-446655440000'
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // Build query
        let query = supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('shop_id', shopId)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })

        if (startDate) {
            query = query.gte('created_at', startDate)
        }

        if (endDate) {
            query = query.lte('created_at', endDate)
        }

        const { data: transactions, error } = await query

        if (error) {
            console.error('Transaction fetch error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Calculate stats
        const totalSales = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0
        const transactionCount = transactions?.length || 0
        let productsSold = 0

        // Count products from items field
        if (transactions && transactions.length > 0) {
            productsSold = transactions.reduce((sum, t) => {
                if (t.items && Array.isArray(t.items)) {
                    return sum + t.items.reduce((itemSum, item) => {
                        const qty = item.quantity || item.qty || 1
                        return itemSum + qty
                    }, 0)
                }
                return sum
            }, 0)
        }

        const avgOrderValue = transactionCount > 0 ? totalSales / transactionCount : 0

        console.log('Stats calculation:', {
            totalSales,
            transactionCount,
            productsSold,
            avgOrderValue
        })

        const stats = {
            totalSales,
            transactionCount,
            productsSold,
            avgOrderValue
        }

        return NextResponse.json({
            transactions: transactions || [],
            stats
        })
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}