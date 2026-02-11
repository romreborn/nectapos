import { createServiceClient } from '@/lib/supabase/service-client'
import { NextResponse } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api-response'
import {
    fetchAllProducts,
    fetchProductMovements,
    updateProductStock,
    batchUpdateMovements,
    upsertInitialStock
} from '@/lib/stock/queries'
import {
    calculateStockProgression,
    calculateFinalStock,
    sortMovementsByDate
} from '@/lib/stock/calculations'
import { ProcessingStats, ProcessingError } from '@/lib/stock/types'

/**
 * Unified Stock Management API
 * 
 * Supports three operations:
 * - sync-initial: Create/update initial stock movements from products.stock_qty
 * - recalculate: Recalculate stock_before/stock_after for all movements
 * - full-sync: Both operations in sequence
 */
export async function POST(request: Request) {
    try {
        const supabase = createServiceClient()
        const body = await request.json()
        const operation = body.operation as 'sync-initial' | 'recalculate' | 'full-sync'

        if (!operation) {
            return errorResponse('Missing required field: operation', 400)
        }

        console.log(`[Stock Management] Starting operation: ${operation}`)

        const stats: ProcessingStats = {
            totalProducts: 0,
            totalProcessed: 0,
            totalErrors: 0,
            errors: []
        }

        // Fetch all products once
        const products = await fetchAllProducts(supabase)
        stats.totalProducts = products.length

        if (operation === 'sync-initial' || operation === 'full-sync') {
            await syncInitialStock(supabase, products, stats)
        }

        if (operation === 'recalculate' || operation === 'full-sync') {
            await recalculateStockMovements(supabase, products, stats)
        }

        console.log(`[Stock Management] Completed: ${stats.totalProcessed}/${stats.totalProducts} products`)

        return successResponse({
            operation,
            stats: {
                totalProducts: stats.totalProducts,
                totalProcessed: stats.totalProcessed,
                totalErrors: stats.totalErrors,
                errors: stats.errors.length > 0 ? stats.errors : undefined
            }
        })

    } catch (error: any) {
        console.error('[Stock Management] Error:', error)
        return errorResponse(error.message || 'Internal server error', 500)
    }
}

/**
 * Sync initial stock movements from products.stock_qty
 */
async function syncInitialStock(
    supabase: any,
    products: any[],
    stats: ProcessingStats
): Promise<void> {
    console.log('[Stock Management] Syncing initial stock...')

    for (const product of products) {
        try {
            const initialStock = product.stock_qty || 0
            await upsertInitialStock(supabase, product, initialStock)
            stats.totalProcessed++

            console.log(`  ✓ ${product.name}: initial stock = ${initialStock}`)
        } catch (err: any) {
            console.error(`  ✗ ${product.name}:`, err.message)
            stats.totalErrors++
            stats.errors.push({
                productId: product.id,
                productName: product.name,
                error: err.message
            })
        }
    }
}

/**
 * Recalculate stock_before/stock_after for all movements
 */
async function recalculateStockMovements(
    supabase: any,
    products: any[],
    stats: ProcessingStats
): Promise<void> {
    console.log('[Stock Management] Recalculating stock movements...')

    for (const product of products) {
        try {
            // Fetch all movements for this product
            const movements = await fetchProductMovements(supabase, product.id, {
                orderAsc: true
            })

            if (movements.length === 0) {
                console.log(`  - ${product.name}: no movements`)
                continue
            }

            // Sort movements chronologically
            const sortedMovements = sortMovementsByDate(movements, true)

            // Calculate stock progression
            const updates = calculateStockProgression(sortedMovements)

            // Batch update movements
            const { updated, errors } = await batchUpdateMovements(
                supabase,
                updates.map(u => ({
                    id: u.movementId,
                    stock_before: u.stock_before,
                    stock_after: u.stock_after
                }))
            )

            // Update product's final stock
            const finalStock = updates[updates.length - 1]?.stock_after || 0
            await updateProductStock(supabase, product.id, finalStock)

            stats.totalProcessed++
            stats.errors.push(...errors)
            stats.totalErrors += errors.length

            console.log(`  ✓ ${product.name}: ${updated}/${movements.length} movements, final stock = ${finalStock}`)
        } catch (err: any) {
            console.error(`  ✗ ${product.name}:`, err.message)
            stats.totalErrors++
            stats.errors.push({
                productId: product.id,
                productName: product.name,
                error: err.message
            })
        }
    }
}
