import { LayoutDashboard, ShoppingCart, Package, FileBarChart, Settings, Users } from "lucide-react"

export type NavItem = {
    title: string
    href: string
    icon?: any
    disabled?: boolean
}

export const siteConfig = {
    name: "Necta POS",
    description: "Offline-first Point of Sale System",
    mainNav: [
        {
            title: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard
        },
        {
            title: "POS",
            href: "/dashboard/pos",
            icon: ShoppingCart
        },
        {
            title: "Customers",
            href: "/dashboard/customers",
            icon: Users
        },
        {
            title: "Inventory",
            href: "/dashboard/inventory",
            icon: Package
        },
        {
            title: "Sales Reports",
            href: "/dashboard/reports",
            icon: FileBarChart
        },
        {
            title: "Inventory Reports",
            href: "/dashboard/inventory-reports",
            icon: FileBarChart
        },
        {
            title: "Settings",
            href: "/dashboard/settings",
            icon: Settings
        }
    ] as NavItem[]
}
