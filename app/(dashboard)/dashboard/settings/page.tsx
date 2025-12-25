'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useUserProfile } from "@/lib/hooks/use-user-profile"

const CURRENCIES = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'IDR', label: 'IDR - Indonesian Rupiah' },
    { value: 'SGD', label: 'SGD - Singapore Dollar' },
]

export default function SettingsPage() {
    const [loading, setLoading] = useState(false)
    const [shopName, setShopName] = useState('')
    const [address, setAddress] = useState('')
    const [phone, setPhone] = useState('')
    const [currency, setCurrency] = useState('USD')
    const [taxPercentage, setTaxPercentage] = useState('0')
    const supabase = createClient()
    const { profile } = useUserProfile()

    useEffect(() => {
        if (profile?.shop_id) {
            loadShopSettings()
        }
    }, [profile?.shop_id])

    async function loadShopSettings() {
        if (!profile?.shop_id) return

        try {
            const { data, error } = await (supabase
                .from('shops') as any)
                .select('*')
                .eq('id', profile.shop_id)
                .single()

            if (error) throw error

            if (data) {
                const shopData = data as any
                setShopName(shopData.name || '')
                setAddress(shopData.address || '')
                setPhone(shopData.phone || '')
                setCurrency(shopData.currency || 'USD')
                setTaxPercentage(shopData.tax_percentage?.toString() || '0')
            }
        } catch (error) {
            console.error('Error loading settings:', error)
        }
    }

    async function handleSave() {
        if (!profile?.shop_id) {
            toast.error("Shop identifier missing")
            return
        }

        setLoading(true)
        try {
            const { error } = await (supabase
                .from('shops') as any)
                .update({
                    name: shopName,
                    address: address,
                    phone: phone,
                    currency: currency,
                    tax_percentage: parseFloat(taxPercentage)
                })
                .eq('id', profile.shop_id)

            if (error) throw error
            toast.success('Settings saved successfully')
        } catch (error: any) {
            console.error('Error saving settings:', error)
            toast.error('Failed to save settings: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your shop settings and preferences.
                </p>
            </div>

            <Separator />

            <div className="grid gap-6">
                {/* Shop Information */}
                <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold">Shop Information</h2>
                        <p className="text-sm text-muted-foreground">
                            Update your shop details
                        </p>
                    </div>
                    <div className="grid gap-4 max-w-xl">
                        <div className="grid gap-2">
                            <Label htmlFor="shop-name">Shop Name</Label>
                            <Input
                                id="shop-name"
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                placeholder="Demo Coffee Shop"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="shop-address">Address</Label>
                            <Input
                                id="shop-address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="123 Main Street"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="shop-phone">Phone</Label>
                            <Input
                                id="shop-phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1234567890"
                            />
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Currency & Tax Settings */}
                <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold">Currency & Tax</h2>
                        <p className="text-sm text-muted-foreground">
                            Configure currency and tax settings
                        </p>
                    </div>
                    <div className="grid gap-4 max-w-xl">
                        <div className="grid gap-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger id="currency">
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CURRENCIES.map((curr) => (
                                        <SelectItem key={curr.value} value={curr.value}>
                                            {curr.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tax-percentage">Tax Percentage (%)</Label>
                            <Input
                                id="tax-percentage"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={taxPercentage}
                                onChange={(e) => setTaxPercentage(e.target.value)}
                                placeholder="10.00"
                            />
                            <p className="text-xs text-muted-foreground">
                                Tax will be applied to all transactions
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Save Button */}
                <div className="max-w-xl">
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>

                <Separator />

                {/* Account Settings */}
                <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold">Account</h2>
                        <p className="text-sm text-muted-foreground">
                            Manage your account settings
                        </p>
                    </div>
                    <div className="grid gap-4 max-w-xl">
                        <Button variant="outline" className="w-fit">
                            Change Password
                        </Button>
                        <Button variant="destructive" className="w-fit">
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
