import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = createClient()

        // Get all transactions (no auth for debugging)
        const { data: transactions, error: transactionError } = await supabase
            .from('transactions')
            .select('*')
            .limit(5)

        return NextResponse.json({
            transactions: transactions || [],
            transactionError: transactionError?.message,
            message: 'Debug data - remove this route in production!'
        })
    } catch (error) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}