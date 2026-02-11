'use client'

import React, { useState, useEffect } from 'react'
import { useShopSettings, formatCurrency } from "@/lib/hooks/use-shop-settings"
import { useUserProfile } from "@/lib/hooks/use-user-profile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Download, TrendingUp, TrendingDown, Package, Calendar, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { format } from "date-fns"
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from "@/components/ui/skeleton"

export default function InventoryReportsPage() {
    const { settings } = useShopSettings()
    const { profile } = useUserProfile()
    const supabase = createClient()

    const [dateRange, setDateRange] = useState({
        startDate: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [movements, setMovements] = useState<any[]>([])
    const [loading, setLoading] = useState(true)


    const shopId = profile?.shop_id

    useEffect(() => {
        if (!shopId) return

        async function fetchMovements() {
            setLoading(true)
            try {
                const start = new Date(dateRange.startDate).toISOString()
                const end = new Date(new Date(dateRange.endDate).setHours(23, 59, 59, 999)).toISOString()

                // Fetch stock movements
                const { data, error } = await (supabase
                    .from('stock_movements') as any)
                    .select(`
                        *,
                        products (
                            name,
                            sku
                        )
                    `)
                    .eq('shop_id', shopId)
                    .gte('created_at', start)
                    .lte('created_at', end)
                    .order('created_at', { ascending: false })

                if (error) throw error

                const movementsData = (data || []) as any[]
                setMovements(movementsData)



            } catch (err) {
                console.error("Error fetching stock movements:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchMovements()
    }, [shopId, dateRange])

    const filteredMovements = movements.filter((m: any) => {
        if (!searchQuery) return true
        const searchLower = searchQuery.toLowerCase()
        return (
            (m.products?.name || '').toLowerCase().includes(searchLower) ||
            (m.products?.sku || '').toLowerCase().includes(searchLower)
        )
    })

    const handleExportCSV = async () => {
        if (!shopId) return
        try {
            const start = new Date(dateRange.startDate).toISOString()
            const end = new Date(new Date(dateRange.endDate).setHours(23, 59, 59, 999)).toISOString()

            const { data, error } = await (supabase
                .from('stock_movements') as any)
                .select(`
                    *,
                    products (
                        name,
                        sku
                    )
                `)
                .eq('shop_id', shopId)
                .gte('created_at', start)
                .lte('created_at', end)
                .order('created_at', { ascending: false })

            if (error) throw error
            if (!data || data.length === 0) {
                alert("No data to export")
                return
            }

            // Format CSV
            const headers = ["Date", "Product Name", "SKU", "Type", "Quantity", "Stock Before", "Stock After", "Reference Type", "Reference ID"]
            const rows = data.map((m: any) => [
                new Date(m.created_at).toLocaleString(),
                m.products?.name || 'Unknown',
                m.products?.sku || '-',
                m.type,
                m.quantity,
                m.stock_before || 0,
                m.stock_after || 0,
                m.reference_type || '-',
                m.reference_id || '-'
            ])

            const csvContent = [
                headers.join(','),
                ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            ].join('\n')

            // Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.setAttribute('href', url)
            link.setAttribute('download', `inventory_movements_${dateRange.startDate}_${dateRange.endDate}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (err) {
            console.error("Export error:", err)
            alert("Failed to export CSV")
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory Reports</h1>
                    <p className="text-muted-foreground">
                        Track stock movements and inventory changes.
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-black text-white hover:bg-gray-800 border-black"
                        onClick={handleExportCSV}
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


            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search by product name or SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Movements Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Stock Movements</CardTitle>
                    <CardDescription>
                        Showing {filteredMovements.length} movement{filteredMovements.length !== 1 ? 's' : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Before</TableHead>
                                    <TableHead className="text-right">After</TableHead>
                                    <TableHead>Reference</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredMovements.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                            No stock movements found for the selected period.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredMovements.map((movement: any) => (
                                        <TableRow key={movement.id}>
                                            <TableCell className="font-medium">
                                                {format(new Date(movement.created_at), 'MMM dd, yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{movement.products?.name || 'Unknown'}</span>
                                                    {movement.products?.sku && (
                                                        <span className="text-xs text-muted-foreground">{movement.products.sku}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    movement.type === 'purchase' ? 'default' :
                                                        movement.type === 'initial' || movement.reference_type === 'initial stock' ? 'outline' :
                                                            'secondary'
                                                } className={
                                                    movement.type === 'initial' || movement.reference_type === 'initial stock' ? 'bg-blue-500/20 border-blue-500 text-blue-700' : ''
                                                }>
                                                    {movement.type === 'purchase' ? (
                                                        <><ArrowUpCircle className="mr-1 h-3 w-3 text-green-600" /> Purchase</>
                                                    ) : movement.type === 'initial' || movement.reference_type === 'initial stock' ? (
                                                        <><Package className="mr-1 h-3 w-3 text-blue-600" /> Initial Stock</>
                                                    ) : (
                                                        <><ArrowDownCircle className="mr-1 h-3 w-3 text-red-600" /> Sale</>
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-right font-medium ${movement.type === 'initial' || movement.reference_type === 'initial stock' ? 'text-blue-600' :
                                                movement.quantity >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {movement.type === 'initial' || movement.reference_type === 'initial stock' ? '' : movement.quantity >= 0 ? '+' : ''}{movement.quantity}
                                            </TableCell>
                                            <TableCell className="text-right">{movement.stock_before || 0}</TableCell>
                                            <TableCell className="text-right">{movement.stock_after || 0}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-xs">
                                                    <span className="capitalize">{movement.reference_type || 'Manual'}</span>
                                                    {movement.reference_id && (
                                                        <span className="text-muted-foreground truncate max-w-[100px]">{movement.reference_id}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
