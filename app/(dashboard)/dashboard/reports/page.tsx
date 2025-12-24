'use client'

import React, { useState, useEffect } from 'react'
import { useShopSettings, formatCurrency } from "@/lib/hooks/use-shop-settings"
import { useUserProfile } from "@/lib/hooks/use-user-profile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Download, TrendingUp, ShoppingCart, Package, DollarSign, Calendar, Filter, ChevronDown, Store, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from "@/components/ui/skeleton"

export default function ReportsPage() {
    const { settings } = useShopSettings()
    const { profile } = useUserProfile()
    const supabase = createClient()

    // Filter States
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [dateRange, setDateRange] = useState({
        startDate: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    })
    const [selectedShopId, setSelectedShopId] = useState('')

    // Data States
    const [stats, setStats] = useState<any>(null)
    const [transactions, setTransactions] = useState<any[]>([])
    const [totalCount, setTotalCount] = useState(0)

    // Pagination
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)

    // Loading States
    const [loadingStats, setLoadingStats] = useState(true)
    const [loadingTable, setLoadingTable] = useState(true)

    const shopId = selectedShopId || profile?.shop_id

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
            setPage(1) // Reset to page 1 on search change
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Fetch Stats using RPC
    useEffect(() => {
        if (!shopId) return

        async function fetchStats() {
            setLoadingStats(true)
            try {
                // Ensure dates are full timestamps
                const start = new Date(dateRange.startDate).toISOString()
                const end = new Date(new Date(dateRange.endDate).setHours(23, 59, 59, 999)).toISOString()

                const { data, error } = await supabase.rpc(
                    'get_dashboard_summary',
                    { p_shop_id: shopId, p_start_date: start, p_end_date: end } as any
                )

                if (error) {
                    console.error("RPC Error details:", error)
                    throw error
                }
                setStats(data?.[0] || {})
            } catch (err) {
                console.error("Error fetching report stats:", JSON.stringify(err, null, 2))
            } finally {
                setLoadingStats(false)
            }
        }
        fetchStats()
    }, [shopId, dateRange])

    // Fetch Transactions with Server-Side Pagination & Filtering
    useEffect(() => {
        if (!shopId) return

        async function fetchTableData() {
            setLoadingTable(true)
            try {
                // Dates
                const start = new Date(dateRange.startDate).toISOString()
                const end = new Date(new Date(dateRange.endDate).setHours(23, 59, 59, 999)).toISOString()

                let dataToDisplay: any[] = []
                let total = 0

                if (debouncedSearch) {
                    // Client-side search on recent items (Restriction: Server-side search requires RPC)
                    const { data, error } = await supabase
                        .from('transactions')
                        .select('*, customers(name, email, phone), profiles!transactions_cashier_id_fkey(full_name)')
                        .eq('shop_id', shopId)
                        .gte('created_at', start)
                        .lte('created_at', end)
                        .order('created_at', { ascending: false })
                        .limit(200) // Search limit optimization

                    if (error) throw error

                    const searchLower = debouncedSearch.toLowerCase()
                    const filtered = (data || []).filter((t: any) =>
                        t.id.toLowerCase().includes(searchLower) ||
                        (t.customers?.name || '').toLowerCase().includes(searchLower) ||
                        (Array.isArray(t.items) && t.items.some((i: any) => (i.product_name || i.name || '').toLowerCase().includes(searchLower)))
                    )

                    total = filtered.length
                    // Client-side pagination
                    const from = (page - 1) * pageSize
                    dataToDisplay = filtered.slice(from, from + pageSize)

                } else {
                    // Server-side pagination
                    const from = (page - 1) * pageSize
                    const to = from + pageSize - 1

                    const { data, count, error } = await supabase
                        .from('transactions')
                        .select('*, customers(name, email, phone), profiles!transactions_cashier_id_fkey(full_name)', { count: 'exact' })
                        .eq('shop_id', shopId)
                        .gte('created_at', start)
                        .lte('created_at', end)
                        .order('created_at', { ascending: false })
                        .range(from, to)

                    if (error) throw error

                    dataToDisplay = data || []
                    total = count || 0
                }

                setTransactions(dataToDisplay)
                setTotalCount(total)

            } catch (err) {
                console.error("Error fetching transactions table:", JSON.stringify(err, null, 2))
            } finally {
                setLoadingTable(false)
            }
        }
        fetchTableData()
    }, [shopId, dateRange, debouncedSearch, page, pageSize])

    const totalPages = Math.ceil(totalCount / pageSize)

    const exportData = () => {
        // Implement proper full export via API or paginated fetching loop if needed
        alert("Exporting visible data...")
    }

    return (
        <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>
                    <p className="text-muted-foreground">
                        View sales reports and performance metrics.
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="px-2 py-1 border rounded"
                        />
                        <span>to</span>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="px-2 py-1 border rounded"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards - Transparent Glass Theme */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-blue-500/10 border-blue-500/20 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Sales</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </CardHeader>
                    <CardContent>
                        {loadingStats ? <Skeleton className="h-8 w-24 bg-blue-500/20" /> : (
                            <div className="text-2xl font-bold text-blue-950 dark:text-white">{formatCurrency(stats?.total_sales || 0, settings.currency)}</div>
                        )}
                        <p className="text-xs text-blue-600/80 dark:text-blue-200/70 mt-1">
                            {format(new Date(dateRange.startDate), 'MMM dd')} - {format(new Date(dateRange.endDate), 'MMM dd')}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-blue-500/10 border-blue-500/20 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Transactions</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </CardHeader>
                    <CardContent>
                        {loadingStats ? <Skeleton className="h-8 w-24 bg-blue-500/20" /> : (
                            <div className="text-2xl font-bold text-blue-950 dark:text-white">{stats?.transaction_count || 0}</div>
                        )}
                        <p className="text-xs text-blue-600/80 dark:text-blue-200/70 mt-1">Completed orders</p>
                    </CardContent>
                </Card>

                <Card className="bg-blue-500/10 border-blue-500/20 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Avg. Order</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </CardHeader>
                    <CardContent>
                        {loadingStats ? <Skeleton className="h-8 w-24 bg-blue-500/20" /> : (
                            <div className="text-2xl font-bold text-blue-950 dark:text-white">{formatCurrency(stats?.avg_order_value || 0, settings.currency)}</div>
                        )}
                        <p className="text-xs text-blue-600/80 dark:text-blue-200/70 mt-1">Per transaction</p>
                    </CardContent>
                </Card>

                <Card className="bg-blue-500/10 border-blue-500/20 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Products Sold</CardTitle>
                        <Package className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </CardHeader>
                    <CardContent>
                        {loadingStats ? <Skeleton className="h-8 w-24 bg-blue-500/20" /> : (
                            <div className="text-2xl font-bold text-blue-950 dark:text-white">{stats?.products_sold || 0}</div>
                        )}
                        <p className="text-xs text-blue-600/80 dark:text-blue-200/70 mt-1">Total items</p>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                        Showing {transactions.length} of {totalCount} transactions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by ID or Product..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>

                        {loadingTable ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : transactions.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                No transactions found.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Items</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map((transaction) => (
                                            <TableRow key={transaction.id}>
                                                <TableCell className="font-mono text-xs">
                                                    {transaction.id.slice(0, 8)}...
                                                </TableCell>
                                                <TableCell>
                                                    {format(new Date(transaction.created_at), 'MMM dd, HH:mm')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {transaction.profiles?.full_name || 'Unknown'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {transaction.customers?.name || 'Anonymous'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[300px]">
                                                    <div className="flex flex-col gap-1 text-xs">
                                                        {Array.isArray(transaction.items) && transaction.items.map((item: any, idx: number) => (
                                                            <div key={idx} className="truncate">
                                                                <span className="font-semibold text-blue-600 dark:text-blue-400">{item.quantity}x</span> {item.product_name || item.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-semibold text-right">
                                                    {formatCurrency(transaction.total_amount || 0, settings.currency)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                                                        {transaction.status || 'pending'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loadingTable}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm font-medium">
                                Page {page} of {Math.max(1, totalPages)}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages || loadingTable}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}