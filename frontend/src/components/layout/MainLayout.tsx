import { AppSidebar } from "@/components/app-sidebar"
import { Footer } from "@/components/Footer"
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbList,
//   BreadcrumbPage,
//   BreadcrumbSeparator,
// } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"

interface MainLayoutProps {
    children: React.ReactNode;
}

const routeMapping: Record<string, string> = {
    "/": "Dashboard",
    "/dashboard": "Dashboard",
    "/users": "Users",
    "/dashboard/projects": "Projects",
    "/dashboard/analytics": "Analytics",
    "/dashboard/settings": "Settings",
}

export function MainLayout({ children }: MainLayoutProps) {
    const [isOpen, setIsOpen] = useState(true)
    const location = useLocation()

    useEffect(() => {
        const savedState = localStorage.getItem("sidebar_state")
        if (savedState) {
            setIsOpen(savedState === "true")
        }
    }, [])

    const currentPage = routeMapping[location.pathname] || "Dashboard"

    return (
        <SidebarProvider defaultOpen={isOpen} open={isOpen} onOpenChange={setIsOpen}>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-12 shrink-0 items-center gap-2 border-b px-2">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        {/* <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{currentPage}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb> */}
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    {children}
                </div>
                <Footer />
            </SidebarInset>
        </SidebarProvider>
    )
}
