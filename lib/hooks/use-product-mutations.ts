'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']

export function useProductMutations() {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    async function createProduct(product: ProductInsert) {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('products')
                .insert(product)
                .select()
                .single()

            if (error) throw error
            return { data, error: null }
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
            const { data, error } = await supabase
                .from('products')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return { data, error: null }
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
