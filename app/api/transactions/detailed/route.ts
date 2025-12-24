import { createClient } from '@/lib/supabase/client'
import { createServiceClient } from '@/lib/supabase/service-client'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Helper function to get session from cookies
async function getServerSession() {
  try {
    const cookieStore = cookies()
    const supabase = createClient()

    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = createClient()
        const { searchParams } = new URL(request.url)
        const shopId = searchParams.get('shopId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const cashierId = searchParams.get('cashierId')
        const search = searchParams.get('search')

        // Get user's profile with role
        const { data: profile } = await supabase
            .from('profiles')
            .select('shop_id, role')
            .eq('id', session.user.id)
            .single()

        if (!profile?.shop_id) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
        }

        const effectiveShopId = shopId || profile.shop_id

        // Get transactions
        let transactionQuery = supabase
            .from('transactions')
            .select('*')
            .eq('shop_id', effectiveShopId)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })

        if (cashierId) {
            console.log('Detailed API - Filtering by cashierId as userId:', cashierId)
            if (cashierId === session.user.id || ['owner', 'manager', 'superadmin'].includes(profile.role)) {
                // Filter by user_id (treat cashierId as userId)
                transactionQuery = transactionQuery.eq('user_id', cashierId)
            } else {
                return NextResponse.json({ error: 'Cannot view other user transactions' }, { status: 403 })
            }
        }

        if (startDate) {
            transactionQuery = transactionQuery.gte('created_at', startDate)
        }

        if (endDate) {
            transactionQuery = transactionQuery.lte('created_at', endDate)
        }

        const { data: transactions, error: transactionError } = await transactionQuery

        if (transactionError) {
            console.error('Transaction fetch error:', transactionError)
            return NextResponse.json({ error: transactionError.message }, { status: 500 })
        }

        // Now get items and cashier info for each transaction
        const transactionsWithItems = []

        for (const transaction of (transactions || [])) {
            try {
                // Get items from the transaction's items field (JSON)
                const items = transaction.items || []

                // Get user information
                let userInfo = { full_name: 'Unknown' }

                if (transaction.user_id) {
                    try {
                        // Try to get from profiles table first
                        const { data: profileData } = await supabase
                            .from('profiles')
                            .select('full_name')
                            .eq('id', transaction.user_id)
                            .single()

                        if (profileData?.full_name) {
                            userInfo = { full_name: profileData.full_name }
                        } else {
                            // If not in profiles, try to get user metadata
                            // Check if it's the current user
                            if (transaction.user_id === session.user.id) {
                                userInfo = {
                                    full_name: session.user.user_metadata?.full_name ||
                                              session.user.user_metadata?.name ||
                                              session.user.email?.split('@')[0] ||
                                              'You'
                                }
                            } else {
                                // For other users, try using service client to fetch auth.users
                                const serviceSupabase = createServiceClient()
                                const { data: userData } = await serviceSupabase.auth.admin.getUserById(
                                    transaction.user_id
                                )

                                if (userData?.user) {
                                    userInfo = {
                                        full_name: userData.user.user_metadata?.full_name ||
                                                  userData.user.user_metadata?.name ||
                                                  userData.user.email?.split('@')[0] ||
                                                  'User'
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.warn(`Could not fetch user info for ${transaction.user_id}:`, error)
                    }
                }

                if (items.length === 0) {
                    console.warn(`No items found for transaction ${transaction.id}`)
                }

                transactionsWithItems.push({
                    ...transaction,
                    items: items || [],
                    profiles: userInfo // Add user info to match expected format
                })
            } catch (err) {
                console.error(`Error processing transaction ${transaction.id}:`, err)
                transactionsWithItems.push({
                    ...transaction,
                    items: [],
                    profiles: { full_name: 'Unknown' }
                })
            }
        }

        // Calculate stats
        const totalSales = transactionsWithItems.reduce((sum, t) => sum + (t.total_amount || 0), 0)
        const transactionCount = transactionsWithItems.length
        const productsSold = transactionsWithItems.reduce((sum, t) => {
            return sum + (t.items?.reduce((itemSum: number, item: any) => itemSum + (item.quantity || item.qty || 1), 0) || 0)
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
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json(
            { error: 'Internal server error: ' + error.message },
            { status: 500 }
        )
    }
}