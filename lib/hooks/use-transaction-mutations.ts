'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TransactionData {
    id?: string
    shop_id: string
    user_id?: string
    customer_id?: string | null
    total_amount: number
    status?: string
    items?: any[]
    payment_method?: string
    tax_amount?: number
    subtotal_amount?: number
}

export function useTransactionMutations() {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    async function createTransaction(transactionData: TransactionData) {
        setLoading(true)
        try {
            const { items, ...transaction } = transactionData
            const transactionId = transaction.id || crypto.randomUUID()

            // Insert the transaction with items stored as JSON in the items field
            const { data: transactionRecord, error: transactionError } = await (supabase
                .from('transactions') as any)
                .insert({
                    ...transaction,
                    id: transactionId,
                    // Store items as JSON in the items field
                    items: items || []
                })
                .select()
                .single()

            if (transactionError) throw transactionError

            return { data: transactionRecord, error: null }
        } catch (error) {
            console.error('Error creating transaction:', error)
            return { data: null, error: error as Error }
        } finally {
            setLoading(false)
        }
    }

    return {
        createTransaction,
        loading
    }
}
