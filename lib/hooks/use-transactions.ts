'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

type Transaction = Database['public']['Tables']['transactions']['Row']

interface TransactionStats {
    totalSales: number
    transactionCount: number
    productsSold: number
    avgOrderValue: number
}

export function useTransactions(shopId?: string, startDate?: string, endDate?: string, cashierId?: string, search?: string) {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [stats, setStats] = useState<TransactionStats>({
        totalSales: 0,
        transactionCount: 0,
        productsSold: 0,
        avgOrderValue: 0
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchTransactions()

        // Subscribe to real-time changes
        const channel = supabase
            .channel('transactions-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                    filter: shopId ? `shop_id=eq.${shopId}` : undefined
                },
                () => {
                    fetchTransactions()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [shopId, startDate, endDate, cashierId, search])

    async function fetchTransactions() {
        try {
            setLoading(true)

            // Build query parameters
            const params = new URLSearchParams()
            if (shopId) params.append('shopId', shopId)
            if (startDate) params.append('startDate', startDate)
            if (endDate) params.append('endDate', endDate)
            if (cashierId) {
                // For backward compatibility, pass as cashierId
                params.append('cashierId', cashierId)
            }
            if (search) params.append('search', search)

            // Try POS-specific endpoint first (uses session auth)
            let response = await fetch(`/api/transactions-pos?${params.toString()}`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            // If POS API fails, try the simple API route
            if (!response.ok) {
                console.log('POS API failed, trying simple API')
                response = await fetch(`/api/transactions-simple?${params.toString()}`, {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
            }

            // If simple API fails, try the detailed API with auth
            if (!response.ok) {
                console.log('Simple API failed, trying detailed API')
                const { data: { session } } = await supabase.auth.getSession()
                response = await fetch(`/api/transactions/detailed?${params.toString()}`, {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
            }

            if (response.ok) {
                const data = await response.json()
                console.log('API Response:', {
                    transactionsCount: data.transactions?.length,
                    cashierId: cashierId,
                    success: true
                })
                setTransactions(data.transactions)
                setStats(data.stats)
            } else {
                // Log the error before falling back
                console.error('API route failed with status:', response.status)
                // Fallback to client-side fetch
                await fetchFromClient()
            }

            setError(null)
        } catch (err) {
            console.error('Error fetching transactions:', err)
            // Try client-side fetch as last resort
            try {
                await fetchFromClient()
            } catch (clientErr) {
                setError(err as Error)
            }
        } finally {
            setLoading(false)
        }
    }

    async function fetchFromClient() {
        // First fetch transactions without joining transaction_items due to RLS
        let query = supabase
            .from('transactions')
            .select('*')
            .eq('status', 'completed')
            .order('created_at', { ascending: false })

        if (shopId) {
            query = query.eq('shop_id', shopId)
        }

        // Filter by user if cashierId is provided (treat cashierId as userId)
        if (cashierId) {
            query = query.eq('user_id', cashierId)
        }

        if (startDate) {
            query = query.gte('created_at', startDate)
        }

        if (endDate) {
            query = query.lte('created_at', endDate)
        }

        const { data: transactionsData, error: fetchError } = await query

        console.log('Client-side fetch:', {
            shopId,
            cashierId,
            startDate,
            endDate,
            found: transactionsData?.length || 0,
            error: fetchError?.message
        })

        if (fetchError) throw fetchError

        const transactions = transactionsData || []

        // Items are now stored in the items field of the transactions table
        const enhancedTransactions = transactions

        setTransactions(enhancedTransactions)

        // Calculate stats
        const totalSales = enhancedTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0)
        const transactionCount = enhancedTransactions.length
        const productsSold = enhancedTransactions.reduce((sum, t) => {
            return sum + (t.items?.reduce((itemSum: number, item: any) => itemSum + (item.quantity || item.qty || 1), 0) || 0)
        }, 0)
        const avgOrderValue = transactionCount > 0 ? totalSales / transactionCount : 0

        setStats({
            totalSales,
            transactionCount,
            productsSold,
            avgOrderValue
        })
    }

    return { transactions, stats, loading, error, refetch: fetchTransactions }
}
