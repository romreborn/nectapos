import { createServiceClient } from '@/lib/supabase/service-client'
import { NextResponse } from 'next/server'

export async function POST() {
    try {
        const serviceSupabase = createServiceClient()

        // Get all completed transactions
        const { data: transactions, error: transactionError } = await serviceSupabase
            .from('transactions')
            .select('*')
            .eq('status', 'completed')
            .order('created_at', { ascending: true })

        if (transactionError) {
            console.error('Error fetching transactions:', transactionError)
            return NextResponse.json({ error: transactionError.message }, { status: 500 })
        }

        console.log(`Found ${transactions?.length || 0} transactions to process`)

        const results = {
            processed: 0,
            skipped: 0,
            errors: 0,
            movementsCreated: 0
        }

        for (const transaction of transactions || []) {
            try {
                results.processed++

                // Check if stock movements already exist for this transaction
                const { data: existingMovements } = await serviceSupabase
                    .from('stock_movements')
                    .select('id')
                    .eq('reference_id', transaction.id)
                    .eq('reference_type', 'transaction')
                    .limit(1)

                if (existingMovements && existingMovements.length > 0) {
                    console.log(`Transaction ${transaction.id.slice(0, 8)}... already has stock movements, skipping`)
                    results.skipped++
                    continue
                }

                // Process items if they exist
                if (transaction.items && Array.isArray(transaction.items)) {
                    for (const item of transaction.items) {
                        const product_id = item.product_id
                        const quantity = -(item.quantity || item.qty || 1) // Negative for stock out

                        // Get current stock before updating
                        const { data: product } = await serviceSupabase
                            .from('products')
                            .select('stock')
                            .eq('id', product_id)
                            .single()

                        if (!product) {
                            console.log(`Product ${product_id} not found, skipping`)
                            continue
                        }

                        const currentStock = product?.stock || 0
                        const newStock = Math.max(0, currentStock + quantity) // quantity is negative

                        // Update the actual product stock
                        const { error: stockUpdateError } = await serviceSupabase
                            .from('products')
                            .update({ stock: newStock })
                            .eq('id', product_id)

                        if (stockUpdateError) {
                            console.error(`Error updating stock for product ${product_id}:`, stockUpdateError)
                            results.errors++
                            continue
                        }

                        // Create stock movement record
                        const { error: movementError } = await serviceSupabase
                            .from('stock_movements')
                            .insert({
                                product_id: product_id,
                                quantity: quantity,
                                type: 'sale',
                                reference_id: transaction.id,
                                reference_type: 'transaction',
                                shop_id: transaction.shop_id,
                                user_id: transaction.user_id,
                                stock_before: currentStock,
                                stock_after: newStock,
                                created_at: transaction.created_at // Keep original transaction date
                            })

                        if (movementError) {
                            console.error(`Error creating movement for item ${product_id}:`, movementError)
                            results.errors++
                        } else {
                            results.movementsCreated++
                            console.log(`Updated stock for product ${product_id}: ${currentStock} → ${newStock}`)
                        }
                    }
                }
            } catch (error) {
                console.error(`Error processing transaction ${transaction.id}:`, error)
                results.errors++
            }
        }

        console.log('Backfill completed:', results)

        return NextResponse.json({
            success: true,
            message: 'Stock movements backfill completed',
            results
        })
    } catch (error) {
        console.error('Backfill error:', error)
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Send POST request to backfill stock movements for all completed transactions',
        endpoint: '/api/backfill-stock-movements',
        method: 'POST'
    })
}