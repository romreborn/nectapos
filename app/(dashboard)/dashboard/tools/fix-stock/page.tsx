'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, CheckCircle, Package } from 'lucide-react'

export default function FixStockPage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFixStock = async () => {
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const response = await fetch('/api/fix-current-stock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fix stock')
            }

            setResult(data)
        } catch (err: any) {
            setError(err.message || 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Package className="h-8 w-8" />
                    Fix Current Stock
                </h1>
                <p className="text-muted-foreground mt-2">
                    Recalculate and update product stock based on all completed transactions
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Stock Recalculation</CardTitle>
                    <CardDescription>
                        This will scan all completed transactions and update product inventory to match the actual sales.
                        Use this if your inventory shows incorrect stock levels.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Warning:</strong> This will permanently update your product stock levels.
                            Make sure you have a backup before proceeding.
                        </AlertDescription>
                    </Alert>

                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">What this does:</h3>
                        <ul className="text-sm space-y-1 list-disc list-inside text-blue-800">
                            <li>Counts all items sold in completed transactions</li>
                            <li>Subtracts total sold from current stock</li>
                            <li>Updates each product's stock to the correct value</li>
                            <li>Prevents negative stock values</li>
                        </ul>
                    </div>

                    <Button
                        onClick={handleFixStock}
                        disabled={loading}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Recalculating Stock...
                            </>
                        ) : (
                            "Fix Stock Levels Now"
                        )}
                    </Button>

                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {result && (
                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <p className="font-semibold text-green-800">Stock recalculation completed!</p>
                                    <div className="text-sm space-y-1">
                                        <p>• Products updated: <span className="font-semibold">{result.results?.productsUpdated || 0}</span></p>
                                        <p>• Products skipped: <span className="font-semibold">{result.results?.productsSkipped || 0}</span></p>
                                        <p>• Total products processed: <span className="font-semibold">{result.totalProductsProcessed || 0}</span></p>
                                        {result.results?.errors && result.results.errors.length > 0 && (
                                            <div className="mt-2">
                                                <p className="font-semibold text-red-600">Errors:</p>
                                                <ul className="list-disc list-inside text-red-600">
                                                    {result.results.errors.map((err: any, i: number) => (
                                                        <li key={i}>{err.productName || err.productId}: {err.error}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}