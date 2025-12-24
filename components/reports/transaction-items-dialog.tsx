"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/hooks/use-shop-settings"
import { Receipt, X } from "lucide-react"

interface TransactionItemsDialogProps {
    transaction: any
    settings: any
    trigger: React.ReactNode
}

export function TransactionItemsDialog({ transaction, settings, trigger }: TransactionItemsDialogProps) {
    const [open, setOpen] = useState(false)

    const items = transaction.items || []

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <div onClick={() => setOpen(true)}>
                {trigger}
            </div>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Transaction Details
                    </DialogTitle>
                    <DialogDescription>
                        Transaction ID: {transaction.id.slice(0, 8)}...
                    </DialogDescription>
                </DialogHeader>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item: any, idx: number) => (
                            <TableRow key={idx}>
                                <TableCell className="font-medium">
                                    {item.product_name}
                                </TableCell>
                                <TableCell className="text-right">
                                    {item.quantity || item.qty}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(item.price || item.price_at_sale, settings.currency)}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                    {formatCurrency(
                                        (item.quantity || item.qty) * (item.price || item.price_at_sale),
                                        settings.currency
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>{formatCurrency(transaction.subtotal_amount || 0, settings.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Tax</span>
                        <span>{formatCurrency(transaction.tax_amount || 0, settings.currency)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(transaction.total_amount || 0, settings.currency)}</span>
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <Button onClick={() => setOpen(false)}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}