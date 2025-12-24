import * as z from "zod"

export const productSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    sku: z.string().optional(),
    price: z.coerce.number().min(0, "Price must be positive"),
    stock_qty: z.coerce.number().int().min(0, "Stock must be positive"),
    is_custom: z.boolean().default(false),
})

export type ProductFormValues = z.infer<typeof productSchema>
