'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

type Product = Database['public']['Tables']['products']['Row']

export function useProducts(shopId?: string) {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const supabase = createClient()

    useEffect(() => {
        if (!shopId) {
            setLoading(false)
            setProducts([])
            return
        }

        fetchProducts()

        // Subscribe to real-time changes
        const channel = supabase
            .channel('products-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'products',
                    filter: `shop_id=eq.${shopId}`
                },
                (payload: any) => {
                    console.log('Product change:', payload)
                    fetchProducts() // Refetch on any change
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [shopId])

    async function fetchProducts() {
        if (!shopId) {
            setProducts([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            let query = supabase
                .from('products')
                .select('*')
                .eq('shop_id', shopId)
                .order('created_at', { ascending: false })

            const { data, error: fetchError } = await query

            if (fetchError) throw fetchError
            setProducts(data || [])
            setError(null)
        } catch (err) {
            console.error('Error fetching products:', err)
            setError(err as Error)
        } finally {
            setLoading(false)
        }
    }

    return { products, loading, error, refetch: fetchProducts }
}
