'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import { useUserProfile } from '@/lib/hooks/use-user-profile'

type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']

export function useProductMutations() {
    const [loading, setLoading] = useState(false)
    const { profile } = useUserProfile()
    const supabase = createClient()

    async function createProduct(product: ProductInsert) {
        setLoading(true)
        try {
            if (!profile?.shop_id || !profile?.id) {
                throw new Error('User profile or shop not loaded')
            }

            // Use RPC to create product and initial stock movement
            const { data, error } = await supabase.rpc('create_product_general', {
                p_id: product.id || crypto.randomUUID(),
                p_shop_id: profile.shop_id, // Force use of profile shop_id
                p_user_id: profile.id,
                p_name: product.name,
                p_sku: product.sku || null,
                p_price: product.price,
                p_stock_qty: product.stock_qty || 0,
                p_is_custom: product.is_custom || false
            })

            if (error) throw error
            const result = data as any
            if (!result.success) throw new Error(result.error || 'Failed to create product')

            return { data: result.data, error: null }
        } catch (error) {
            console.error('Error creating product:', error)
            return { data: null, error: error as Error }
        } finally {
            setLoading(false)
        }
    }

    async function updateProduct(id: string, updates: ProductUpdate) {
        setLoading(true)
        try {
            if (!profile?.shop_id || !profile?.id) {
                throw new Error('User profile or shop not loaded')
            }

            // Use RPC to update product and track stock changes
            const { data, error } = await supabase.rpc('update_product_general', {
                p_product_id: id,
                p_shop_id: profile.shop_id,
                p_user_id: profile.id,
                p_name: updates.name,
                p_sku: updates.sku || null,
                p_price: updates.price,
                p_stock_qty: updates.stock_qty,
                p_is_custom: updates.is_custom
            })

            if (error) throw error
            const result = data as any
            if (!result.success) throw new Error(result.error || 'Failed to update product')

            return { data: result, error: null }
        } catch (error) {
            console.error('Error updating product:', error)
            return { data: null, error: error as Error }
        } finally {
            setLoading(false)
        }
    }

    async function deleteProduct(id: string) {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id)

            if (error) throw error
            return { error: null }
        } catch (error) {
            console.error('Error deleting product:', error)
            return { error: error as Error }
        } finally {
            setLoading(false)
        }
    }

    return {
        createProduct,
        updateProduct,
        deleteProduct,
        loading
    }
}
