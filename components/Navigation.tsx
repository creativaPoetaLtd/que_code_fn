"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Home,
    BarChart2,
    Settings,
    LogOut,
    FileText,
    ChevronRight,
    ChevronLeft,
    MessageCircle,
    ScanLine,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthToken } from "@/hooks/use-auth-token"

interface NavigationItem {
    id: string
    icon: React.ReactNode
    label: string
    path: string
    isCenterButton?: boolean
}

export default function Navigation() {
    const [isExpanded, setIsExpanded] = useState<boolean>(false)
    const [activeItem, setActiveItem] = useState<string>("Home")
    const [userId, setUserId] = useState<string>("")
    const [isReady, setIsReady] = useState<boolean>(false)
    const { getToken, removeToken } = useAuthToken()
    const router = useRouter()
    const params = useParams()

    // Get userId from URL params or token
    useEffect(() => {
        const getUserId = () => {
            let currentUserId = params.userId as string;

            // If userId is not in URL, try to get it from token
            if (!currentUserId || currentUserId === 'undefined') {
                const authToken = getToken();
                if (authToken) {
                    try {
                        const base64Url = authToken.split('.')[1];
                        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                        const payload = JSON.parse(atob(base64));
                        currentUserId = payload?.userId || payload?.id || payload?.sub;
                    } catch (error) {
                        console.error('Error decoding token:', error);
                    }
                }
            }

            setUserId(currentUserId || "");
            setIsReady(true);
        };

        getUserId();
    }, [params]);

    // Don't render navigation items until we have userId
    if (!isReady) {
        return null;
    }

    const navigationItems: NavigationItem[] = [
        { id: "Home", icon: <Home size={24} />, label: "Home", path: userId ? `/home/${userId}` : '/home' },
        { id: "Statistics", icon: <BarChart2 size={24} />, label: "Statistics", path: userId ? `/statistics/${userId}` : '/statistics' },
        { id: "Scan", icon: <ScanLine size={24} />, label: "Scan", path: "", isCenterButton: true },
        { id: "Actions", icon: <FileText size={24} />, label: "Actions", path: userId ? `/action/${userId}` : '/action' },
        { id: "Chat", icon: <MessageCircle size={24} />, label: "Chat", path: userId ? `/chat` : '/chat' },
    ]

    const mainMenuItems: NavigationItem[] = [
        { id: "Home", icon: <Home size={24} />, label: "Home", path: userId ? `/home/${userId}` : '/home' },
        { id: "Statistics", icon: <BarChart2 size={24} />, label: "Statistics", path: userId ? `/statistics/${userId}` : '/statistics' },
        { id: "Actions", icon: <FileText size={24} />, label: "Action", path: userId ? `/action/${userId}` : '/action' },
        { id: "Chat", icon: <MessageCircle size={24} />, label: "Chat", path: userId ? `/chat` : '/chat' },
    ]

    const bottomMenuItems: NavigationItem[] = [
        { id: "Settings", icon: <Settings size={24} />, label: "Settings", path: userId ? `/settings/${userId}` : '/settings' },
        { id: "Logout", icon: <LogOut size={24} />, label: "Logout", path: "/logout" },
    ]

    const handleClick = (id: string, path: string) => {
        // Handle logout separately
        if (id === "Logout") {
            removeToken();
            router.push('/auth/login');
            return;
        }

        // Handle scan button (no navigation)
        if (id === "Scan") {
            setActiveItem(id);
            // Add scan functionality here
            return;
        }

        // Always update the active item
        setActiveItem(id);

        // Navigate if there's a valid path
        if (path) {
            router.push(path);
        }
    }


    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "bg-[#00313A] fixed top-0 left-0 h-screen flex-col justify-between transition-all duration-300 hidden lg:flex z-20",
                    isExpanded ? "w-64" : "w-20",
                )}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="absolute -right-3 top-8 bg-[#00313A] text-white hover:bg-[#003D52] z-10"
                >
                    {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </Button>

                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-center py-6 border-b border-[#003D52]">
                        {isExpanded ? (
                            <div className="h-8 w-32 bg-white/20 rounded flex items-center justify-center text-white">LOGO</div>
                        ) : (
                            <div className="h-8 w-8 bg-white/20 rounded flex items-center justify-center text-white">L</div>
                        )}
                    </div>

                    <nav className="flex-grow">
                        <div className="flex flex-col items-center pt-8">
                            {mainMenuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleClick(item.id, item.path)}
                                    className={cn(
                                        "w-[80%] flex items-center px-4 py-3 transition-colors mb-2",
                                        isExpanded ? "justify-start" : "justify-center",
                                        activeItem === item.id ? "bg-[#00B512] text-white rounded-r-full" : "text-white hover:bg-[#003D52]",
                                    )}
                                >
                                    <span className="inline-flex items-center justify-center">{item.icon}</span>
                                    {isExpanded && <span className="ml-4 whitespace-nowrap">{item.label}</span>}
                                </button>
                            ))}
                        </div>
                    </nav>

                    <div className="border-t border-[#003D52] pt-4 pb-8">
                        {bottomMenuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleClick(item.id, item.path)}
                                className={cn(
                                    "w-[80%] mx-auto flex items-center px-4 py-3 transition-colors mb-2",
                                    isExpanded ? "justify-start" : "justify-center",
                                    activeItem === item.id ? "bg-[#00B512] text-white rounded-r-full" : "text-white hover:bg-[#003D52]",
                                )}
                            >
                                <span className="inline-flex items-center justify-center">{item.icon}</span>
                                {isExpanded && <span className="ml-4 whitespace-nowrap">{item.label}</span>}
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 px-4 lg:hidden z-50">
                <div className="absolute inset-0 -z-10">
                    <svg
                        className="w-full h-[140px]"
                        viewBox="0 0 375 102"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M155.02 52.2956C147.614 41.4396 137.433 30 124.292 30H1V102H376V30H252.708C239.567 30 229.386 41.4396 221.98 52.2956C214.689 62.9834 202.414 70 188.5 70C174.586 70 162.311 62.9834 155.02 52.2956Z"
                            fill="#00313A"
                        />
                    </svg>
                </div>

                <div className="flex justify-between items-center max-w-md md:max-w-2xl mx-auto relative py-8">
                    {navigationItems.map((item) => {
                        const isCenterButton = item.isCenterButton
                        const isActive = activeItem === item.id

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleClick(item.id, item.path)}
                                className={cn("flex flex-col items-center relative", isCenterButton ? "-mt-10" : "")}
                            >
                                {isCenterButton && (
                                    <span className="absolute -top-4 w-16 h-16 bg-[#00B512] rounded-full flex items-center justify-center shadow-lg" />
                                )}
                                <span
                                    className={cn(
                                        "relative z-10 mt-4 transition-colors",
                                        isCenterButton ? "text-4xl -top-3" : "text-2xl",
                                        isActive || isCenterButton ? "text-white" : "text-gray-400 hover:text-white",
                                    )}
                                >
                                    {item.icon}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}