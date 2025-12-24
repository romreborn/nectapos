import { createServiceClient } from '@/lib/supabase/service-client'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const shopId = searchParams.get('shopId') || '550e8400-e29b-41d4-a716-446655440000'
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const cashierId = searchParams.get('cashierId') // Still support cashierId for backward compatibility
        const userId = searchParams.get('userId') // New userId parameter
        const search = searchParams.get('search')

        // Create service client
        const supabaseAdmin = createServiceClient()

        // Build query with cashier and customer information
        let query = supabaseAdmin
            .from('transactions')
            .select(`
                *,
                customers (
                    name,
                    email,
                    phone
                )
            `)
            .eq('shop_id', shopId)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })

        // Filter by user if provided
        if (userId) {
            console.log('Filtering by userId:', userId)
            query = query.eq('user_id', userId)
        } else if (cashierId) {
            console.log('Filtering by cashierId as userId:', cashierId)
            // For backward compatibility, treat cashierId as userId
            query = query.eq('user_id', cashierId)
        }

        if (startDate) {
            query = query.gte('created_at', startDate)
        }

        if (endDate) {
            query = query.lte('created_at', endDate)
        }

        const { data: transactions, error } = await query

        console.log(`Found ${transactions?.length || 0} transactions`)

        if (error) {
            console.error('Transaction fetch error:', error)
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        // Calculate stats
        const totalSales = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0
        const transactionCount = transactions?.length || 0
        let productsSold = 0

        // Count products from items field
        if (transactions && transactions.length > 0) {
            productsSold = transactions.reduce((sum, t) => {
                if (t.items && Array.isArray(t.items)) {
                    return sum + t.items.reduce((itemSum: number, item: any) => {
                        const qty = item.quantity || item.qty || 1
                        return itemSum + qty
                    }, 0)
                }
                return sum
            }, 0)
        }

        const avgOrderValue = transactionCount > 0 ? totalSales / transactionCount : 0

        // Filter by search term if provided
        let filteredTransactions = transactions || []
        if (search) {
            const searchLower = search.toLowerCase()
            filteredTransactions = filteredTransactions.filter(t => {
                // Search in transaction ID
                if (t.id.toLowerCase().includes(searchLower)) return true
                // Search in customer name
                if (t.customers?.name?.toLowerCase().includes(searchLower)) return true
                // Search in customer email
                if (t.customers?.email?.toLowerCase().includes(searchLower)) return true
                return false
            })
        }

        // Add cashier info for each transaction
        const transactionsWithCashier = []
        for (const transaction of filteredTransactions) {
            let cashierInfo = { full_name: 'Unknown' }

            if (transaction.user_id) {
                try {
                    // Get from profiles table
                    const { data: profileData } = await supabaseAdmin
                        .from('profiles')
                        .select('full_name')
                        .eq('id', transaction.user_id)
                        .single()

                    if (profileData?.full_name) {
                        cashierInfo = { full_name: profileData.full_name }
                    } else {
                        // If not in profiles, try to get user info from auth.users
                        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
                            transaction.user_id
                        )

                        if (userData?.user) {
                            cashierInfo = {
                                full_name: userData.user.user_metadata?.full_name ||
                                          userData.user.user_metadata?.name ||
                                          userData.user.email?.split('@')[0] ||
                                          'User'
                            }
                        }
                    }
                } catch (error) {
                    console.warn(`Could not fetch user info for ${transaction.user_id}:`, error)
                }
            }

            transactionsWithCashier.push({
                ...transaction,
                profiles: cashierInfo
            })
        }

        // Recalculate stats based on filtered transactions
        const filteredTotalSales = filteredTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0)
        const filteredTransactionCount = filteredTransactions.length
        let filteredProductsSold = 0

        // Count products from items field in filtered transactions
        if (filteredTransactions.length > 0) {
            filteredProductsSold = filteredTransactions.reduce((sum, t) => {
                if (t.items && Array.isArray(t.items)) {
                    return sum + t.items.reduce((itemSum: number, item: any) => {
                        const qty = item.quantity || item.qty || 1
                        return itemSum + qty
                    }, 0)
                }
                return sum
            }, 0)
        }

        const filteredAvgOrderValue = filteredTransactionCount > 0 ? filteredTotalSales / filteredTransactionCount : 0

        const stats = {
            totalSales: filteredTotalSales,
            transactionCount: filteredTransactionCount,
            productsSold: filteredProductsSold,
            avgOrderValue: filteredAvgOrderValue
        }

        return NextResponse.json({
            transactions: transactionsWithCashier || [],
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