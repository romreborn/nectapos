import { SupabaseClient } from '@supabase/supabase-js'
import { Product, StockMovement, ProcessingError } from './types'

/**
 * Fetch all products with their stock information
 */
export async function fetchAllProducts(
    supabase: SupabaseClient
): Promise<Product[]> {
    const { data, error } = await (supabase
        .from('products') as any)
        .select('id, shop_id, name, stock_qty, created_at')

    if (error) throw new Error(`Failed to fetch products: ${error.message}`)
    return data || []
}

/**
 * Fetch stock movements for a specific product
 */
export async function fetchProductMovements(
    supabase: SupabaseClient,
    productId: string,
    options: { excludeInitial?: boolean; orderAsc?: boolean } = {}
): Promise<StockMovement[]> {
    let query = (supabase
        .from('stock_movements') as any)
        .select('*')
        .eq('product_id', productId)

    if (options.excludeInitial) {
        query = query.neq('reference_type', 'initial stock')
    }

    query = query.order('created_at', { ascending: options.orderAsc ?? true })

    const { data, error } = await query

    if (error) throw new Error(`Failed to fetch movements: ${error.message}`)
    return data || []
}

/**
 * Fetch or check for existing initial stock movement
 */
export async function fetchInitialStockMovement(
    supabase: SupabaseClient,
    productId: string
): Promise<StockMovement | null> {
    const { data, error } = await (supabase
        .from('stock_movements') as any)
        .select('*')
        .eq('product_id', productId)
        .eq('reference_type', 'initial stock')
        .limit(1)
        .maybeSingle()

    if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch initial stock: ${error.message}`)
    }

    return data
}

/**
 * Update product stock quantity
 */
export async function updateProductStock(
    supabase: SupabaseClient,
    productId: string,
    stockQty: number
): Promise<void> {
    const { error } = await (supabase
        .from('products') as any)
        .update({ stock_qty: Math.max(0, stockQty) })
        .eq('id', productId)

    if (error) throw new Error(`Failed to update product stock: ${error.message}`)
}

/**
 * Batch update stock movements
 */
export async function batchUpdateMovements(
    supabase: SupabaseClient,
    updates: Array<{ id: string; stock_before: number; stock_after: number }>
): Promise<{ updated: number; errors: ProcessingError[] }> {
    const errors: ProcessingError[] = []
    let updated = 0

    // Process in batches to avoid overwhelming the database
    const batchSize = 50
    for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize)

        for (const update of batch) {
            try {
                const { error } = await (supabase
                    .from('stock_movements') as any)
                    .update({
                        stock_before: update.stock_before,
                        stock_after: update.stock_after
                    })
                    .eq('id', update.id)

                if (error) throw error
                updated++
            } catch (err: any) {
                errors.push({
                    movementId: update.id,
                    error: err.message
                })
            }
        }
    }

    return { updated, errors }
}

/**
 * Create or update initial stock movement
 */
export async function upsertInitialStock(
    supabase: SupabaseClient,
    product: Product,
    initialStock: number
): Promise<{ created: boolean; updated: boolean }> {
    const existing = await fetchInitialStockMovement(supabase, product.id)

    if (existing) {
        // Update existing
        const { error } = await (supabase
            .from('stock_movements') as any)
            .update({
                quantity: initialStock,
                stock_before: 0,
                stock_after: initialStock,
                type: 'initial'
            })
            .eq('id', existing.id)

        if (error) throw new Error(`Failed to update initial stock: ${error.message}`)
        return { created: false, updated: true }
    } else {
        // Create new
        const { error } = await (supabase
            .from('stock_movements') as any)
            .insert({
                product_id: product.id,
                shop_id: product.shop_id,
                type: 'initial',
                quantity: initialStock,
                stock_before: 0,
                stock_after: initialStock,
                reference_type: 'initial stock',
                reference_id: null,
                created_at: product.created_at
            })

        if (error) throw new Error(`Failed to create initial stock: ${error.message}`)
        return { created: true, updated: false }
    }
}
