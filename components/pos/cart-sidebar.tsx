"use client"

import { useCartStore } from "@/lib/pos/cart-store"
import { useShopSettings, formatCurrency } from "@/lib/hooks/use-shop-settings"
import { useCheckout } from "@/lib/hooks/use-checkout"
import { CustomerSelectorNew } from "@/components/pos/customer-selector-new"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, Trash2, ShoppingCart, Receipt, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useState } from "react"
import { CartItem } from "@/lib/pos/cart-store"

export function CartSidebar() {
    const items = useCartStore((state) => state.items)
    const updateQty = useCartStore((state) => state.updateQty)
    const removeFromCart = useCartStore((state) => state.removeFromCart)
    const clearCart = useCartStore((state) => state.clearCart)
    const subtotal = useCartStore((state) => state.total())
    const customerId = useCartStore((state) => state.customerId)
    const customerName = useCartStore((state) => state.customerName)
    const setCustomer = useCartStore((state) => state.setCustomer)

    const { settings } = useShopSettings()
    const { processCheckout, loading: processing } = useCheckout()

    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [showResultDialog, setShowResultDialog] = useState(false)
    const [transactionResult, setTransactionResult] = useState<{
        success: boolean
        transactionId?: string
        error?: string
        total?: number
    } | null>(null)

    // Calculate tax and total
    const taxAmount = subtotal * (settings.tax_percentage / 100)
    const total = subtotal + taxAmount

    const handleCheckoutClick = () => {
        if (items.length === 0) return
        setShowConfirmDialog(true)
    }

    const handleConfirmCheckout = async () => {
        setShowConfirmDialog(false)

        const result = await processCheckout({
            items,
            customerId,
            subtotal,
            taxAmount,
            total,
            paymentMethod: 'cash'
        })

        if (result.success) {
            clearCart()
            setTransactionResult({
                success: true,
                transactionId: result.transactionId,
                total
            })
        } else {
            setTransactionResult({
                success: false,
                error: result.error
            })
        }

        setShowResultDialog(true)
    }

    return (
        <div className="flex flex-col border-l bg-muted/10">
            {/* Header */}
            <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 font-semibold">
                        <ShoppingCart className="h-5 w-5" />
                        Current Sale
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearCart}
                        disabled={items.length === 0}
                        className="text-destructive hover:text-destructive"
                    >
                        Clear
                    </Button>
                </div>
                <CustomerSelectorNew
                    customerId={customerId}
                    customerName={customerName}
                    onCustomerChange={setCustomer}
                />
            </div>

            {/* Cart Items */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {items.map((item) => (
                        <CartItemRow
                            key={item.product.id}
                            item={item}
                            currency={settings.currency}
                            onUpdateQty={updateQty}
                            onRemove={removeFromCart}
                        />
                    ))}

                    {items.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center">
                            <ShoppingCart className="h-10 w-10 mb-2 opacity-20" />
                            <p>Cart is empty</p>
                            <p className="text-sm">Scan items or select from grid</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t bg-background mt-auto">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <SummaryRow label="Subtotal" amount={subtotal} currency={settings.currency} />
                        <SummaryRow label={`Tax (${settings.tax_percentage}%)`} amount={taxAmount} currency={settings.currency} />
                        <Separator />
                        <SummaryRow label="Total" amount={total} currency={settings.currency} bold />
                    </div>

                    <Button
                        className="w-full py-6 text-lg"
                        size="lg"
                        disabled={items.length === 0 || processing}
                        onClick={handleCheckoutClick}
                    >
                        {processing ? 'Processing...' : `Charge ${formatCurrency(total, settings.currency)}`}
                    </Button>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5" />
                            Confirm Transaction
                        </DialogTitle>
                        <DialogDescription>
                            Please review the transaction details before confirming
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Items ({items.length})</h4>
                            <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                                {items.map((item) => (
                                    <div key={item.product.id} className="p-3 flex justify-between items-center">
                                        <div className="flex-1">
                                            <div className="font-medium">{item.product.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {formatCurrency(item.price, settings.currency)} × {item.qty}
                                            </div>
                                        </div>
                                        <div className="font-semibold text-right">
                                            {formatCurrency(item.price * item.qty, settings.currency)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                            <h4 className="font-semibold text-sm">Payment Summary</h4>
                            <div className="space-y-1">
                                <SummaryRow label="Subtotal" amount={subtotal} currency={settings.currency} />
                                <SummaryRow label={`Tax (${settings.tax_percentage}%)`} amount={taxAmount} currency={settings.currency} />
                                <Separator />
                                <SummaryRow label="Total Amount" amount={total} currency={settings.currency} bold />
                            </div>
                        </div>

                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Customer: <Badge variant="outline">{customerName}</Badge>
                                <span className="ml-2">|</span>
                                <span className="ml-2">Payment method: <Badge variant="secondary">Cash</Badge></span>
                            </AlertDescription>
                        </Alert>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmCheckout} disabled={processing}>
                            {processing ? 'Processing...' : `Confirm Payment ${formatCurrency(total, settings.currency)}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Result Dialog */}
            <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {transactionResult?.success ? (
                                <>
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    Transaction Successful
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-5 w-5 text-red-600" />
                                    Transaction Failed
                                </>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {transactionResult?.success ? (
                        <div className="space-y-4">
                            <Alert className="border-green-200 bg-green-50">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                    Transaction completed successfully!
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Transaction ID:</span>
                                    <span className="font-mono text-xs">{transactionResult.transactionId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Amount:</span>
                                    <span className="font-semibold">
                                        {formatCurrency(transactionResult.total || 0, settings.currency)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Payment Method:</span>
                                    <span>Cash</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {transactionResult?.error || 'An unknown error occurred'}
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            onClick={() => setShowResultDialog(false)}
                            variant={transactionResult?.success ? "default" : "outline"}
                        >
                            {transactionResult?.success ? 'Continue' : 'Close'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function SummaryRow({ label, amount, currency, bold = false }: { label: string, amount: number, currency: string, bold?: boolean }) {
    return (
        <div className={`flex items-center justify-between text-sm ${bold ? 'font-bold text-lg' : ''}`}>
            <span className={bold ? '' : 'text-muted-foreground'}>{label}</span>
            <span>{formatCurrency(amount, currency)}</span>
        </div>
    )
}

function CartItemRow({ item, currency, onUpdateQty, onRemove }: {
    item: CartItem,
    currency: string,
    onUpdateQty: (id: string, delta: number) => void,
    onRemove: (id: string) => void
}) {
    return (
        <div className="flex flex-col gap-2 bg-background p-3 rounded-lg border shadow-sm">
            <div className="flex justify-between items-start">
                <span className="font-medium line-clamp-2 text-sm">{item.product.name}</span>
                <span className="font-semibold text-sm">
                    {formatCurrency(item.price * item.qty, currency)}
                </span>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    {formatCurrency(item.price, currency)} x {item.qty}
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onUpdateQty(item.product.id, -1)}>
                        <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onUpdateQty(item.product.id, 1)}>
                        <Plus className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive ml-1" onClick={() => onRemove(item.product.id)}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </div>
    )
}