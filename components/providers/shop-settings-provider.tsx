'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './auth-provider'

interface ShopSettings {
    currency: string
    tax_percentage: number
}

interface ShopSettingsContextType {
    settings: ShopSettings
    loading: boolean
    shopId: string | null
    refreshSettings: () => Promise<void>
}

const ShopSettingsContext = createContext<ShopSettingsContextType | undefined>(undefined)

const DEFAULT_SETTINGS: ShopSettings = {
    currency: 'USD',
    tax_percentage: 0
}

export function ShopSettingsProvider({ children }: { children: React.ReactNode }) {
    const { profile, loading: authLoading } = useAuth()
    const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const shopId = profile?.shop_id || null

    useEffect(() => {
        if (authLoading) return

        if (!shopId) {
            setLoading(false)
            return
        }

        fetchSettings()

        // Realtime subscription
        const channel = supabase
            .channel(`shop-settings-${shopId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'shops',
                    filter: `id=eq.${shopId}`
                },
                () => {
                    console.log('[Shop Settings] Realtime update detected')
                    fetchSettings()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [shopId, authLoading])

    async function fetchSettings() {
        if (!shopId) return
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('shops')
                .select('currency, tax_percentage')
                .eq('id', shopId)
                .single()

            if (error) throw error

            const typedData = data as unknown as { currency: string, tax_percentage: number }

            if (typedData) {
                setSettings({
                    currency: typedData.currency || 'USD',
                    tax_percentage: typedData.tax_percentage || 0
                })
            }
        } catch (error) {
            console.error('[Shop Settings] Fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <ShopSettingsContext.Provider
            value={{
                settings,
                loading: loading || authLoading,
                shopId,
                refreshSettings: fetchSettings
            }}
        >
            {children}
        </ShopSettingsContext.Provider>
    )
}

export function useShopSettingsContext() {
    const context = useContext(ShopSettingsContext)
    if (context === undefined) {
        throw new Error('useShopSettingsContext must be used within a ShopSettingsProvider')
    }
    return context
}
