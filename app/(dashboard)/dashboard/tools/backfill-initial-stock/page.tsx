'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, CheckCircle, Database } from 'lucide-react'

export default function BackfillInitialStockPage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleBackfill = async () => {
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const response = await fetch('/api/backfill-initial-stock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to backfill initial stock')
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
                    <Database className="h-8 w-8" />
                    Backfill Initial Stock Movements
                </h1>
                <p className="text-muted-foreground mt-2">
                    Create initial stock movement records from products table
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Initial Stock Movement Update</CardTitle>
                    <CardDescription>
                        This will set the initial stock movement quantity to match exactly the stock_qty from the products table.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Note:</strong> This will create new records in the stock_movements table.
                            Products that already have initial stock movements will be skipped.
                        </AlertDescription>
                    </Alert>

                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">What this does:</h3>
                        <ul className="text-sm space-y-1 list-disc list-inside text-blue-800">
                            <li>For each product, sets: initial stock = products.stock_qty</li>
                            <li>Checks if initial stock movement already exists</li>
                            <li>If exists: updates the quantity to match products.stock_qty</li>
                            <li>If not exists: creates new initial stock movement record</li>
                            <li>Sets type = 'initial', reference_type = 'initial stock'</li>
                            <li>Sets stock_before = 0, stock_after = products.stock_qty</li>
                            <li>Uses product's created_at timestamp for new records</li>
                        </ul>
                    </div>

                    <Button
                        onClick={handleBackfill}
                        disabled={loading}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating Initial Stock...
                            </>
                        ) : (
                            "Update Initial Stock Now"
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
                                    <p className="font-semibold text-green-800">Initial stock update completed!</p>
                                    <div className="text-sm space-y-1">
                                        <p>• Total products: <span className="font-semibold">{result.stats?.totalProducts || 0}</span></p>
                                        <p>• Movements created: <span className="font-semibold">{result.stats?.totalCreated || 0}</span></p>
                                        <p>• Movements updated: <span className="font-semibold">{result.stats?.totalUpdated || 0}</span></p>
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
