import { createServiceClient } from '@/lib/supabase/service-client'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const serviceSupabase = createServiceClient()

        // Test basic access to tables
        const { data: shops, error: shopsError } = await serviceSupabase
            .from('shops')
            .select('*')
            .limit(1)

        const { data: transactions, error: transactionsError } = await serviceSupabase
            .from('transactions')
            .select('*')
            .limit(1)

        return NextResponse.json({
            serviceRoleWorking: true,
            shops: shops?.length || 0,
            shopsError: shopsError?.message,
            transactions: transactions?.length || 0,
            transactionsError: transactionsError?.message
        })
    } catch (error) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}