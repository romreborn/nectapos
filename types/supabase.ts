export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "13.0.5"
    }
    public: {
        Tables: {
            customers: {
                Row: {
                    created_at: string | null
                    email: string | null
                    id: string
                    name: string
                    phone: string | null
                    shop_id: string
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    name: string
                    phone?: string | null
                    shop_id: string
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    name?: string
                    phone?: string | null
                    shop_id?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "customers_shop_id_fkey"
                        columns: ["shop_id"]
                        isOneToOne: false
                        referencedRelation: "shops"
                        referencedColumns: ["id"]
                    },
                ]
            }
            products: {
                Row: {
                    created_at: string | null
                    id: string
                    is_custom: boolean | null
                    low_stock_threshold: number | null
                    name: string
                    price: number
                    shop_id: string
                    sku: string | null
                    stock_qty: number
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    is_custom?: boolean | null
                    low_stock_threshold?: number | null
                    name: string
                    price?: number
                    shop_id: string
                    sku?: string | null
                    stock_qty?: number
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    is_custom?: boolean | null
                    low_stock_threshold?: number | null
                    name?: string
                    price?: number
                    shop_id?: string
                    sku?: string | null
                    stock_qty?: number
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "products_shop_id_fkey"
                        columns: ["shop_id"]
                        isOneToOne: false
                        referencedRelation: "shops"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    created_at: string | null
                    full_name: string | null
                    id: string
                    is_active: boolean | null
                    role: Database["public"]["Enums"]["user_role"]
                    shop_id: string | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    full_name?: string | null
                    id: string
                    is_active?: boolean | null
                    role?: Database["public"]["Enums"]["user_role"]
                    shop_id?: string | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    full_name?: string | null
                    id?: string
                    is_active?: boolean | null
                    role?: Database["public"]["Enums"]["user_role"]
                    shop_id?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "profiles_shop_id_fkey"
                        columns: ["shop_id"]
                        isOneToOne: false
                        referencedRelation: "shops"
                        referencedColumns: ["id"]
                    },
                ]
            }
            shops: {
                Row: {
                    created_at: string | null
                    id: string
                    is_online_sync_enabled: boolean | null
                    name: string
                    subscription_status: boolean | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    is_online_sync_enabled?: boolean | null
                    name: string
                    subscription_status?: boolean | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    is_online_sync_enabled?: boolean | null
                    name?: string
                    subscription_status?: boolean | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            stock_movements: {
                Row: {
                    created_at: string | null
                    id: string
                    product_id: string
                    quantity: number
                    shop_id: string
                    type: string
                    user_id: string | null
                    reference_id: string | null
                    reference_type: string | null
                    stock_before: number | null
                    stock_after: number | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    product_id: string
                    quantity: number
                    shop_id: string
                    type: string
                    user_id?: string | null
                    reference_id?: string | null
                    reference_type?: string | null
                    stock_before?: number | null
                    stock_after?: number | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    product_id?: string
                    quantity?: number
                    shop_id?: string
                    type?: string
                    user_id?: string | null
                    reference_id?: string | null
                    reference_type?: string | null
                    stock_before?: number | null
                    stock_after?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "stock_movements_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "stock_movements_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            transactions: {
                Row: {
                    cancellation_reason: string | null
                    cancelled_by: string | null
                    created_at: string | null
                    customer_id: string | null
                    id: string
                    items: Json | null
                    shop_id: string
                    status: Database["public"]["Enums"]["transaction_status"] | null
                    total_amount: number
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    cancellation_reason?: string | null
                    cancelled_by?: string | null
                    created_at?: string | null
                    customer_id?: string | null
                    id?: string
                    items?: Json | null
                    shop_id: string
                    status?: Database["public"]["Enums"]["transaction_status"] | null
                    total_amount?: number
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    cancellation_reason?: string | null
                    cancelled_by?: string | null
                    created_at?: string | null
                    customer_id?: string | null
                    id?: string
                    items?: Json | null
                    shop_id: string
                    status?: Database["public"]["Enums"]["transaction_status"] | null
                    total_amount?: number
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "transactions_cancelled_by_fkey"
                        columns: ["cancelled_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "transactions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "transactions_customer_id_fkey"
                        columns: ["customer_id"]
                        isOneToOne: false
                        referencedRelation: "customers"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            transaction_status: "completed" | "cancelled" | "pending_approval"
            user_role: "superadmin" | "owner" | "manager" | "cashier"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
