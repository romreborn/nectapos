"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronsUpDown, User, Search } from "lucide-react"

interface Customer {
    id: string
    name: string
    email?: string
    phone?: string
}

interface CustomerSelectorProps {
    customerId: string | null
    customerName: string
    onCustomerChange: (customerId: string | null, customerName: string) => void
}

export function CustomerSelector({ customerId, customerName, onCustomerChange }: CustomerSelectorProps) {
    const [open, setOpen] = useState(false)
    const [customers, setCustomers] = useState<Customer[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    // Fetch customers when search term changes and has at least 3 characters
    useEffect(() => {
        const fetchCustomers = async () => {
            if (!open) return
            if (!searchTerm.trim() || searchTerm.trim().length < 3) {
                setCustomers([])
                return
            }

            setLoading(true)
            try {
                // Get current session
                const { data: { session } } = await supabase.auth.getSession()
                if (!session?.user) {
                    setCustomers([])
                    return
                }

                // Fetch customers from API
                const url = new URL('/api/customers', window.location.origin)
                url.searchParams.set('search', searchTerm.trim())

                const response = await fetch(url.toString(), {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    // API returns {success: true, data: {customers: [...]}}
                    const customers = data.data?.customers || data.customers || []
                    if (Array.isArray(customers)) {
                        setCustomers(customers)
                    } else {
                        setCustomers([])
                    }
                } else {
                    console.error('Failed to fetch customers:', response.statusText)
                    setCustomers([])
                }
            } catch (error) {
                console.error('Error fetching customers:', error)
                setCustomers([])
            } finally {
                setLoading(false)
            }
        }

        const debounceTimer = setTimeout(() => {
            fetchCustomers()
        }, 300)

        return () => clearTimeout(debounceTimer)
    }, [searchTerm, open])

    const handleCustomerSelect = (id: string | null, name?: string) => {
        if (id === null) {
            onCustomerChange(null, "Anonymous Guest")
        } else {
            onCustomerChange(id, name || `Customer ${id.slice(0, 8)}...`)
        }
        setOpen(false)
        setSearchTerm("")
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                >
                    <User className="mr-2 h-4 w-4" />
                    {customerName || 'Select customer'}
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <div className="flex items-center px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <CommandInput
                            placeholder="Type 3+ characters to search..."
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <CommandList>
                        <CommandItem
                            value="anonymous"
                            onSelect={() => handleCustomerSelect(null)}
                        >
                            <User className="mr-2 h-4 w-4" />
                            Anonymous Guest
                        </CommandItem>
                        {loading ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                Searching...
                            </div>
                        ) : customers.length > 0 ? (
                            customers.map((customer) => (
                                <CommandItem
                                    key={customer.id}
                                    value={customer.id}
                                    onSelect={() => handleCustomerSelect(customer.id, customer.name)}
                                >
                                    <div>
                                        <div className="font-medium">{customer.name}</div>
                                        {customer.email && (
                                            <div className="text-xs text-muted-foreground">{customer.email}</div>
                                        )}
                                        {customer.phone && (
                                            <div className="text-xs text-muted-foreground">{customer.phone}</div>
                                        )}
                                    </div>
                                </CommandItem>
                            ))
                        ) : searchTerm.trim() && searchTerm.trim().length >= 3 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                No customers found
                            </div>
                        ) : searchTerm.trim() ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                Type at least 3 characters to search
                            </div>
                        ) : (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                Type to search customers
                            </div>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}