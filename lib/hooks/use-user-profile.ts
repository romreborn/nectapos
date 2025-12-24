'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useUserProfile() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchProfile()
    }, [])

    async function fetchProfile() {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error('User not authenticated')
            }

            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (fetchError) throw fetchError
            setProfile(data)
            setError(null)
        } catch (err) {
            console.error('Error fetching user profile:', err)
            setError(err as Error)
        } finally {
            setLoading(false)
        }
    }

    return { profile, loading, error, refetch: fetchProfile }
}