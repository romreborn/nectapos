'use client'

import { useShopSettingsContext } from '@/components/providers/shop-settings-provider'
import { formatCurrency as originalFormatCurrency } from '@/lib/utils/currency'

/**
 * Optimized useShopSettings using central Context
 * No longer fetches data directly
 */
export function useShopSettings() {
    const { settings, loading } = useShopSettingsContext()

    return { settings, loading }
}

// Re-export formatCurrency utility
export const formatCurrency = originalFormatCurrency

// Helper function to format currency client-side
export function formatAmount(amount: number, currency = 'USD'): string {
    return originalFormatCurrency(amount, currency)
}
