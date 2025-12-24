// Run this to debug stock issues
// Usage: node debug_stock_fix.js

const { createServiceClient } = require('./lib/supabase/service-client.js')

async function debugStockIssue() {
    const serviceSupabase = createServiceClient()

    console.log('=== DEBUGGING STOCK ISSUE ===\n')

    // 1. Check all completed transactions
    console.log('1. Checking completed transactions...')
    const { data: transactions, error: transError } = await serviceSupabase
        .from('transactions')
        .select('id, created_at, items')
        .eq('status', 'completed')

    if (transError) {
        console.error('Error fetching transactions:', transError)
        return
    }

    console.log(`Found ${transactions.length} completed transactions`)

    // 2. Check product IDs in transactions
    const productIdsInTransactions = new Set()
    let totalItems = 0

    for (const trans of transactions) {
        if (trans.items && Array.isArray(trans.items)) {
            for (const item of trans.items) {
                totalItems++
                if (item.product_id) {
                    productIdsInTransactions.add(item.product_id)
                }
            }
        }
    }

    console.log(`Total items in transactions: ${totalItems}`)
    console.log(`Unique product IDs in transactions: ${productIdsInTransactions.size}`)

    // 3. Check all products
    console.log('\n2. Checking all products...')
    const { data: products, error: prodError } = await serviceSupabase
        .from('products')
        .select('id, name, sku, stock')

    if (prodError) {
        console.error('Error fetching products:', prodError)
        return
    }

    console.log(`Found ${products.length} products in database`)

    // 4. Show sample of products
    console.log('\n3. Sample products:')
    for (let i = 0; i < Math.min(5, products.length); i++) {
        const p = products[i]
        console.log(`  - ${p.name} (ID: ${p.id}) - Stock: ${p.stock}`)
    }

    // 5. Check which product IDs are not found
    console.log('\n4. Checking for missing products...')
    const missingProducts = []
    for (const productId of productIdsInTransactions) {
        const found = products.find(p => p.id === productId)
        if (!found) {
            missingProducts.push(productId)
        }
    }

    if (missingProducts.length > 0) {
        console.log(`Missing product IDs (${missingProducts.length}):`)
        missingProducts.forEach(id => console.log(`  - ${id}`))
    } else {
        console.log('All product IDs in transactions exist in products table')
    }

    // 6. Calculate what the stock should be for each product
    console.log('\n5. Calculating correct stock levels...')
    for (const product of products.slice(0, 5)) {
        let soldCount = 0

        for (const trans of transactions) {
            if (trans.items && Array.isArray(trans.items)) {
                for (const item of trans.items) {
                    if (item.product_id === product.id) {
                        soldCount += (item.quantity || item.qty || 1)
                    }
                }
            }
        }

        const correctStock = Math.max(0, (product.stock || 0) - soldCount)
        console.log(`  ${product.name}:`)
        console.log(`    Current stock: ${product.stock}`)
        console.log(`    Total sold: ${soldCount}`)
        console.log(`    Should be: ${correctStock}`)
        console.log('')
    }
}

// Run the debug function
debugStockIssue().catch(console.error)