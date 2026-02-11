"use client"

import { useState, useEffect, useRef, KeyboardEvent, MouseEvent } from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Search, X } from "lucide-react"

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

export function CustomerSelectorNew({ customerId, customerName, onCustomerChange }: CustomerSelectorProps) {
    const [searchTerm, setSearchTerm] = useState(customerName || "")
    const [customers, setCustomers] = useState<Customer[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    // Fetch customers when search term changes and has at least 3 characters
    useEffect(() => {
        const fetchCustomers = async () => {
            if (!searchTerm.trim() || searchTerm.trim().length < 3) {
                setCustomers([])
                setIsOpen(false)
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
                        setIsOpen(customers.length > 0)
                    } else {
                        setCustomers([])
                        setIsOpen(false)
                    }
                } else {
                    console.error('Failed to fetch customers:', response.statusText)
                    setCustomers([])
                    setIsOpen(false)
                }
            } catch (error) {
                console.error('Error fetching customers:', error)
                setCustomers([])
                setIsOpen(false)
            } finally {
                setLoading(false)
            }
        }

        const debounceTimer = setTimeout(() => {
            fetchCustomers()
        }, 300)

        return () => clearTimeout(debounceTimer)
    }, [searchTerm])

    const handleCustomerSelect = (customer: Customer | null) => {
        if (customer) {
            onCustomerChange(customer.id, customer.name)
            setSearchTerm(customer.name)
        } else {
            onCustomerChange(null, "Anonymous Guest")
            setSearchTerm("")
        }
        setCustomers([])
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || customers.length === 0) return

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex(prev => (prev < customers.length - 1 ? prev + 1 : prev))
                break
            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0))
                break
            case 'Enter':
                e.preventDefault()
                if (selectedIndex >= 0 && selectedIndex < customers.length) {
                    handleCustomerSelect(customers[selectedIndex])
                }
                break
            case 'Escape':
                e.preventDefault()
                setCustomers([])
                setIsOpen(false)
                setSelectedIndex(-1)
                break
        }
    }

    const handleInputFocus = () => {
        if (searchTerm.trim() && searchTerm.trim().length >= 3) {
            setIsOpen(true)
        }
    }

    const handleInputBlur = () => {
        // Delay closing to allow click on suggestions
        setTimeout(() => {
            setIsOpen(false)
        }, 200)
    }

    const handleSuggestionClick = (customer: Customer) => {
        handleCustomerSelect(customer)
    }

    const handleClear = () => {
        setSearchTerm("")
        onCustomerChange(null, "Anonymous Guest")
        setCustomers([])
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.focus()
    }

    return (
        <div className="space-y-2">
            <Label htmlFor="customer-search" className="text-sm font-medium">
                Customer
            </Label>
            <div className="relative">
                <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        id="customer-search"
                        type="text"
                        placeholder="Type 3+ characters to search for customer..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setSelectedIndex(-1)
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className="pl-10 pr-10"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Suggestions list */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {loading ? (
                            <div className="p-3 text-sm text-muted-foreground">
                                Searching...
                            </div>
                        ) : customers.length > 0 ? (
                            <div className="py-1">
                                {customers.map((customer, index) => (
                                    <div
                                        key={customer.id}
                                        className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm flex items-center justify-between ${index === selectedIndex ? 'bg-accent' : ''
                                            }`}
                                        onMouseDown={(e: MouseEvent) => {
                                            e.preventDefault()
                                            handleSuggestionClick(customer)
                                        }}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <div className="font-medium">{customer.name}</div>
                                                {(customer.email || customer.phone) && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {customer.email || customer.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : searchTerm.trim() && searchTerm.trim().length >= 3 ? (
                            <div className="p-3 text-sm text-muted-foreground">
                                No customers found
                            </div>
                        ) : searchTerm.trim() ? (
                            <div className="p-3 text-sm text-muted-foreground">
                                Type at least 3 characters to search
                            </div>
                        ) : (
                            <div
                                className="p-3 text-sm text-muted-foreground cursor-pointer hover:bg-accent"
                                onMouseDown={(e: MouseEvent) => {
                                    e.preventDefault()
                                    handleCustomerSelect(null)
                                }}
                            >
                                <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4" />
                                    <span>Anonymous Guest</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}