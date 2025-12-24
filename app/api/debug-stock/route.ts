import { createServiceClient } from '@/lib/supabase/service-client'
import { NextResponse } from 'next/server'

export async function GET() {
    const serviceSupabase = createServiceClient()

    try {
        // Check stock movements created
        const { data: movements, error: movementError } = await serviceSupabase
            .from('stock_movements')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

        // Check products with their current stock
        const { data: products, error: productError } = await serviceSupabase
            .from('products')
            .select('id, name, stock')
            .limit(10)

        // Check if we can manually update a product
        const { data: testProduct } = await serviceSupabase
            .from('products')
            .select('id, name, stock')
            .eq('sku', 'TEST001')
            .single()

        let updateResult = null
        if (testProduct) {
            const newStock = testProduct.stock - 1
            updateResult = await serviceSupabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', testProduct.id)
                .select('stock')
                .single()
        }

        // Check transactions with items
        const { data: transactions } = await serviceSupabase
            .from('transactions')
            .select('id, created_at, items')
            .eq('status', 'completed')
            .limit(5)

        return NextResponse.json({
            movements: movements || [],
            movementError: movementError?.message,
            products: products || [],
            productError: productError?.message,
            testProduct,
            updateResult,
            transactions: transactions || []
        })
    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}