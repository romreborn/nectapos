// Run this script to backfill all existing POS transactions into stock_movements table
// Usage: node fix-stock-movements.js

const { createServiceClient } = require('./lib/supabase/service-client.js')

async function backfillStockMovements() {
    const serviceSupabase = createServiceClient()

    console.log('Starting stock movements backfill...')

    // Get all completed transactions
    const { data: transactions, error: transactionError } = await serviceSupabase
        .from('transactions')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: true })

    if (transactionError) {
        console.error('Error fetching transactions:', transactionError)
        process.exit(1)
    }

    console.log(`Found ${transactions.length} transactions to process`)

    let processed = 0
    let skipped = 0
    let movementsCreated = 0

    for (const transaction of transactions) {
        processed++

        // Check if stock movements already exist for this transaction
        const { data: existingMovements } = await serviceSupabase
            .from('stock_movements')
            .select('id')
            .eq('reference_id', transaction.id)
            .eq('reference_type', 'transaction')
            .limit(1)

        if (existingMovements && existingMovements.length > 0) {
            console.log(`Transaction ${transaction.id.slice(0, 8)}... already has stock movements, skipping`)
            skipped++
            continue
        }

        // Process items if they exist
        if (transaction.items && Array.isArray(transaction.items)) {
            for (const item of transaction.items) {
                const product_id = item.product_id
                const quantity = -(item.quantity || item.qty || 1) // Negative for stock out

                // Get current stock before creating movement
                const { data: product } = await serviceSupabase
                    .from('products')
                    .select('stock')
                    .eq('id', product_id)
                    .single()

                const currentStock = product?.stock || 0
                const newStock = Math.max(0, currentStock + quantity) // quantity is negative

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
                } else {
                    movementsCreated++
                }
            }
        }
    }

    console.log('\nBackfill completed!')
    console.log(`Total transactions processed: ${processed}`)
    console.log(`Transactions skipped: ${skipped}`)
    console.log(`Stock movements created: ${movementsCreated}`)
}

// Run the function
backfillStockMovements().catch(console.error)