'use client'

import { useEffect, useState } from 'react'
import { Database } from '@/types/supabase'
import { createClient } from '@/lib/supabase/client'

type Customer = Database['public']['Tables']['customers']['Row']

export function useCustomers(shopId?: string) {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const supabase = createClient()

    useEffect(() => {
        if (shopId) {
            fetchCustomers()
        }
    }, [shopId])

    const fetchCustomers = async () => {
        try {
            setLoading(true)

            // Get session token from Supabase
            const { data: { session } } = await supabase.auth.getSession()

            const response = await fetch('/api/customers', {
                headers: {
                    'Authorization': `Bearer ${session?.access_token || ''}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`Failed to fetch customers: ${response.statusText}`)
            }

            const data = await response.json()

            if (data.error) {
                console.warn('Customer fetch warning:', data.error)
                // Continue with empty customers array
                setCustomers([])
            } else {
                setCustomers(data.customers || [])
            }

            setError(null)
        } catch (err) {
            console.error('Error fetching customers:', err)
            setError(err as Error)
            setCustomers([]) // Ensure we have an empty array on error
        } finally {
            setLoading(false)
        }
    }

    const addCustomer = async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'shop_id'>) => {
        try {
            // Get session token from Supabase
            const { data: { session } } = await supabase.auth.getSession()

            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token || ''}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(customerData),
            })

            const data = await response.json()

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Failed to add customer')
            }

            setCustomers(prev => [...prev, data.customer])
            return { data: data.customer, error: null }
        } catch (err) {
            console.error('Error adding customer:', err)
            return { data: null, error: err as Error }
        }
    }

    const searchCustomers = (query: string) => {
        if (!query) return customers

        const lowerQuery = query.toLowerCase()
        return customers.filter(customer =>
            customer.name.toLowerCase().includes(lowerQuery) ||
            (customer.email && customer.email.toLowerCase().includes(lowerQuery)) ||
            (customer.phone && customer.phone.includes(query))
        )
    }

    return {
        customers,
        loading,
        error,
        refetch: fetchCustomers,
        addCustomer,
        searchCustomers
    }
}