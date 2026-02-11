'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useShopSettings, formatCurrency } from '@/lib/hooks/use-shop-settings'

// Helper function to convert UTC to Indonesia timezone (UTC+7)
function toIndonesiaTime(date: Date): Date {
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
    return new Date(utcDate.getTime() + 7 * 60 * 60000)
}

// Helper function to format date in Indonesia timezone
function formatIndonesiaDateTime(dateString: string): string {
    const date = new Date(dateString)
    const indoDate = toIndonesiaTime(date)
    return indoDate.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

interface Transaction {
    id: string
    created_at: string
    total_amount: number
    subtotal_amount?: number
    tax_amount?: number
    payment_method?: string
    status: string
    user_id?: string
    customer_id?: string
    customers?: {
        name?: string
        email?: string
        phone?: string
    }
    items?: any[]
}

import { Skeleton } from '@/components/ui/skeleton'

// ... (existing helper functions)

export function TransactionList({
    shopId,
    startDate,
    endDate,
    currentUserId
}: {
    shopId: string
    startDate: string
    endDate: string
    currentUserId: string
}) {
    const { settings } = useShopSettings()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchTransactions()
    }, [shopId, startDate, endDate, currentUserId])

    async function fetchTransactions() {
        try {
            setLoading(true)
            setError(null)

            const { data: { session } } = await supabase.auth.getSession()

            if (!session?.user) {
                setError('No authenticated user')
                return
            }

            const url = new URL('/api/transactions-pos', window.location.origin)
            url.searchParams.set('shopId', shopId)
            if (startDate) url.searchParams.set('startDate', startDate)
            if (endDate) url.searchParams.set('endDate', endDate)

            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })

            const responseData = await response.json()

            if (!response.ok || !responseData.success) {
                setError(responseData.error || 'Failed to fetch transactions')
                return
            }

            setTransactions(responseData.data?.transactions || [])
        } catch (err) {
            console.error('TransactionList error:', err)
            setError('Failed to load transactions')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border bg-card text-card-foreground shadow p-4 space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
                <p>Error: {error}</p>
            </div>
        )
    }

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <p className="text-lg font-medium">No transactions yet</p>
                <p className="text-sm">Your completed sales will appear here</p>
            </div>
        )
    }

    return (
        <ScrollArea className="flex-1">
            <div className="space-y-3 p-4">
                {transactions.map((transaction) => {
                    const items = transaction.items || []

                    return (
                        <Card key={transaction.id} className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {transaction.created_at ? formatIndonesiaDateTime(transaction.created_at) : 'No date'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        ID: {transaction.id.slice(0, 8)}...
                                    </p>
                                    {transaction.payment_method && (
                                        <Badge variant="outline" className="mt-1 text-xs">
                                            {transaction.payment_method}
                                        </Badge>
                                    )}
                                </div>
                                <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                                    {transaction.status || 'unknown'}
                                </Badge>
                            </div>

                            {/* Transaction Items */}
                            {items && items.length > 0 ? (
                                <div className="space-y-2 mb-3">
                                    {items.slice(0, 3).map((item: any, idx: number) => {
                                        const quantity = Number(item.quantity || item.qty || 1)
                                        // Handle both old and new price fields
                                        const price = Number(item.price || item.price_at_sale || 0)
                                        const name = item.product_name || item.name || 'Unknown Product'
                                        const subtotal = Number(item.subtotal || (price * quantity))

                                        return (
                                            <div key={idx} className="text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">
                                                        {quantity}x {name}
                                                    </span>
                                                    <span>{formatCurrency(subtotal, settings.currency)}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {items.length > 3 && (
                                        <p className="text-xs text-muted-foreground">
                                            ...and {items.length - 3} more items
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground mb-3">
                                    No item details available
                                </p>
                            )}

                            {/* Transaction Summary */}
                            <div className="space-y-1 pt-2 border-t text-sm">
                                {transaction.subtotal_amount !== undefined && transaction.subtotal_amount !== transaction.total_amount && (
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(Number(transaction.subtotal_amount), settings.currency)}</span>
                                    </div>
                                )}
                                {transaction.tax_amount !== undefined && transaction.tax_amount > 0 && (
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Tax</span>
                                        <span>{formatCurrency(Number(transaction.tax_amount), settings.currency)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-base mt-1">
                                    <span>Total</span>
                                    <span>{formatCurrency(Number(transaction.total_amount || 0), settings.currency)}</span>
                                </div>
                            </div>

                            {(transaction.customer_id || transaction.customers?.name) && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    Customer: {transaction.customers?.name || 'Guest'}
                                </p>
                            )}
                        </Card>
                    )
                })}
            </div>
        </ScrollArea>
    )
}