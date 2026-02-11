import { createClient } from '@/lib/supabase/client'
import { createServiceClient } from '@/lib/supabase/service-client'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
    try {
        // Create a Supabase client configured to use cookies (same as middleware)
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value
                    },
                },
            }
        )

        // Get the current user (same as middleware)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            console.log('No user found in POS API')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('POS API - User authenticated:', {
            id: user.id,
            email: user.email,
            aud: user.aud,
            app_metadata: user.app_metadata,
            user_metadata: user.user_metadata
        })

        const { searchParams } = new URL(request.url)
        const shopId = searchParams.get('shopId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // Use the user's ID
        const currentUserId = user.id

        console.log('POS Transactions API - Query params:', {
            currentUserId,
            shopId,
            startDate,
            endDate,
            shopIdEmpty: !shopId || shopId === ''
        })

        // First, let's check how many transactions exist for this user without date filters
        console.log('POS API - Checking all transactions for user_id:', currentUserId)
        const { data: allUserTransactions, count: allCount } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: false })
            .eq('status', 'completed')
            .eq('user_id', currentUserId)

        console.log('POS API - All completed transactions for user:', {
            count: allCount,
            transactions: allUserTransactions?.map(t => ({
                id: t.id,
                created_at: t.created_at,
                created_at_local: new Date(t.created_at).toLocaleString(),
                userid: t.user_id,
                shopid: t.shop_id
            }))
        })

        // Build the query
        let query = supabase
            .from('transactions')
            .select('*')
            .eq('status', 'completed')
            .eq('user_id', currentUserId) // Only filter by user_id
            .order('created_at', { ascending: false })

        // Log the base query before adding optional filters
        console.log('POS API - Base query built for user_id:', currentUserId)

        if (shopId) {
            query = query.eq('shop_id', shopId)
            console.log('POS API - Added shop_id filter:', shopId)
        }

        if (startDate) {
            // Handle Indonesia timezone (UTC+7)
            // If user selects date "2025-12-12" in Indonesia, we want to show:
            // All transactions from 2025-12-12 00:00 WIB to 2025-12-12 23:59 WIB
            // Since WIB is UTC+7, this is 2025-12-11 17:00 UTC to 2025-12-12 16:59 UTC

            const startUTC = new Date(startDate + 'T00:00:00.000Z')
            const startIndonesia = new Date(startUTC.getTime() + 7 * 60 * 60000)

            let endUTC
            if (endDate) {
                endUTC = new Date(endDate + 'T23:59:59.999Z')
                const endIndonesia = new Date(endUTC.getTime() + 7 * 60 * 60000)

                // Convert Indonesia end of day back to UTC
                endUTC = new Date(Date.UTC(
                    endIndonesia.getFullYear(),
                    endIndonesia.getMonth(),
                    endIndonesia.getDate(),
                    16, 59, 59, 999 // 23:59 WIB = 16:59 UTC
                ))
            }

            console.log('POS API - Indonesia timezone filter:', {
                startDate_local: startDate,
                endDate_local: endDate,
                startUTC_real: startIndonesia.toISOString(),
                endUTC_real: endUTC?.toISOString(),
                startUTC_indo: startIndonesia.toLocaleString('id-ID'),
                endUTC_indo: endUTC ? new Date(endUTC.getTime() + 7 * 60 * 60000).toLocaleString('id-ID') : null
            })

            query = query.gte('created_at', startIndonesia.toISOString())

            if (endUTC) {
                query = query.lte('created_at', endUTC.toISOString())
            }
        } else if (endDate) {
            // If only endDate is provided
            const endUTC = new Date(endDate + 'T23:59:59.999Z')
            const endIndonesia = new Date(endUTC.getTime() + 7 * 60 * 60000)
            const adjustedEndUTC = new Date(Date.UTC(
                endIndonesia.getFullYear(),
                endIndonesia.getMonth(),
                endIndonesia.getDate(),
                16, 59, 59, 999
            ))

            query = query.lte('created_at', adjustedEndUTC.toISOString())
        }

        console.log('POS API - Executing query...')
        const { data: transactions, error } = await query
        console.log('POS API - Query result with all filters:', {
            count: transactions?.length || 0,
            error: error?.message,
            errorDetails: error?.details,
            shopId: shopId,
            hasShopId: !!shopId
        })

        // If we got 0 results but have an empty shopId, try without shop filter
        if ((!transactions || transactions.length === 0) && (!shopId || shopId === '')) {
            console.log('POS API - No results with empty shopId, trying without shop filter')
            const queryNoShop = supabase
                .from('transactions')
                .select('*')
                .eq('status', 'completed')
                .eq('user_id', currentUserId)
                .order('created_at', { ascending: false })

            if (startDate) {
                queryNoShop.gte('created_at', startDate)
            }
            if (endDate) {
                queryNoShop.lte('created_at', endDate)
            }

            const { data: noShopResults } = await queryNoShop
            console.log('POS API - Results without shop filter:', noShopResults?.length || 0)
        }

        // If RLS blocks it, try with service client
        if (error && error.code === '42501') {
            console.log('RLS blocked transactions query, trying with service client')
            const serviceSupabase = createServiceClient()

            // Create query builder and apply all filters
            let builder = serviceSupabase
                .from('transactions')
                .select('*')

            // Apply required filters
            builder = builder.eq('status', 'completed').eq('user_id', user.id)
            console.log('Service client - Query for user_id:', user.id)

            // Apply optional filters
            if (shopId) {
                builder = builder.eq('shop_id', shopId)
                console.log('Service client - Added shop_id:', shopId)
            }

            if (startDate) {
                // Handle Indonesia timezone (UTC+7) for service client
                const startUTC = new Date(startDate + 'T00:00:00.000Z')
                const startIndonesia = new Date(startUTC.getTime() + 7 * 60 * 60000)

                let endUTC
                if (endDate) {
                    endUTC = new Date(endDate + 'T23:59:59.999Z')
                    const endIndonesia = new Date(endUTC.getTime() + 7 * 60 * 60000)

                    // Convert Indonesia end of day back to UTC
                    endUTC = new Date(Date.UTC(
                        endIndonesia.getFullYear(),
                        endIndonesia.getMonth(),
                        endIndonesia.getDate(),
                        16, 59, 59, 999 // 23:59 WIB = 16:59 UTC
                    ))
                }

                builder = builder.gte('created_at', startIndonesia.toISOString())

                if (endUTC) {
                    builder = builder.lte('created_at', endUTC.toISOString())
                }

                console.log('Service client - Indonesia timezone filter applied')
            } else if (endDate) {
                const endUTC = new Date(endDate + 'T23:59:59.999Z')
                const endIndonesia = new Date(endUTC.getTime() + 7 * 60 * 60000)
                const adjustedEndUTC = new Date(Date.UTC(
                    endIndonesia.getFullYear(),
                    endIndonesia.getMonth(),
                    endIndonesia.getDate(),
                    16, 59, 59, 999
                ))

                builder = builder.lte('created_at', adjustedEndUTC.toISOString())
                console.log('Service client - Indonesia timezone (end only) filter applied')
            }

            // Apply ordering and execute
            builder = builder.order('created_at', { ascending: false })

            const serviceResult = await builder
            console.log('Service client - Result count:', serviceResult.data?.length || 0)

            return successResponse({
                transactions: serviceResult.data || [],
                stats: {
                    totalSales: (serviceResult.data || []).reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0),
                    transactionCount: serviceResult.data?.length || 0
                }
            })
        }

        console.log('POS API result:', {
            found: transactions?.length || 0,
            error: error?.message
        })

        if (error) {
            console.error('POS Transaction fetch error:', error)
            return errorResponse(error.message, 500)
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

        const stats = {
            totalSales,
            transactionCount,
            productsSold,
            avgOrderValue
        }

        return successResponse({
            transactions: transactions || [],
            stats
        })
    } catch (error: any) {
        console.error('POS API Error:', error)
        return errorResponse('Internal server error', 500, { error: error.message })
    }
}