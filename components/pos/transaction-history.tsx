'use client'

import { useUserProfile } from '@/lib/hooks/use-user-profile'
import { TransactionList } from './transaction-list'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// Helper function to convert UTC to Indonesia timezone (UTC+7)
function toIndonesiaTime(date: Date): Date {
    // Create a new date object
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
    // Add 7 hours for UTC+7
    return new Date(utcDate.getTime() + 7 * 60 * 60000)
}

// Helper function to format date in Indonesia timezone
function formatIndonesiaDate(date: Date): string {
    const indoDate = toIndonesiaTime(date)
    return format(indoDate, 'yyyy-MM-dd')
}

// Helper function to get start of day in Indonesia timezone (UTC+7)
function getIndonesiaStartOfDay(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00')
    // Subtract 7 hours to get UTC equivalent of Indonesia start of day
    date.setHours(date.getHours() - 7)
    return date.toISOString()
}

// Helper function to get end of day in Indonesia timezone (UTC+7)
function getIndonesiaEndOfDay(dateString: string): string {
    const date = new Date(dateString + 'T23:59:59.999')
    // Subtract 7 hours to get UTC equivalent of Indonesia end of day
    date.setHours(date.getHours() - 7)
    return date.toISOString()
}

export function TransactionHistory() {
    const { profile } = useUserProfile()
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [dateRange, setDateRange] = useState({
        startDate: formatIndonesiaDate(new Date()), // today in Indonesia time
        endDate: formatIndonesiaDate(new Date()) // today in Indonesia time
    })
    const supabase = createClient()

    // Get current user ID
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                console.log('TransactionHistory - Current user:', {
                    id: user.id,
                    email: user.email,
                    aud: user.aud
                })
                setCurrentUserId(user.id)
            }
        }
        getUser()
    }, [])

    // Use the shop ID from the user's profile
    const shopId = profile?.shop_id
    const [filterMode, setFilterMode] = useState<'today' | 'thisWeek'>('today')

    const handleToday = () => {
        const today = formatIndonesiaDate(new Date())
        setDateRange({
            startDate: today,
            endDate: today
        })
        setFilterMode('today')
    }

    const handleThisWeek = () => {
        const now = new Date()
        const dayOfWeek = now.getDay()
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday is 0, Sunday is 6
        const monday = new Date(now.setDate(now.getDate() - diff))

        const startDate = formatIndonesiaDate(monday)
        const endDate = formatIndonesiaDate(new Date())

        setDateRange({
            startDate,
            endDate
        })
        setFilterMode('thisWeek')
    }

    if (!currentUserId || !shopId) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading information...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Date Range Filter */}
            <div className="p-4 border-b bg-background flex-shrink-0">
                {/* Preset Filter Buttons */}
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Filter:</span>
                    <button
                        onClick={handleToday}
                        className={`px-3 py-1 text-xs rounded ${filterMode === 'today'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                    >
                        Today
                    </button>
                    <button
                        onClick={handleThisWeek}
                        className={`px-3 py-1 text-xs rounded ${filterMode === 'thisWeek'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                    >
                        This Week
                    </button>
                </div>

                {/* Status Message */}
                <p className="text-xs text-muted-foreground italic mt-2">
                    {filterMode === 'today'
                        ? 'Showing today\'s transactions'
                        : 'Showing this week\'s transactions (Monday to Today)'}
                </p>
            </div>

            <TransactionList
                shopId={shopId}
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                currentUserId={currentUserId}
            />
        </div>
    )
}