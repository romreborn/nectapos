'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, CheckCircle, Calculator } from 'lucide-react'

export default function RecalculateFromInitialPage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleRecalculate = async () => {
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const response = await fetch('/api/recalculate-from-initial', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to recalculate stock')
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
                    <Calculator className="h-8 w-8" />
                    Recalculate Stock from Initial
                </h1>
                <p className="text-muted-foreground mt-2">
                    Calculate current stock from initial stock_qty and stock movements
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Stock Recalculation from Initial Values</CardTitle>
                    <CardDescription>
                        This will take each product's initial stock_qty, apply all stock movements, and update the current stock_qty to the calculated value.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Warning:</strong> This will overwrite current stock_qty values in the products table.
                            Make sure you have a backup before proceeding.
                        </AlertDescription>
                    </Alert>

                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">What this does:</h3>
                        <ul className="text-sm space-y-1 list-disc list-inside text-blue-800">
                            <li>Takes the initial stock_qty from products table</li>
                            <li>Sums all stock movements (purchases add, sales subtract)</li>
                            <li>Calculates: Final Stock = Initial Stock + All Movements</li>
                            <li>Updates products.stock_qty with the calculated value</li>
                            <li>Prevents negative stock (minimum 0)</li>
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
                            "Recalculate Current Stock Now"
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
                                        <p>• Total products: <span className="font-semibold">{result.stats?.totalProducts || 0}</span></p>
                                        <p>• Products updated: <span className="font-semibold">{result.stats?.totalUpdated || 0}</span></p>
                                        <p>• Errors: <span className="font-semibold">{result.stats?.totalErrors || 0}</span></p>
                                        {result.stats?.errors && result.stats.errors.length > 0 && (
                                            <div className="mt-2">
                                                <p className="font-semibold text-red-600">Errors:</p>
                                                <ul className="list-disc list-inside text-red-600 text-xs">
                                                    {result.stats.errors.slice(0, 10).map((err: any, i: number) => (
                                                        <li key={i}>{err.productName || err.productId}: {err.error}</li>
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
