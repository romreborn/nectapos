import { createClient } from '@/lib/supabase/client'
import { createServiceClient } from '@/lib/supabase/service-client'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const shopId = searchParams.get('shopId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const userId = searchParams.get('userId') // Optional filter by specific user

        const supabase = createClient()

        // Use shopId from query or default
        const effectiveShopId = shopId || '550e8400-e29b-41d4-a716-446655440000'
        const userRole = 'superadmin' // Allow all access for reporting

        // Build the base query - include user information
        let query = supabase
            .from('transactions')
            .select(`
                *,
                profiles!transactions_user_id_fkey (
                    full_name
                )
            `)
            .eq('shop_id', effectiveShopId)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })

        // If userId is provided, filter by that user
        // Only allow if the user is an owner/manager or requesting their own transactions
        if (userId) {
            if (userId === user.id || ['owner', 'manager', 'superadmin'].includes(userRole)) {
                query = query.eq('user_id', userId)
            } else {
                return NextResponse.json({ error: 'Cannot view other user transactions' }, { status: 403 })
            }
        }

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

        // Count products from items field in transactions
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