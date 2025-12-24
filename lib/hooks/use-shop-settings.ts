'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ShopSettings {
    currency: string
    tax_percentage: number
}

export function useShopSettings() {
    const [settings, setSettings] = useState<ShopSettings>({
        currency: 'USD',
        tax_percentage: 0
    })
    const [loading, setLoading] = useState(true)
    const [shopId, setShopId] = useState<string | null>(null)
    const supabase = createClient()

    // 1. Fetch Shop ID from Profile
    useEffect(() => {
        async function getShopId() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data } = await supabase
                    .from('profiles')
                    .select('shop_id')
                    .eq('id', user.id)
                    .single()

                const profile = data as { shop_id: string } | null

                if (profile?.shop_id) {
                    setShopId(profile.shop_id)
                }
            } catch (err) {
                console.error("Error getting shop ID:", err)
            }
        }
        getShopId()
    }, [])

    // 2. Fetch Settings & Subscribe when Shop ID is available
    useEffect(() => {
        if (!shopId) return

        fetchSettings()

        const channel = supabase
            .channel('shop-settings-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'shops',
                    filter: `id=eq.${shopId}`
                },
                () => {
                    fetchSettings()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [shopId])

    async function fetchSettings() {
        if (!shopId) return
        try {
            setLoading(true)
            const { data: rawData, error } = await supabase
                .from('shops')
                .select('currency, tax_percentage')
                .eq('id', shopId)
                .single()

            if (error) throw error

            const data = rawData as { currency: string, tax_percentage: number }

            if (data) {
                setSettings({
                    currency: data.currency || 'USD',
                    tax_percentage: data.tax_percentage || 0
                })
            }
        } catch (error) {
            console.error('Error fetching shop settings:', error)
        } finally {
            setLoading(false)
        }
    }

    return { settings, loading }
}

// Currency formatter utility
export function formatCurrency(amount: number, currency: string = 'USD'): string {
    // Handle invalid numbers
    if (isNaN(amount) || !isFinite(amount)) {
        amount = 0
    }

    const currencySymbols: Record<string, string> = {
        'USD': '$',
        'IDR': 'Rp',
        'SGD': 'S$'
    }

    const symbol = currencySymbols[currency] || currency

    // Format based on currency
    if (currency === 'IDR') {
        // Indonesian Rupiah - no decimals
        return `${symbol} ${amount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    } else {
        // USD, SGD - 2 decimals
        return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
}
