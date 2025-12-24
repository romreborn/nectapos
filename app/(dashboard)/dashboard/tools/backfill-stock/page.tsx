'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react'

export default function BackfillStockPage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleBackfill = async () => {
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const response = await fetch('/api/backfill-stock-movements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to backfill stock movements')
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
                <h1 className="text-3xl font-bold">Backfill Stock Movements</h1>
                <p className="text-muted-foreground mt-2">
                    Create stock movement records for all existing POS transactions
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Stock Movement Backfill</CardTitle>
                    <CardDescription>
                        This will scan all completed transactions and create corresponding stock movement records.
                        This is a one-time operation to ensure all historical sales are properly tracked.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Warning:</strong> This will process all your completed transactions.
                            Make sure you have a backup of your database before proceeding.
                        </AlertDescription>
                    </Alert>

                    <Button
                        onClick={handleBackfill}
                        disabled={loading}
                        className="w-full"
                        variant={loading ? "secondary" : "default"}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing Transactions...
                            </>
                        ) : (
                            "Start Backfill Process"
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
                                    <p className="font-semibold">Backfill completed successfully!</p>
                                    <div className="text-sm space-y-1">
                                        <p>• Total transactions processed: {result.results?.processed || 0}</p>
                                        <p>• Transactions skipped (already processed): {result.results?.skipped || 0}</p>
                                        <p>• Stock movements created: {result.results?.movementsCreated || 0}</p>
                                        <p>• Errors encountered: {result.results?.errors || 0}</p>
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