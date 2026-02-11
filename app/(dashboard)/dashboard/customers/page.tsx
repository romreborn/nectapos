'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Edit, Trash2, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Customer {
    id: string
    name: string
    email?: string
    phone?: string
    created_at: string
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const supabase = createClient()

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    })

    useEffect(() => {
        fetchCustomers()
    }, [searchTerm])

    const fetchCustomers = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) {
                toast.error('Not authenticated')
                return
            }

            // Use the service role API to bypass RLS issues temporarily
            const url = new URL('/api/customers', window.location.origin)
            if (searchTerm.trim()) {
                url.searchParams.set('search', searchTerm.trim())
            }

            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to fetch customers')
            }

            const data = await response.json()
            // API returns {success: true, data: {customers: [...]}}
            setCustomers(data.data?.customers || [])
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch customers')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCustomer = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) {
                toast.error('Not authenticated')
                return
            }

            // Use the customers API to create a new customer
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create customer')
            }

            toast.success('Customer created successfully')
            setIsCreateDialogOpen(false)
            setFormData({ name: '', email: '', phone: '' })
            fetchCustomers()
        } catch (error: any) {
            toast.error(error.message || 'Failed to create customer')
        }
    }

    const handleUpdateCustomer = async () => {
        if (!editingCustomer) return

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) {
                toast.error('Not authenticated')
                return
            }

            // Use the customers API to update the customer
            const response = await fetch(`/api/customers/${editingCustomer.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to update customer')
            }

            toast.success('Customer updated successfully')
            setIsEditDialogOpen(false)
            setEditingCustomer(null)
            setFormData({ name: '', email: '', phone: '' })
            fetchCustomers()
        } catch (error: any) {
            toast.error(error.message || 'Failed to update customer')
        }
    }

    const handleDeleteCustomer = async (id: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) {
                toast.error('Not authenticated')
                return
            }

            // Use the customers API to delete the customer
            const response = await fetch(`/api/customers/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to delete customer')
            }

            toast.success('Customer deleted successfully')
            fetchCustomers()
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete customer')
        }
    }

    const openEditDialog = (customer: Customer) => {
        setEditingCustomer(customer)
        setFormData({
            name: customer.name,
            email: customer.email || '',
            phone: customer.phone || ''
        })
        setIsEditDialogOpen(true)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading customers...</p>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
                    <p className="text-muted-foreground">
                        Manage your customer database
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Customer
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Customer</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter customer name"
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Enter email address"
                                />
                            </div>
                            <div>
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <Button onClick={handleCreateCustomer} className="w-full">
                                Create Customer
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Customers</CardTitle>
                    <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search customers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {customers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Users className="h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-2 text-sm font-semibold">No customers</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Get started by adding your first customer.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell className="font-medium">
                                            {customer.name}
                                        </TableCell>
                                        <TableCell>
                                            {customer.email || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {customer.phone || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(customer.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEditDialog(customer)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" size="sm">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the customer "{customer.name}".
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id)}>
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Customer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-name">Name *</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter customer name"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Enter email address"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-phone">Phone</Label>
                            <Input
                                id="edit-phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Enter phone number"
                            />
                        </div>
                        <Button onClick={handleUpdateCustomer} className="w-full">
                            Update Customer
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}