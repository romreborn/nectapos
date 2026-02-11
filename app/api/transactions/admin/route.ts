import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api-response'

// Helper to validate role
function canViewTransactions(userRole: string, requesterId: string, targetUserId?: string) {
    if (!targetUserId) return true // Viewing all shop transactions requires admin/manager
    if (requesterId === targetUserId) return true
    return ['owner', 'manager', 'superadmin'].includes(userRole)
}

export async function GET(request: NextRequest) {
    try {
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

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return errorResponse('Unauthorized', 401)
        }

        // Get requester profile for role check
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, shop_id')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return errorResponse('Profile not found', 404)
        }

        const { searchParams } = new URL(request.url)
        const shopId = searchParams.get('shopId') || profile.shop_id
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const cashierId = searchParams.get('cashierId') || searchParams.get('userId')
        const search = searchParams.get('search')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        // Verify permissions
        if (!canViewTransactions(profile.role, user.id, cashierId || undefined)) {
            // If attempting to view all shop transactions without being admin
            if (!cashierId && !['owner', 'manager', 'superadmin'].includes(profile.role)) {
                return errorResponse('Insufficient permissions', 403)
            }
        }

        // Build Query
        let query = supabase
            .from('transactions')
            .select(`
                *,
                profiles(full_name)
            `, { count: 'exact' })
            .eq('shop_id', shopId)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (cashierId) {
            query = query.eq('user_id', cashierId)
        }

        if (startDate) {
            query = query.gte('created_at', startDate)
        }

        if (endDate) {
            query = query.lte('created_at', endDate)
        }

        // Note: Search within JSON columns (items) or joined columns (profiles) is tricky with simple query builder.
        // For advanced search, we might need the RPC 'search_transactions' we created earlier, 
        // but that RPC is optimized for "Sales Reports" (products).
        // Here we just filter by ID if provided in search.
        if (search) {
            query = query.ilike('id', `%${search}%`)
        }

        const { data: transactions, error, count } = await query

        if (error) {
            console.error('Admin API Error:', error)
            return errorResponse(error.message, 500)
        }

        // Calculate basic stats for this page (or overall if needed, but pagination makes it hard)
        // For full stats, we should use a separate aggregation query or RPC.
        // Here we just return the data.

        return successResponse({
            transactions,
            count,
            page: Math.floor(offset / limit) + 1,
            totalPages: count ? Math.ceil(count / limit) : 0
        })

    } catch (err: any) {
        console.error('Admin API Critical Error:', err)
        return errorResponse(err.message, 500)
    }
}
