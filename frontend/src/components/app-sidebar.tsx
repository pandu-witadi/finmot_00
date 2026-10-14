import * as React from "react"
import { GalleryVerticalEnd, LogOut, User } from "lucide-react"
import { useAuth } from "@/context/AuthProvider"
import { Button } from "@/components/ui/button"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { Link, useNavigate, useLocation } from "react-router-dom"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = async () => {
        logout()
        navigate("/login")
    }

    const isActive = (path: string) => location.pathname === path

    const data = {
        navMain: [
            {
                title: "Dashboard",
                url: "/dashboard",
                items: [],
            },
            {
                title: "Users",
                url: "/users",
                items: [],
            },
            {
                title: "Projects",
                url: "/projects",
                items: [
                    {
                        title: "All Projects",
                        url: "/projects",
                    },
                    {
                        title: "Favorites",
                        url: "/projects/favorites",
                    },
                    {
                        title: "Archived",
                        url: "/projects/archived",
                    },
                ],
            },
            {
                title: "Analytics",
                url: "/dashboard/analytics",
                items: [
                    {
                        title: "Overview",
                        url: "/dashboard/analytics",
                    },
                    {
                        title: "Reports",
                        url: "/dashboard/analytics/reports",
                    },
                ],
            },
            {
                title: "Settings",
                url: "/dashboard/settings",
                items: [
                    {
                        title: "General",
                        url: "/dashboard/settings",
                    },
                    {
                        title: "Notifications",
                        url: "/dashboard/settings/notifications",
                    },
                ],
            },
        ],
    }

    return (
        <Sidebar variant="sidebar" collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Link to="/dashboard" className="block">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground transition-transform duration-200">
                                <GalleryVerticalEnd className="size-4" />
                            </div>
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {data.navMain.map((item) => (
                    <SidebarGroup key={item.title}>
                        <SidebarGroupLabel className="text-sidebar-foreground/70">{item.title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-2">
                                <SidebarMenuItem key={item.title}>
                                    <Link to={item.url} className="block w-full">
                                        <div className={isActive(item.url) ? "font-medium text-sidebar-accent-foreground" : "font-medium"}>
                                            {item.title}
                                        </div>
                                    </Link>
                                </SidebarMenuItem>
                                {item.items && item.items.length > 0 && (
                                    <ul className="mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5">
                                        {item.items.map((subItem) => (
                                            <li key={subItem.title}>
                                                <Link to={subItem.url} className="block w-full">
                                                    <div className={isActive(subItem.url) ? "text-sidebar-accent-foreground" : "text-sidebar-foreground"}>
                                                        {subItem.title}
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarFooter>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <div className="flex items-center gap-3 px-2 py-2">
                                    <div className="flex flex-col items-start flex-1 min-w-0">
                                        <span className="text-sm font-medium truncate">{user?.name || "User"}</span>
                                        <span className="text-xs text-muted-foreground truncate">{user?.email || "user@example.com"}</span>
                                    </div>
                                    <User className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
                                    <LogOut className="h-4 w-4" />
                                    <span>Logout</span>
                                </Button>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
