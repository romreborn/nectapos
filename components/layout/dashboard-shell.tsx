import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { Footer } from "./footer"

export default function DashboardShell({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen w-full">
            <Sidebar />
            <div className="flex flex-col flex-1 min-h-0">
                <Header />
                <main className="flex-1 overflow-auto p-4 flex flex-col">
                    <div className="flex-1">
                        {children}
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    )
}
