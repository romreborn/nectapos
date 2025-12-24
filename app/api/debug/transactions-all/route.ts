import { createClient } from '@/lib/supabase/client'
import { createServiceClient } from '@/lib/supabase/service-client'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = createClient()
        const serviceSupabase = createServiceClient()

        // Get transactions with a simple query first
        const { data: transactions, error: transactionError } = await serviceSupabase
            .from('transactions')
            .select('*')
            .limit(5)

        // Get the first transaction to check items field
        const { data: firstTransaction } = await serviceSupabase
            .from('transactions')
            .select('*')
            .limit(1)

        console.log('Debug Info:', {
            transactions: transactions?.length || 0,
            transactionError,
            firstTransaction: firstTransaction,
            hasItems: firstTransaction?.[0]?.items,
            itemsCount: firstTransaction?.[0]?.items?.length || 0
        })

        return NextResponse.json({
            transactions: transactions || [],
            transactionError: transactionError?.message,
            firstTransaction: firstTransaction?.[0] || null,
            debugInfo: {
                transactionCount: transactions?.length || 0,
                hasItems: firstTransaction?.[0]?.items,
                itemsCount: firstTransaction?.[0]?.items?.length || 0
            }
        })
    } catch (error) {
        console.error('Debug API Error:', error)
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}