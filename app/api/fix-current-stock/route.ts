import { createServiceClient } from '@/lib/supabase/service-client'
import { NextResponse } from 'next/server'

export async function POST() {
    const serviceSupabase = createServiceClient()

    try {
        // Get all completed transactions
        const { data: transactions, error } = await serviceSupabase
            .from('transactions')
            .select('id, created_at, items, shop_id, user_id')
            .eq('status', 'completed')
            .order('created_at', { ascending: true })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        console.log(`Processing ${transactions.length} transactions`)

        // Group stock changes by product
        const stockChanges = new Map()

        for (const transaction of transactions) {
            if (transaction.items && Array.isArray(transaction.items)) {
                for (const item of transaction.items) {
                    const productId = item.product_id
                    const quantity = item.quantity || item.qty || 1

                    if (!stockChanges.has(productId)) {
                        stockChanges.set(productId, {
                            totalSold: 0,
                            transactions: []
                        })
                    }

                    stockChanges.get(productId).totalSold += quantity
                    stockChanges.get(productId).transactions.push({
                        transactionId: transaction.id,
                        quantity: quantity,
                        date: transaction.created_at
                    })
                }
            }
        }

        // Update each product's stock
        const results = {
            productsUpdated: 0,
            productsSkipped: 0,
            errors: []
        }

        console.log(`Found stock changes for ${stockChanges.size} products`)

        for (const [productId, data] of stockChanges) {
            try {
                console.log(`Processing product ${productId}, total sold: ${data.totalSold}`)

                // Get current stock
                const { data: product, error: productError } = await serviceSupabase
                    .from('products')
                    .select('id, name, stock')
                    .eq('id', productId)
                    .single()

                if (productError || !product) {
                    console.log(`Product ${productId} not found or error:`, productError?.message)
                    results.productsSkipped++
                    continue
                }

                const currentStock = product.stock || 0
                const newStock = Math.max(0, currentStock - data.totalSold)

                // Update stock
                const { error: updateError } = await serviceSupabase
                    .from('products')
                    .update({ stock: newStock })
                    .eq('id', productId)

                if (updateError) {
                    results.errors.push({
                        productId,
                        productName: product.name,
                        error: updateError.message
                    })
                } else {
                    console.log(`Updated ${product.name}: ${currentStock} - ${data.totalSold} = ${newStock}`)
                    results.productsUpdated++
                }
            } catch (error) {
                results.errors.push({
                    productId,
                    error: error.message
                })
            }
        }

        return NextResponse.json({
            success: true,
            results,
            totalProductsProcessed: stockChanges.size
        })
    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}