'use client'

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/config/site"
import { Button } from "@/components/ui/button"

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="hidden border-r bg-primary lg:block w-[280px] flex-shrink-0 text-primary-foreground">
            <div className="flex h-full flex-col">
                <div className="flex h-16 items-center bg-background border-b border-white/10 px-6">
                    <Link className="flex items-center gap-2 font-semibold text-white justify-center w-full" href="/dashboard">
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
                <div className="flex-1 overflow-auto py-4">
                    <nav className="grid items-start px-4 text-sm font-medium gap-1">
                        {siteConfig.mainNav.map((item, index) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={index}
                                    href={item.disabled ? "#" : item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all text-blue-100/80 hover:text-white hover:bg-white/10",
                                        pathname === item.href
                                            ? "bg-white/15 text-white shadow-sm font-semibold"
                                            : ""
                                    )}
                                >
                                    {Icon && <Icon className="h-4 w-4" />}
                                    {item.title}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            </div>
        </div>
    )
}
