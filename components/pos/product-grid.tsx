'use client'

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useProducts } from "@/lib/hooks/use-products"
import { useShopSettings, formatCurrency } from "@/lib/hooks/use-shop-settings"
import { useCartStore } from "@/lib/pos/cart-store"
import { useUserProfile } from "@/lib/hooks/use-user-profile"
import { Database } from "@/types/supabase"

type Product = Database['public']['Tables']['products']['Row']

export function ProductGrid() {
    const [searchTerm, setSearchTerm] = useState("")
    const { profile } = useUserProfile()
    const { products, loading } = useProducts(profile?.shop_id || undefined)
    const { settings } = useShopSettings()
    const addToCart = useCartStore((state) => state.addToCart)

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading products...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-auto">
                {filteredProducts.map((product) => (
                    <Card
                        key={product.id}
                        className="p-4 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => addToCart(product)}
                    >
                        <div className="flex flex-col gap-2">
                            <h3 className="font-semibold truncate">{product.name}</h3>
                            <p className="text-2xl font-bold">
                                {formatCurrency(product.price, settings.currency)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Stock: {product.stock_qty ?? 0}
                            </p>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">No products found</p>
                </div>
            )}
        </div>
    )
}
