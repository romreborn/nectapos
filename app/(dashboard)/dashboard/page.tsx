'use client'

import React, { useState, useEffect } from 'react'
import { useShopSettings, formatCurrency } from "@/lib/hooks/use-shop-settings"
import { useUserProfile } from "@/lib/hooks/use-user-profile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Calendar, ShoppingCart, Package, BarChart3, Award } from "lucide-react"
import { format } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Area, AreaChart } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
    const { settings } = useShopSettings()
    const { profile } = useUserProfile()
    const supabase = createClient()

    // Independent states for lazy loading
    const [summary, setSummary] = useState<any>(null)
    const [loadingSummary, setLoadingSummary] = useState(true)

    const [chartData, setChartData] = useState<any[]>([])
    const [loadingChart, setLoadingChart] = useState(true)

    const [topItems, setTopItems] = useState<any[]>([])
    const [loadingTopItems, setLoadingTopItems] = useState(true)

    const shopId = profile?.shop_id

    // 1. Fetch Summary Data
    useEffect(() => {
        if (!shopId) return

        async function fetchSummary() {
            setLoadingSummary(true)
            try {
                const now = new Date()
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
                const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()

                // Get Daily Summary
                const { data: dailyData, error: dailyError } = await supabase.rpc(
                    'get_dashboard_summary',
                    { p_shop_id: shopId, p_start_date: startOfDay, p_end_date: endOfDay } as any
                )

                // Get Week Summary for comparison
                const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)).toISOString() // Monday
                const { data: weeklyData } = await supabase.rpc(
                    'get_dashboard_summary',
                    { p_shop_id: shopId, p_start_date: startOfWeek, p_end_date: endOfDay } as any
                )

                // Get Month Summary
                const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
                const { data: monthlyData } = await supabase.rpc(
                    'get_dashboard_summary',
                    { p_shop_id: shopId, p_start_date: startOfMonth, p_end_date: endOfDay } as any
                )

                if (dailyError) throw dailyError

                setSummary({
                    daily: dailyData?.[0] || { total_sales: 0, transaction_count: 0 },
                    weekly: weeklyData?.[0] || { total_sales: 0 },
                    monthly: monthlyData?.[0] || { total_sales: 0 }
                })
            } catch (err) {
                console.error("Error fetching summary:", err)
            } finally {
                setLoadingSummary(false)
            }
        }
        fetchSummary()
    }, [shopId])

    // 2. Fetch Chart Data (Weekly Hourly)
    useEffect(() => {
        if (!shopId) return

        async function fetchChart() {
            setLoadingChart(true)
            try {
                const now = new Date()
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
                const today = new Date().toISOString()

                const { data, error } = await supabase.rpc(
                    'get_sales_chart_data',
                    {
                        p_shop_id: shopId,
                        p_start_date: weekAgo,
                        p_end_date: today,
                        p_interval: 'hour' // Can be dynamic
                    } as any
                )

                if (error) throw error

                // Process chart data for Recharts
                const formattedData = (data as any[])?.map((item: any) => ({
                    time: item.date, // Already formatted by RPC
                    sales: item.amount, // RPC returns 'amount'
                    transactions: 0 // RPC 'get_sales_chart_data' only returns amount currently. If needed I should update RPC or just ignore.
                })) || []

                setChartData(formattedData)
            } catch (err) {
                console.error("Error fetching chart:", err)
            } finally {
                setLoadingChart(false)
            }
        }
        fetchChart()
    }, [shopId])

    // 3. Fetch Top Items
    useEffect(() => {
        if (!shopId) return

        async function fetchTopItems() {
            setLoadingTopItems(true)
            try {
                const now = new Date()
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

                const { data, error } = await supabase.rpc(
                    'get_top_products',
                    {
                        p_shop_id: shopId,
                        p_start_date: startOfMonth,
                        p_end_date: now.toISOString(),
                        p_limit: 5
                    } as any
                )

                if (error) throw error
                setTopItems(data || [])
            } catch (err) {
                console.error("Error fetching top items:", err)
            } finally {
                setLoadingTopItems(false)
            }
        }
        fetchTopItems()
    }, [shopId])

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">Your business insights at a glance</p>
                </div>
                <div className="text-sm text-muted-foreground">
                    Last updated: {format(new Date(), 'PPp')}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Daily Sales - Orange Transparent */}
                {loadingSummary ? (
                    <Card className="h-32 bg-orange-500/10 border-orange-500/20"><CardContent className="p-6"><Skeleton className="h-8 w-1/2 bg-orange-500/20" /></CardContent></Card>
                ) : (
                    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-orange-500/20 border-orange-500/20 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Daily Sales</CardTitle>
                            <div className="p-2 bg-orange-500/20 rounded-full">
                                <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-950 dark:text-white">
                                {formatCurrency(summary?.daily?.total_sales || 0, settings.currency)}
                            </div>
                            <p className="text-xs text-orange-600/80 dark:text-orange-200/70 mt-1">
                                {summary?.daily?.transaction_count || 0} transactions today
                            </p>
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>
                        </CardContent>
                    </Card>
                )}

                {/* Weekly Sales - Orange Transparent */}
                {loadingSummary ? (
                    <Card className="h-32 bg-orange-500/10 border-orange-500/20"><CardContent className="p-6"><Skeleton className="h-8 w-1/2 bg-orange-500/20" /></CardContent></Card>
                ) : (
                    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-orange-500/20 border-orange-500/20 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Weekly Sales</CardTitle>
                            <div className="p-2 bg-orange-500/20 rounded-full">
                                <ShoppingCart className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-950 dark:text-white">
                                {formatCurrency(summary?.weekly?.total_sales || 0, settings.currency)}
                            </div>
                            <p className="text-xs text-orange-600/80 dark:text-orange-200/70 mt-1">
                                This week so far
                            </p>
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>
                        </CardContent>
                    </Card>
                )}

                {/* Monthly Sales - Orange Transparent */}
                {loadingSummary ? (
                    <Card className="h-32 bg-orange-500/10 border-orange-500/20"><CardContent className="p-6"><Skeleton className="h-8 w-1/2 bg-orange-500/20" /></CardContent></Card>
                ) : (
                    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-orange-500/20 border-orange-500/20 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Monthly Sales</CardTitle>
                            <div className="p-2 bg-orange-500/20 rounded-full">
                                <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-950 dark:text-white">
                                {formatCurrency(summary?.monthly?.total_sales || 0, settings.currency)}
                            </div>
                            <p className="text-xs text-orange-600/80 dark:text-orange-200/70 mt-1">
                                This month so far
                            </p>
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Charts and Top Items - Darker Background for Contrast */}
            <div className="grid gap-4 lg:grid-cols-7">
                {/* Weekly Hourly Sales Chart */}
                <Card className="lg:col-span-4 bg-teal-500/20 backdrop-blur-md border-teal-500/20 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-teal-900 dark:text-teal-100">Weekly Sales Activity</CardTitle>
                        <CardDescription className="text-teal-600/80 dark:text-teal-200/70">Sales distribution by hour (UTC+7)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingChart ? (
                            <div className="h-[350px] flex items-center justify-center">
                                <Skeleton className="h-[300px] w-full bg-teal-500/20" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-teal-500/20" />
                                    <XAxis
                                        dataKey="time"
                                        stroke="currentColor"
                                        className="text-teal-600/60 dark:text-teal-300/60"
                                        tick={{ fontSize: 12, fill: 'currentColor' }}
                                    />
                                    <YAxis
                                        stroke="currentColor"
                                        className="text-teal-600/60 dark:text-teal-300/60"
                                        tick={{ fontSize: 12, fill: 'currentColor' }}
                                        tickFormatter={(value) => `${compactCurrency(value, settings.currency)}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgb(255 255 255 / 0.8)', borderColor: 'rgb(20 184 166 / 0.2)', color: '#0f766e' }} // Light mode default
                                        itemStyle={{ color: '#0f766e' }}
                                        formatter={(value: any) => [formatCurrency(value, settings.currency), "Sales"]}
                                        labelStyle={{ color: '#64748b' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="sales"
                                        stroke="#14b8a6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorSales)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Top Items */}
                <Card className="lg:col-span-3 bg-teal-500/20 backdrop-blur-md border-teal-500/20 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-teal-900 dark:text-teal-100">Top Selling Items</CardTitle>
                        <CardDescription className="text-teal-600/80 dark:text-teal-200/70">Most popular products this month</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {loadingTopItems ? (
                                [...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center space-x-4">
                                        <Skeleton className="h-10 w-10 rounded-full bg-teal-500/20" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-full bg-teal-500/20" />
                                            <Skeleton className="h-3 w-2/3 bg-teal-500/20" />
                                        </div>
                                    </div>
                                ))
                            ) : topItems.length === 0 ? (
                                <p className="text-sm text-teal-600/60 dark:text-teal-200/60 text-center py-10">No sales data available</p>
                            ) : (
                                topItems.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-teal-500/10">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold bg-teal-200 dark:bg-white/10 text-teal-900 dark:text-white">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-teal-900 dark:text-teal-50 line-clamp-1">{item.product_name}</p>
                                                <p className="text-xs text-teal-600/80 dark:text-teal-200/70">
                                                    {item.quantity} sold
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-teal-900 dark:text-teal-50">
                                                {formatCurrency(item.total_sales, settings.currency)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function compactCurrency(value: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        notation: "compact",
        maximumFractionDigits: 1
    }).format(value)
}