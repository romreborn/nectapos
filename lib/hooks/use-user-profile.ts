'use client'

import { useAuth } from '@/components/providers/auth-provider'

/**
 * Optimized useUserProfile using central Context
 * No longer fetches data directly
 */
export function useUserProfile() {
    const { profile, loading, error, signOut } = useAuth()

    // Maintain same API as before for backward compatibility
    return {
        profile,
        loading,
        error,
        refetch: () => Promise.resolve(), // No-op as provider handles updates
        signOut
    }
}