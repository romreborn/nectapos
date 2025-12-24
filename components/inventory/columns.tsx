"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Database } from "@/types/supabase"
import { ProductDialog } from "./product-dialog"
import { toast } from "sonner"
import { useProductMutations } from "@/lib/hooks/use-product-mutations"
import { useShopSettings, formatCurrency } from "@/lib/hooks/use-shop-settings"

type Product = Database['public']['Tables']['products']['Row']

// Price cell component that uses shop currency
function PriceCell({ price }: { price: number }) {
    const { settings } = useShopSettings()
    return <div className="font-medium">{formatCurrency(price, settings.currency)}</div>
}

export const columns: ColumnDef<Product>[] = [
    {
        accessorKey: "sku",
        header: "SKU",
    },
    {
        accessorKey: "name",
        header: "Product Name",
    },
    {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => <PriceCell price={row.getValue("price")} />,
    },
    {
        accessorKey: "stock_qty",
        header: "Stock",
    },
    {
        accessorKey: "is_custom",
        header: "Custom",
        cell: ({ row }) => {
            return row.getValue("is_custom") ? "Yes" : "No"
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const product = row.original
            const { deleteProduct } = useProductMutations()

            const handleDelete = async () => {
                if (confirm(`Delete ${product.name}?`)) {
                    const { error } = await deleteProduct(product.id)
                    if (error) {
                        toast.error("Failed to delete product")
                    } else {
                        toast.success("Product deleted")
                    }
                }
            }

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <ProductDialog
                            product={product}
                            trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    Edit
                                </DropdownMenuItem>
                            }
                        />
                        <DropdownMenuItem onClick={handleDelete}>
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
