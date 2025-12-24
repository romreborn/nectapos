"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { productSchema, ProductFormValues } from "@/lib/validations/product"
import { useProductMutations } from "@/lib/hooks/use-product-mutations"
import { useUserProfile } from "@/lib/hooks/use-user-profile"
import { Database } from "@/types/supabase"

type Product = Database['public']['Tables']['products']['Row']

interface ProductDialogProps {
    product?: Product;
    trigger?: React.ReactNode;
}

export function ProductDialog({ product, trigger }: ProductDialogProps) {
    const [open, setOpen] = useState(false)
    const { createProduct, updateProduct, loading } = useProductMutations()
    const { profile } = useUserProfile()

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: {
            name: product?.name || "",
            sku: product?.sku || "",
            price: product?.price || 0,
            stock_qty: product?.stock_qty || 0,
            is_custom: product?.is_custom || false,
        },
    })

    useEffect(() => {
        if (open) {
            form.reset({
                name: product?.name || "",
                sku: product?.sku || "",
                price: product?.price || 0,
                stock_qty: product?.stock_qty || 0,
                is_custom: product?.is_custom || false,
            })
        }
    }, [open, product, form])

    async function onSubmit(data: ProductFormValues) {
        try {
            if (product) {
                // Edit Mode
                const { error } = await updateProduct(product.id, {
                    name: data.name,
                    sku: data.sku || null,
                    price: Number(data.price),
                    stock_qty: Number(data.stock_qty),
                    is_custom: data.is_custom,
                    updated_at: new Date().toISOString()
                })

                if (error) throw error
                toast.success("Product updated successfully")
            } else {
                // Create Mode
                const docId = uuidv4()
                const shopId = '550e8400-e29b-41d4-a716-446655440000' // Demo shop ID

                const { error } = await createProduct({
                    id: docId,
                    shop_id: shopId,
                    name: data.name,
                    sku: data.sku || null,
                    price: Number(data.price),
                    stock_qty: Number(data.stock_qty),
                    is_custom: data.is_custom || false,
                })

                if (error) throw error
                toast.success("Product created successfully")
            }

            setOpen(false)
            form.reset()
        } catch (error: any) {
            console.error(error)
            toast.error("Failed to save product: " + error.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
                    <DialogDescription>
                        {product ? "Make changes to your product here." : "Add a new item to your inventory."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...(form as any)}>
                    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
                        <FormField
                            control={form.control as any}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Product Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="sku"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>SKU (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Barcode / SKU" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control as any}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control as any}
                                name="stock_qty"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stock</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control as any}
                            name="is_custom"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Custom Item?
                                        </FormLabel>
                                        <FormDescription>
                                            This item has variable pricing (e.g. services).
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">{product ? "Save Changes" : "Create Product"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
