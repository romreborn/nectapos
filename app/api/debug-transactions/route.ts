import { createServiceClient } from '@/lib/supabase/service-client'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        // Create a Supabase client configured to use cookies
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

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('Debug - Authenticated user:', {
            id: user.id,
            email: user.email
        })

        // Use service client to bypass RLS
        const serviceSupabase = createServiceClient()

        // Get ALL transactions without any filters
        const { data: allTransactions, error: allError } = await serviceSupabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false })

        if (allError) {
            console.error('Error fetching all transactions:', allError)
            return NextResponse.json({ error: allError.message }, { status: 500 })
        }

        // Get only completed transactions for current user
        const { data: userTransactions, error: userError } = await serviceSupabase
            .from('transactions')
            .select('*')
            .eq('status', 'completed')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (userError) {
            console.error('Error fetching user transactions:', userError)
            return NextResponse.json({ error: userError.message }, { status: 500 })
        }

        // Group transactions by user_id
        const groupedByUser = allTransactions?.reduce((acc: any, t: any) => {
            if (!acc[t.user_id]) {
                acc[t.user_id] = []
            }
            acc[t.user_id].push({
                id: t.id,
                status: t.status,
                created_at: t.created_at,
                total_amount: t.total_amount
            })
            return acc
        }, {}) || {}

        return NextResponse.json({
            currentUserId: user.id,
            currentUserEmail: user.email,
            allTransactionsCount: allTransactions?.length || 0,
            userTransactionsCount: userTransactions?.length || 0,
            groupedByUser,
            userTransactions: userTransactions?.map(t => ({
                id: t.id,
                status: t.status,
                created_at: t.created_at,
                total_amount: t.total_amount,
                shop_id: t.shop_id
            })) || []
        })
    } catch (error) {
        console.error('Debug API Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}