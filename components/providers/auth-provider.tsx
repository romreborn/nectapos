'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
    user: User | null
    profile: Profile | null
    loading: boolean
    error: Error | null
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const supabase = createClient()

    useEffect(() => {
        // Initial fetch
        fetchUserAndProfile()

        // Auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user) {
                    if (session.user.id !== user?.id) {
                        setUser(session.user)
                        await fetchProfile(session.user.id)
                    }
                } else {
                    setUser(null)
                    setProfile(null)
                }
                setLoading(false)
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    async function fetchUserAndProfile() {
        try {
            setLoading(true)
            const { data: { user }, error: userError } = await supabase.auth.getUser()

            if (userError) throw userError

            setUser(user)

            if (user) {
                await fetchProfile(user.id)
            }
        } catch (err) {
            console.error('[Auth Provider] Initialization error:', err)
            setError(err as Error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchProfile(userId: string) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                // If profile not found, just log it. Maybe user hasn't completed setup.
                if (error.code !== 'PGRST116') {
                    console.error('[Auth Provider] Profile fetch error:', error)
                }
            }

            if (data) setProfile(data)

        } catch (err) {
            console.error('[Auth Provider] Profile error:', err)
        }
    }

    async function signOut() {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, error, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
