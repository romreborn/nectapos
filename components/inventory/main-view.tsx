'use client'

import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { ProductDialog } from "./product-dialog"
import { useProducts } from "@/lib/hooks/use-products"
import { useUserProfile } from "@/lib/hooks/use-user-profile"

export default function InventoryView() {
    const { profile } = useUserProfile()
    const { products, loading } = useProducts(profile?.shop_id)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading products...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
                    <p className="text-muted-foreground">
                        Manage your product inventory
                    </p>
                </div>
                <ProductDialog />
            </div>
            <DataTable columns={columns} data={products} />
        </div>
    )
}
