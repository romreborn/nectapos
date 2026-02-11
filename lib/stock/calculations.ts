import { StockMovement, StockCalculationResult, Product } from './types'

/**
 * Calculate stock progression through movements
 * Starts from 0 and applies each movement chronologically
 */
export function calculateStockProgression(
    movements: StockMovement[]
): Array<{ movementId: string; stock_before: number; stock_after: number }> {
    let runningStock = 0
    const updates: Array<{ movementId: string; stock_before: number; stock_after: number }> = []

    for (const movement of movements) {
        const stockBefore = runningStock
        const stockAfter = runningStock + movement.quantity

        updates.push({
            movementId: movement.id,
            stock_before: stockBefore,
            stock_after: stockAfter
        })

        runningStock = stockAfter
    }

    return updates
}

/**
 * Calculate final stock from initial stock and movements
 */
export function calculateFinalStock(
    initialStock: number,
    movements: StockMovement[]
): number {
    const totalMovements = movements.reduce((sum, m) => sum + (m.quantity || 0), 0)
    return Math.max(0, initialStock + totalMovements)
}

/**
 * Calculate stock statistics for a product
 */
export function calculateProductStats(
    product: Product,
    movements: StockMovement[]
): StockCalculationResult {
    const totalMovements = movements.reduce((sum, m) => sum + (m.quantity || 0), 0)
    const finalStock = product.stock_qty + totalMovements

    return {
        productId: product.id,
        productName: product.name,
        initialStock: product.stock_qty,
        totalMovements,
        finalStock: Math.max(0, finalStock),
        movementsCount: movements.length
    }
}

/**
 * Validate stock movement data
 */
export function validateMovement(movement: Partial<StockMovement>): string[] {
    const errors: string[] = []

    if (!movement.product_id) errors.push('product_id is required')
    if (!movement.shop_id) errors.push('shop_id is required')
    if (!movement.type) errors.push('type is required')
    if (movement.quantity === undefined || movement.quantity === null) {
        errors.push('quantity is required')
    }

    return errors
}

/**
 * Determine if a movement is an initial stock movement
 */
export function isInitialStockMovement(movement: StockMovement): boolean {
    return movement.type === 'initial' || movement.reference_type === 'initial stock'
}

/**
 * Sort movements chronologically
 */
export function sortMovementsByDate(
    movements: StockMovement[],
    ascending = true
): StockMovement[] {
    return [...movements].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return ascending ? dateA - dateB : dateB - dateA
    })
}
