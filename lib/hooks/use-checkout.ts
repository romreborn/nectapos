'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import { useUserProfile } from '@/lib/hooks/use-user-profile'
import { CartItem } from '@/lib/pos/cart-store'

interface CheckoutOptions {
    items: CartItem[]
    customerId: string | null
    subtotal: number
    taxAmount: number
    total: number
    paymentMethod?: string
}

interface CheckoutResult {
    success: boolean
    transactionId?: string
    error?: string
}

export function useCheckout() {
    const [loading, setLoading] = useState(false)
    const { profile } = useUserProfile()
    const supabase = createClient()

    const processCheckout = async (options: CheckoutOptions): Promise<CheckoutResult> => {
        setLoading(true)
        try {
            // Validate User
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not authenticated')

            const shopId = profile?.shop_id
            if (!shopId) throw new Error('Shop identification missing')

            // Prepare Items for RPC
            const rpcItems = options.items.map(item => ({
                product_id: item.product.id,
                product_name: item.product.name,
                quantity: item.qty,
                price: item.price,
                subtotal: item.price * item.qty,
                // Note: Per-item tax calculation logic should match global calculation
                // For now, we store basic item info. 
                // If per-item tax is needed, pass it in from cart or calculate here.
            }))

            // Call RPC
            const { data, error } = await supabase.rpc('process_checkout', {
                p_shop_id: shopId,
                p_user_id: user.id,
                p_customer_id: options.customerId,
                p_items: rpcItems, // Supabase JS auto-converts to JSONB
                p_payment_method: options.paymentMethod || 'cash',
                p_total_amount: options.total,
                p_tax_amount: options.taxAmount,
                p_subtotal_amount: options.subtotal
            })

            if (error) throw error

            // Parse Result (RPC returns JSONB)
            // The return type of RPC is any, so we cast or check
            const result = data as any

            if (!result.success) {
                throw new Error(result.error || 'Checkout failed')
            }

            return {
                success: true,
                transactionId: result.transaction_id
            }

        } catch (error: any) {
            console.error('Checkout Error:', error)
            return {
                success: false,
                error: error.message || 'Failed to process checkout'
            }
        } finally {
            setLoading(false)
        }
    }

    return {
        processCheckout,
        loading
    }
}
