import { createClient } from '@/lib/supabase/client'
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
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // Get user's profile with role
        const { data: profile } = await supabase
            .from('profiles')
            .select('shop_id, role')
            .eq('id', user.id)
            .single()

        if (!profile?.shop_id) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
        }

        const { searchParams } = new URL(request.url)
        const shopId = searchParams.get('shopId') || profile.shop_id
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const userId = searchParams.get('userId')

        // Build the query for transactions with items
        let query = supabase
            .from('transactions')
            .select('*')
            .eq('shop_id', shopId)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })

        if (userId) {
            if (userId === user.id || ['owner', 'manager', 'superadmin'].includes(profile.role)) {
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
            // Fallback: try without items if RLS prevents joining
            const fallbackQuery = supabase
                .from('transactions')
                .select('*')
                .eq('shop_id', shopId)
                .eq('status', 'completed')
                .order('created_at', { ascending: false })

            if (userId) {
                if (userId === user.id || ['owner', 'manager', 'superadmin'].includes(profile.role)) {
                    fallbackQuery.eq('user_id', userId)
                }
            }

            if (startDate) {
                fallbackQuery.gte('created_at', startDate)
            }

            if (endDate) {
                fallbackQuery.lte('created_at', endDate)
            }

            const { data: fallbackTransactions, error: fallbackError } = await fallbackQuery

            if (fallbackError) {
                return NextResponse.json({ error: fallbackError.message }, { status: 500 })
            }

            // Add items field to each transaction (items are stored in the transaction itself)
            const transactionsWithItems = (fallbackTransactions || []).map((transaction) => {
                return {
                    ...transaction,
                    items: transaction.items || []
                }
            })

            // Calculate stats
            const totalSales = transactionsWithItems.reduce((sum, t) => sum + (t.total_amount || 0), 0)
            const transactionCount = transactionsWithItems.length
            const productsSold = transactionsWithItems.reduce((sum, t) => {
                if (t.items && Array.isArray(t.items)) {
                    return sum + t.items.reduce((itemSum, item) => itemSum + (item.quantity || item.qty || 1), 0)
                }
                return sum
            }, 0)
            const avgOrderValue = transactionCount > 0 ? totalSales / transactionCount : 0

            return NextResponse.json({
                transactions: transactionsWithItems,
                stats: {
                    totalSales,
                    transactionCount,
                    productsSold,
                    avgOrderValue
                }
            })
        }

        // If the initial query with items succeeded
        // Calculate stats
        const totalSales = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0
        const transactionCount = transactions?.length || 0
        const productsSold = transactions?.reduce((sum, t) => {
            if (t.items && Array.isArray(t.items)) {
                return sum + t.items.reduce((itemSum, item) => itemSum + (item.quantity || item.qty || 1), 0)
            }
            return sum
        }, 0) || 0
        const avgOrderValue = transactionCount > 0 ? totalSales / transactionCount : 0

        return NextResponse.json({
            transactions: transactions || [],
            stats: {
                totalSales,
                transactionCount,
                productsSold,
                avgOrderValue
            }
        })
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}