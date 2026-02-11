/**
 * Stock Management Type Definitions
 */

export interface Product {
    id: string
    shop_id: string
    name: string
    stock_qty: number
    created_at: string
}

export interface StockMovement {
    id: string
    product_id: string
    shop_id: string
    type: 'initial' | 'sale' | 'purchase' | 'restock' | 'opname' | 'cancel_return' | 'adjustment'
    quantity: number
    stock_before: number
    stock_after: number
    reference_type: string | null
    reference_id: string | null
    created_at: string
}

export interface StockCalculationResult {
    productId: string
    productName: string
    initialStock: number
    totalMovements: number
    finalStock: number
    movementsCount: number
}

export interface ProcessingStats {
    totalProducts: number
    totalProcessed: number
    totalErrors: number
    errors: ProcessingError[]
}

export interface ProcessingError {
    productId?: string
    productName?: string
    movementId?: string
    error: string
}

export interface RecalculationOptions {
    updateProductStock?: boolean
    startFromZero?: boolean
}
