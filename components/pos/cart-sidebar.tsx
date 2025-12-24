"use client"

import { useCartStore } from "@/lib/pos/cart-store"
import { useShopSettings, formatCurrency } from "@/lib/hooks/use-shop-settings"
import { useTransactionMutations } from "@/lib/hooks/use-transaction-mutations"
import { useUserProfile } from "@/lib/hooks/use-user-profile"
import { CustomerSelectorNew } from "@/components/pos/customer-selector-new"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, Trash2, ShoppingCart, Receipt, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"
import { useState } from "react"

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
    const { createTransaction, loading: savingTransaction } = useTransactionMutations()
    const { profile } = useUserProfile()
    const supabase = createClient()

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

    const handleCheckout = () => {
        if (items.length === 0) return
        setShowConfirmDialog(true)
    }

    const processCheckout = async () => {
        setShowConfirmDialog(false)

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setTransactionResult({
                    success: false,
                    error: 'User not authenticated'
                })
                setShowResultDialog(true)
                return
            }

            // Create transaction record
            const transactionId = uuidv4()
            const shopId = profile?.shop_id

            if (!shopId) {
                setTransactionResult({
                    success: false,
                    error: 'Shop identification missing. Please check your profile.'
                })
                setShowResultDialog(true)
                return
            }

            // Prepare transaction items with tax calculations
            const transactionItems = items.map(item => {
                const subtotal = item.price * item.qty
                const taxAmount = subtotal * (settings.tax_percentage / 100)
                const totalWithTax = subtotal + taxAmount

                return {
                    product_id: item.product.id,
                    product_name: item.product.name,
                    quantity: item.qty,
                    price: item.price,
                    subtotal: subtotal,
                    tax_percentage: settings.tax_percentage,
                    tax_amount: taxAmount,
                    total: totalWithTax
                }
            })

            const { error } = await createTransaction({
                id: transactionId,
                shop_id: shopId,
                user_id: user.id,
                customer_id: customerId || null,
                total_amount: total,
                tax_amount: taxAmount,
                subtotal_amount: subtotal,
                items: transactionItems,
                payment_method: 'cash',
                status: 'completed'
            })

            if (error) throw error

            // Update stock for each item
            for (const item of items) {
                try {
                    // Try with regular client first
                    const { data: rawProduct, error: fetchError } = await supabase
                        .from('products')
                        .select('stock')
                        .eq('id', item.product.id)
                        .single()

                    const product = rawProduct as { stock: number } | null

                    if (fetchError && fetchError.code === 'PGRST116') {
                        console.log('Product not found, skipping stock update for', item.product.id)
                        continue
                    }

                    // Calculate new stock
                    const currentStock = product?.stock || 0
                    const newStock = Math.max(0, currentStock - item.qty) // Prevent negative stock

                    // Try to update stock with regular client
                    let updateResult = await supabase
                        .from('products')
                        .update({ stock: newStock } as any)
                        .eq('id', item.product.id)

                    if (updateResult.error) {
                        console.error('Error updating stock for product', item.product.id, updateResult.error)
                    } else {
                        console.log(`Updated stock for ${item.product.name}: ${currentStock} → ${newStock}`)
                    }

                    // Create stock movement record
                    const movementData = {
                        product_id: item.product.id,
                        quantity: -item.qty, // Negative for stock out
                        type: 'sale',
                        reference_id: transactionId,
                        reference_type: 'transaction',
                        shop_id: shopId,
                        user_id: user.id,
                        stock_before: currentStock,
                        stock_after: newStock
                    }

                    let movementResult = await supabase
                        .from('stock_movements')
                        .insert(movementData as any)

                    if (movementResult.error) {
                        console.error('Error creating stock movement', movementResult.error)
                    }

                } catch (error) {
                    console.error('Stock update error for item', item.product.id, error)
                }
            }

            // Success
            setTransactionResult({
                success: true,
                transactionId,
                total
            })
            console.log("Transaction saved:", {
                id: transactionId,
                user_id: user.id,
                items: transactionItems,
                subtotal,
                tax: taxAmount,
                total,
                currency: settings.currency,
                tax_percentage: settings.tax_percentage
            })

            clearCart()
        } catch (error: any) {
            console.error('Checkout error:', error)
            setTransactionResult({
                success: false,
                error: error.message || 'Failed to complete transaction'
            })
        }

        setShowResultDialog(true)
    }

    return (
        <>
            <div className="flex flex-col h-full border-l bg-muted/10">
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 font-semibold">
                            <ShoppingCart className="h-5 w-5" />
                            Current Sale
                        </div>
                        <Button variant="ghost" size="sm" onClick={clearCart} disabled={items.length === 0} className="text-destructive hover:text-destructive">
                            Clear
                        </Button>
                    </div>
                    <CustomerSelectorNew
                        customerId={customerId}
                        customerName={customerName}
                        onCustomerChange={setCustomer}
                    />
                </div>

                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.product.id} className="flex flex-col gap-2 bg-background p-3 rounded-lg border shadow-sm">
                                <div className="flex justify-between items-start">
                                    <span className="font-medium line-clamp-2 text-sm">{item.product.name}</span>
                                    <span className="font-semibold text-sm">
                                        {formatCurrency(item.price * item.qty, settings.currency)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground">
                                        {formatCurrency(item.price, settings.currency)} x {item.qty}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product.id, -1)}>
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product.id, 1)}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive ml-1" onClick={() => removeFromCart(item.product.id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
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

                <div className="p-4 border-t bg-background mt-auto">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatCurrency(subtotal, settings.currency)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Tax ({settings.tax_percentage}%)</span>
                                <span>{formatCurrency(taxAmount, settings.currency)}</span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{formatCurrency(total, settings.currency)}</span>
                            </div>
                        </div>

                        <Button
                            className="w-full py-6 text-lg"
                            size="lg"
                            disabled={items.length === 0 || savingTransaction}
                            onClick={handleCheckout}
                        >
                            {savingTransaction ? 'Processing...' : `Charge ${formatCurrency(total, settings.currency)}`}
                        </Button>
                    </div>
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
                        {/* Transaction Items */}
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

                        {/* Payment Summary */}
                        <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                            <h4 className="font-semibold text-sm">Payment Summary</h4>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal, settings.currency)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Tax ({settings.tax_percentage}%)</span>
                                    <span>{formatCurrency(taxAmount, settings.currency)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-semibold text-base">
                                    <span>Total Amount</span>
                                    <span>{formatCurrency(total, settings.currency)}</span>
                                </div>
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
                        <Button
                            variant="outline"
                            onClick={() => setShowConfirmDialog(false)}
                            disabled={savingTransaction}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={processCheckout}
                            disabled={savingTransaction}
                        >
                            {savingTransaction ? 'Processing...' : `Confirm Payment ${formatCurrency(total, settings.currency)}`}
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
                            <p className="text-sm text-muted-foreground">
                                Please try again or contact support if the problem persists.
                            </p>
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
        </>
    )
}