export function Footer() {
    return (
        <footer className="border-t border-primary/10 py-6 md:px-8 md:py-4 bg-white/50 w-full mt-auto">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row text-sm text-muted-foreground">
                <p>
                    &copy; {new Date().getFullYear()} Necta POS. All rights reserved.
                </p>
                <div className="flex gap-4">
                    <span className="cursor-pointer hover:text-primary transition-colors">Terms of Service</span>
                    <span className="cursor-pointer hover:text-primary transition-colors">Privacy Policy</span>
                </div>
            </div>
        </footer>
    )
}
