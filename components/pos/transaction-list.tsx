'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
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
    status: string
    user_id?: string
    customers?: {
        name?: string
        email?: string
        phone?: string
    }
    items?: any[]
}

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

            // Get current session
            const { data: { session } } = await supabase.auth.getSession()

            if (!session?.user) {
                setError('No authenticated user')
                return
            }

            console.log('TransactionList - Session user:', {
                id: session.user.id,
                email: session.user.email,
                aud: session.user.aud
            })
            console.log('TransactionList - Fetching for user:', session.user.id)
            console.log('Date range:', { startDate, endDate })
            console.log('Shop ID:', shopId)

            // Use the transactions API instead of direct Supabase
            const url = new URL('/api/transactions-pos', window.location.origin)
            url.searchParams.set('shopId', shopId)
            if (startDate) {
                url.searchParams.set('startDate', startDate)
            }
            if (endDate) {
                url.searchParams.set('endDate', endDate)
            }

            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })

            if (!response.ok) {
                const errorData = await response.json()
                console.error('Fetch error:', errorData)
                setError(errorData.error || 'Failed to fetch transactions')
                return
            }

            const data = await response.json()
            console.log('TransactionList - API Response:', {
                count: data.transactions?.length || 0,
                stats: data.stats
            })

            // Log each transaction's user_id for debugging
            if (data.transactions && data.transactions.length > 0) {
                console.log('TransactionList - Transaction user_ids:',
                    data.transactions.map(t => ({
                        id: t.id,
                        user_id: t.user_id,
                        created_at: t.created_at
                    }))
                )
            }

            setTransactions(data.transactions || [])
        } catch (err) {
            console.error('TransactionList error:', err)
            setError('Failed to load transactions')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading transactions...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
                <p>Error: {error}</p>
                <p className="text-sm mt-2">User ID: {currentUserId.slice(0, 8)}...</p>
            </div>
        )
    }

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <p className="text-lg font-medium">No transactions yet</p>
                <p className="text-sm">Your completed sales will appear here</p>
                <p className="text-xs mt-2">
                    Showing transactions for user: {currentUserId.slice(0, 8)}...
                </p>
            </div>
        )
    }

    return (
        <ScrollArea className="flex-1">
            <div className="space-y-3 p-4">
                {transactions.map((transaction) => {
                    const items = transaction.items || []

                    // Debug log to see the actual items structure
                    console.log('Items:', items)

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
                                    {transaction.user_id && (
                                        <p className="text-xs text-muted-foreground">
                                            Created by: {transaction.user_id.slice(0, 8)}...
                                            {currentUserId === transaction.user_id && (
                                                <span className="text-green-600 ml-1"> (You)</span>
                                            )}
                                        </p>
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
                                        // Handle different possible field names
                                        const quantity = Number(item.quantity || item.qty || item.quantity_at_sale || 1)
                                        const price = Number(item.price_at_sale || item.price || item.unit_price || 0)
                                        const name = item.product_name || item.name || item.product || 'Unknown Product'
                                        const totalPrice = quantity * price

                                        // Check if tax info is available (new format)
                                        const hasTax = item.tax_amount !== undefined && item.tax_percentage !== undefined
                                        const subtotal = Number(item.subtotal || totalPrice)
                                        const taxAmount = hasTax ? Number(item.tax_amount) : 0
                                        const itemTotal = hasTax ? Number(item.total) : totalPrice

                                        return (
                                            <div key={idx} className="text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">
                                                        {quantity}x {name}
                                                    </span>
                                                    <span>{formatCurrency(itemTotal, settings.currency)}</span>
                                                </div>
                                                {hasTax && taxAmount > 0 && (
                                                    <div className="ml-8 text-xs text-muted-foreground">
                                                        Subtotal: {formatCurrency(subtotal, settings.currency)} |
                                                        Tax ({item.tax_percentage}%): {formatCurrency(taxAmount, settings.currency)}
                                                    </div>
                                                )}
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
                            <div className="space-y-1 pt-2 border-t">
                                <div className="flex justify-between font-bold">
                                    <span>Total</span>
                                    <span>{formatCurrency(Number(transaction.total_amount || 0), settings.currency)}</span>
                                </div>
                            </div>

                            {transaction.customer_id && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    Customer: Anonymous Guest
                                </p>
                            )}
                        </Card>
                    )
                })}
            </div>
        </ScrollArea>
    )
}