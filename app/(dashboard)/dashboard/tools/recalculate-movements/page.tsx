'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'

export default function RecalculateStockMovementsPage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleRecalculate = async () => {
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const response = await fetch('/api/recalculate-stock-movements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to recalculate stock movements')
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
                    <RefreshCw className="h-8 w-8" />
                    Recalculate Stock Movements
                </h1>
                <p className="text-muted-foreground mt-2">
                    Recalculate stock_before and stock_after values for all stock movements
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Stock Movement Recalculation</CardTitle>
                    <CardDescription>
                        This will process all stock movements chronologically and update the stock_before and stock_after fields based on the actual quantity changes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Warning:</strong> This will permanently update stock_before and stock_after values in the stock_movements table.
                            Make sure you have a backup before proceeding.
                        </AlertDescription>
                    </Alert>

                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">What this does:</h3>
                        <ul className="text-sm space-y-1 list-disc list-inside text-blue-800">
                            <li>Processes all products in your inventory</li>
                            <li>For each product, gets all stock movements ordered by date</li>
                            <li>Calculates stock_before and stock_after for each movement</li>
                            <li>Updates the database with correct values</li>
                            <li>Synchronizes product stock with calculated final stock</li>
                        </ul>
                    </div>

                    <Button
                        onClick={handleRecalculate}
                        disabled={loading}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Recalculating...
                            </>
                        ) : (
                            "Recalculate Stock Movements Now"
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
                                    <p className="font-semibold text-green-800">Recalculation completed!</p>
                                    <div className="text-sm space-y-1">
                                        <p>• Total products: <span className="font-semibold">{result.stats?.totalProducts || 0}</span></p>
                                        <p>• Movements updated: <span className="font-semibold">{result.stats?.totalMovementsUpdated || 0}</span></p>
                                        <p>• Errors: <span className="font-semibold">{result.stats?.totalErrors || 0}</span></p>
                                        {result.stats?.errors && result.stats.errors.length > 0 && (
                                            <div className="mt-2">
                                                <p className="font-semibold text-red-600">Errors:</p>
                                                <ul className="list-disc list-inside text-red-600 text-xs">
                                                    {result.stats.errors.slice(0, 10).map((err: any, i: number) => (
                                                        <li key={i}>{err.productId || err.movementId}: {err.error}</li>
                                                    ))}
                                                    {result.stats.errors.length > 10 && (
                                                        <li>... and {result.stats.errors.length - 10} more</li>
                                                    )}
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
