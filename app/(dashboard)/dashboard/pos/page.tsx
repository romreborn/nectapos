import { ProductGrid } from "@/components/pos/product-grid"
import { CartSidebar } from "@/components/pos/cart-sidebar"
import { TransactionHistory } from "@/components/pos/transaction-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function POSPage() {
    return (
        <div className="flex min-h-0">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0">
                <Tabs defaultValue="pos" className="flex-1 flex flex-col min-h-0">
                    <div className="border-b px-6 pt-6 flex-shrink-0">
                        <TabsList>
                            <TabsTrigger value="pos">Point of Sale</TabsTrigger>
                            <TabsTrigger value="history">Transaction History</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="pos" className="flex-1 p-6 mt-0 overflow-auto">
                        <ProductGrid />
                    </TabsContent>

                    <TabsContent value="history" className="flex-1 mt-0 overflow-hidden">
                        <TransactionHistory />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Cart Sidebar */}
            <div className="w-96 flex-shrink-0">
                <CartSidebar />
            </div>
        </div>
    )
}
