'use client'

import React, { useState, useEffect } from 'react'
import { useShopSettings, formatCurrency } from "@/lib/hooks/use-shop-settings"
import { useUserProfile } from "@/lib/hooks/use-user-profile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Download, TrendingUp, ShoppingCart, Package, DollarSign, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from "@/components/ui/skeleton"

interface Transaction {
    id: string
    created_at: string
    total_amount: number
    status: string
    payment_method?: string
    customer_name?: string
    items?: any[]
    profiles?: { full_name: string } // Kept for type compatibility if RPC returns joined profile
}

interface AnalyticsSummary {
    totalSales: number
    transactionCount: number
    avgOrderValue: number
}

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

    // Data States
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
    const [dailySales, setDailySales] = useState<any[]>([])
    const [topProducts, setTopProducts] = useState<any[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [totalCount, setTotalCount] = useState(0)

    // Pagination
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)

    // Loading States
    const [loadingStats, setLoadingStats] = useState(true)
    const [loadingTable, setLoadingTable] = useState(true)

    const shopId = profile?.shop_id

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
            setPage(1) // Reset to page 1 on search change
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Fetch Analytics (Summary, Daily, Top Products)
    useEffect(() => {
        if (!shopId) return

        async function fetchAnalytics() {
            setLoadingStats(true)
            try {
                const start = new Date(dateRange.startDate).toISOString()
                const end = new Date(new Date(dateRange.endDate).setHours(23, 59, 59, 999)).toISOString()

                const { data, error } = await supabase.rpc('get_sales_analytics', {
                    p_shop_id: shopId,
                    p_start_date: start,
                    p_end_date: end
                })

                if (error) throw error

                // Type assertion for RPC result
                const result = data as any
                setSummary(result.summary)
                setDailySales(result.dailySales)
                setTopProducts(result.topProducts)
            } catch (err) {
                console.error("Error fetching analytics:", err)
            } finally {
                setLoadingStats(false)
            }
        }
        fetchAnalytics()
    }, [shopId, dateRange])

    // Fetch Transactions Table
    useEffect(() => {
        if (!shopId) return

        async function fetchTransactions() {
            setLoadingTable(true)
            try {
                const start = new Date(dateRange.startDate).toISOString()
                const end = new Date(new Date(dateRange.endDate).setHours(23, 59, 59, 999)).toISOString()

                const { data, error } = await supabase.rpc('search_transactions', {
                    p_shop_id: shopId,
                    p_search_term: debouncedSearch,
                    p_start_date: start,
                    p_end_date: end,
                    p_page: page,
                    p_page_size: pageSize
                })

                if (error) throw error

                const result = data as any
                setTransactions(result.data || [])
                setTotalCount(result.total || 0)
            } catch (err) {
                console.error("Error fetching transactions:", err)
            } finally {
                setLoadingTable(false)
            }
        }
        fetchTransactions()
    }, [shopId, dateRange, debouncedSearch, page, pageSize])

    const totalPages = Math.ceil(totalCount / pageSize)

    // Export Functionality (Client-side fetch of all matching records)
    const handleExport = async () => {
        if (!shopId) return;
        try {
            const start = new Date(dateRange.startDate).toISOString();
            const end = new Date(new Date(dateRange.endDate).setHours(23, 59, 59, 999)).toISOString();

            // Direct query for export to avoid pagination limits (though ideally should use cursor/batched)
            const { data, error } = await supabase
                .from('transactions')
                .select('*, customers(name, email), profiles!transactions_user_id_fkey(full_name)')
                .eq('shop_id', shopId)
                .gte('created_at', start)
                .lte('created_at', end)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!data || data.length === 0) {
                alert("No data to export");
                return;
            }

            const headers = ["ID", "Date", "Status", "Payment", "Total", "Customer", "Items"];
            const rows = data.map((t: any) => [
                t.id,
                new Date(t.created_at).toLocaleString(),
                t.status,
                t.payment_method || '-',
                t.total_amount,
                t.customers?.name || 'Guest',
                (t.items as any[])?.map((i: any) => `${i.quantity}x ${i.product_name || i.name}`).join('; ') || ''
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `sales_report_${dateRange.startDate}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Export error:", err);
            alert("Failed to export CSV");
        }
    };

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
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-black text-white hover:bg-gray-800 border-black"
                        onClick={handleExport}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
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

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-blue-500/10 border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        {loadingStats ? <Skeleton className="h-8 w-24" /> : (
                            <div className="text-2xl font-bold">{formatCurrency(summary?.totalSales || 0, settings.currency)}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            {summary?.transactionCount} transactions
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-green-500/10 border-green-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        {loadingStats ? <Skeleton className="h-8 w-24" /> : (
                            <div className="text-2xl font-bold">{formatCurrency(summary?.avgOrderValue || 0, settings.currency)}</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-purple-500/10 border-purple-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Product</CardTitle>
                        <Package className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        {loadingStats ? <Skeleton className="h-8 w-24" /> : (
                            <div className="text-lg font-bold truncate">
                                {topProducts.length > 0 ? topProducts[0].name : "N/A"}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            {topProducts.length > 0 ? `${topProducts[0].quantity} sold` : "No sales"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Products List (Optional visualization since we have the data) */}
            {topProducts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Top Selling Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topProducts.map((product, idx) => (
                                <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center rounded-full p-0">
                                            {idx + 1}
                                        </Badge>
                                        <span className="font-medium">{product.name}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {formatCurrency(product.total, settings.currency)} <span className="text-xs">({product.quantity} sold)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}


            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>
                        {totalCount} transactions found
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by ID, Customer, or Product Name..."
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
                                                        {transaction.customer_name || 'Guest'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[300px]">
                                                    <div className="flex flex-col gap-1 text-xs">
                                                        {Array.isArray(transaction.items) && transaction.items.slice(0, 3).map((item: any, idx: number) => (
                                                            <div key={idx} className="truncate">
                                                                <span className="font-semibold">{item.quantity}x</span> {item.product_name || item.name}
                                                            </div>
                                                        ))}
                                                        {Array.isArray(transaction.items) && transaction.items.length > 3 && (
                                                            <span className="text-muted-foreground italic">+{transaction.items.length - 3} more...</span>
                                                        )}
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
                                disabled={page >= totalPages || loadingTable || totalPages === 0}
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