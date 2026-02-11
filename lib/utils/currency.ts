/**
 * Currency Formatting Utility
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
    // Handle invalid numbers
    if (isNaN(amount) || !isFinite(amount)) {
        amount = 0
    }

    const currencySymbols: Record<string, string> = {
        'USD': '$',
        'IDR': 'Rp',
        'SGD': 'S$'
    }

    const symbol = currencySymbols[currency] || currency

    // Format based on currency
    if (currency === 'IDR') {
        // Indonesian Rupiah - no decimals
        return `${symbol} ${amount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    } else {
        // USD, SGD - 2 decimals
        return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
}
