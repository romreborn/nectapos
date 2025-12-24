'use client'

import Link from "next/link"
import Image from "next/image"
import { CircleUser, Menu, Store } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { siteConfig } from "@/config/site"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { logout } from "@/app/(auth)/actions"

export function Header() {
    const pathname = usePathname()

    return (
        <header className="flex h-16 items-center gap-4 border-b border-primary/10 bg-background px-6 flex-shrink-0 shadow-sm">
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 lg:hidden border-primary/20 text-primary"
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col bg-primary text-primary-foreground border-r-blue-800 p-0 w-[280px]">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <div className="flex h-16 items-center border-b bg-background border-white/10 px-6">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 font-semibold text-white justify-center w-full"
                        >
                            <Image
                                src="/necta_logo.png"
                                alt="Necta POS Logo"
                                width={120}
                                height={40}
                                className="h-10 w-auto object-contain"
                                priority
                            />
                        </Link>
                    </div>
                    <nav className="grid gap-1 text-lg font-medium p-4">
                        {siteConfig.mainNav.map((item, index) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={index}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-blue-100/80 hover:text-white hover:bg-white/10 transition-colors",
                                        pathname === item.href ? "bg-white/15 text-white shadow-sm font-semibold" : ""
                                    )}
                                >
                                    {Icon && <Icon className="h-5 w-5" />}
                                    {item.title}
                                </Link>
                            )
                        })}
                    </nav>
                </SheetContent>
            </Sheet>

            {/* Spacer - pushes user menu to the right */}
            <div className="flex-1" />

            {/* User menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <CircleUser className="h-5 w-5" />
                        <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">Account</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                Manage your account settings
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <Link href="/dashboard/settings" className="w-full cursor-default">
                            Settings
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Link href="/dashboard/profile" className="w-full cursor-default">
                            Profile
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Support</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <form action={logout}>
                        <button type="submit" className="w-full text-left cursor-default">
                            <DropdownMenuItem className="cursor-pointer">
                                Log out
                            </DropdownMenuItem>
                        </button>
                    </form>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    )
}
