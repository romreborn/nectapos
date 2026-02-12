import { create } from 'zustand'
import { Database } from '@/types/supabase'

type Product = Database['public']['Tables']['products']['Row']

export interface CartItem {
    product: Product
    qty: number
    price: number // Snapshot of price at time of add
}

interface CartState {
    items: CartItem[]
    customerId: string | null
    customerName: string
    addToCart: (product: Product) => void
    removeFromCart: (productId: string) => void
    updateQty: (productId: string, delta: number) => void
    clearCart: () => void
    setCustomer: (customerId: string | null, customerName: string) => void
    total: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    customerId: null,
    customerName: 'Anonymous Guest',

    addToCart: (product) => set((state) => {
        const existingItem = state.items.find(item => item.product.id === product.id)
        if (existingItem) {
            return {
                items: state.items.map(item =>
                    item.product.id === product.id
                        ? { ...item, qty: item.qty + 1 }
                        : item
                )
            }
        }
        return {
            items: [...state.items, { product, qty: 1, price: product.price }]
        }
    }),

    removeFromCart: (productId) => set((state) => ({
        items: state.items.filter(item => item.product.id !== productId)
    })),

    updateQty: (productId, delta) => set((state) => ({
        items: state.items.map(item => {
            if (item.product.id === productId) {
                const newQty = item.qty + delta
                return newQty > 0 ? { ...item, qty: newQty } : item
            }
            return item
        })
    })),

    clearCart: () => set({
        items: [],
        customerId: null,
        customerName: 'Anonymous Guest'
    }),

    setCustomer: (customerId, customerName) => set({ customerId, customerName }),

    total: () => {
        const items = get().items
        return items.reduce((sum, item) => sum + (item.price * item.qty), 0)
    }
}))
