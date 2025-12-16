"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
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
    CreditCard,
    PanelLeftClose,
    PanelLeft,
    TrendingUp,
    Wallet,
    Users,
    Clock,
    Store,
    MoreHorizontal,
    X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthToken } from "@/hooks/use-auth-token"
import { useSidebar } from "@/context/SidebarContext"

interface NavigationItem {
    id: string
    icon: React.ReactNode
    label: string
    path: string
    isCenterButton?: boolean
}

export default function Navigation() {
    const { isExpanded, toggleSidebar } = useSidebar()
    const [activeItem, setActiveItem] = useState<string>("Home")
    const [userId, setUserId] = useState<string>("")
    const [isReady, setIsReady] = useState<boolean>(false)
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
    const { getToken, removeToken } = useAuthToken()
    const router = useRouter()
    const params = useParams()
    const pathname = usePathname()

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

    // Update active item based on current pathname
    useEffect(() => {
        if (pathname.includes('/analytics')) {
            setActiveItem('Finances');
        } else if (pathname.includes('/chat')) {
            setActiveItem('Messages');
        } else if (pathname.includes('/action')) {
            setActiveItem('Actions');
        } else if (pathname.includes('/contacts')) {
            setActiveItem('Contacts');
        } else if (pathname.includes('/merchants')) {
            setActiveItem('Merchants');
        } else if (pathname.includes('/transactions')) {
            setActiveItem('History');
        } else if (pathname.includes('/wallet')) {
            setActiveItem('Wallet');
        } else if (pathname.includes('/settings')) {
            setActiveItem('Settings');
        } else if (pathname.includes('/home')) {
            setActiveItem('Home');
        }
    }, [pathname]);

    // Don't render navigation items until we have userId
    if (!isReady) {
        return null;
    }

    const mobilePrimaryItems: NavigationItem[] = [
        { id: "Home", icon: <Home size={24} />, label: "Home", path: userId ? `/home/${userId}` : '/home' },
        { id: "Statistics", icon: <TrendingUp size={24} />, label: "Statistics", path: userId ? `/statistics/${userId}` : '/statistics' },
        { id: "Scan", icon: <ScanLine size={24} />, label: "Scan", path: "", isCenterButton: true },
        { id: "Chat", icon: <MessageCircle size={24} />, label: "Chat", path: userId ? `/chat` : '/chat' },
        { id: "More", icon: <MoreHorizontal size={24} />, label: "More", path: "" },
    ]

    const mobileSecondaryItems: NavigationItem[] = [
        { id: "Actions", icon: <FileText size={24} />, label: "Actions", path: userId ? `/action/${userId}` : '/action' },
        { id: "Transactions", icon: <Wallet size={24} />, label: "Transactions", path: "/transactions" },
        { id: "Contacts", icon: <Users size={24} />, label: "Contacts", path: userId ? `/contacts/${userId}` : '/contacts' },
        { id: "Merchants", icon: <Store size={24} />, label: "Merchants", path: userId ? `/merchants/${userId}` : '/merchants' },
        { id: "Wallet", icon: <Wallet size={24} />, label: "Wallet", path: userId ? `/wallet/${userId}` : '/wallet' },
        { id: "Settings", icon: <Settings size={24} />, label: "Settings", path: `/settings` },
    ]

    const mainMenuItems: NavigationItem[] = [
        { id: "Home", icon: <Home size={24} />, label: "Home", path: userId ? `/home/${userId}` : '/home' },
        { id: "Finances", icon: <BarChart2 size={24} />, label: "Finances", path: "/analytics" },
        { id: "Messages", icon: <MessageCircle size={24} />, label: "Messages", path: "/chat" },
        { id: "Actions", icon: <FileText size={24} />, label: "Actions", path: userId ? `/action/${userId}` : '/action' },
        { id: "Contacts", icon: <Users size={24} />, label: "Contacts", path: userId ? `/contacts/${userId}` : '/contacts' },
        { id: "Merchants", icon: <Store size={24} />, label: "Merchants", path: userId ? `/merchants/${userId}` : '/merchants' },
        { id: "History", icon: <Clock size={24} />, label: "History", path: "/transactions" },
        { id: "Wallet", icon: <Wallet size={24} />, label: "Wallet", path: userId ? `/wallet/${userId}` : '/wallet' },
    ]

    const bottomMenuItems: NavigationItem[] = [
        { id: "Settings", icon: <Settings size={24} />, label: "Settings", path: `/settings` },
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

        // Handle More button
        if (id === "More") {
            setIsMoreMenuOpen(!isMoreMenuOpen);
            return;
        }

        // Always update the active item
        setActiveItem(id);
        setIsMoreMenuOpen(false);

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
                    "bg-darkBg-interactive fixed top-0 left-0 h-screen flex-col justify-between transition-all duration-300 hidden lg:flex z-20",
                    isExpanded ? "w-64" : "w-20",
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo and Toggle Section */}
                    <div className="flex items-center justify-between px-3 py-4 border-b border-darkBorder-light">
                        {isExpanded ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-bold text-xl">QiewCode</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleSidebar}
                                    className="h-10 w-10 text-white hover:bg-brand-green dark:hover:bg-brand-gold hover:text-[#00313A] rounded-lg transition-all hover:scale-110"
                                >
                                    <PanelLeftClose size={22} />
                                </Button>
                            </>
                        ) : (
                            <button
                                onClick={toggleSidebar}
                                className="h-10 w-10 mx-auto bg-darkBorder-medium rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg hover:bg-brand-green dark:hover:bg-brand-gold hover:text-darkBg-main transition-all hover:scale-105"
                            >
                                QC
                            </button>
                        )}
                    </div>

                    <nav className="flex-grow px-2">
                        <div className="flex flex-col items-stretch pt-8 gap-2">
                            {mainMenuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleClick(item.id, item.path)}
                                    className={cn(
                                        "flex items-center px-3 py-2.5 transition-all rounded-xl duration-200",
                                        isExpanded ? "justify-start" : "justify-center",
                                        activeItem === item.id 
                                            ? "bg-brand-green dark:bg-brand-gold text-white dark:text-[#00313A] shadow-lg" 
                                            : "text-white hover:bg-[#004D5C] hover:shadow-md",
                                    )}
                                >
                                    <span className="inline-flex items-center justify-center">{item.icon}</span>
                                    {isExpanded && <span className="ml-4 whitespace-nowrap">{item.label}</span>}
                                </button>
                            ))}
                        </div>
                    </nav>

                    <div className="border-t border-darkBorder-light pt-4 pb-8 px-2">
                        <div className="flex flex-col gap-2">
                            {bottomMenuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleClick(item.id, item.path)}
                                    className={cn(
                                        "flex items-center px-3 py-3.5 transition-all rounded-xl duration-200",
                                        isExpanded ? "justify-start" : "justify-center",
                                        activeItem === item.id 
                                            ? "bg-brand-green dark:bg-brand-gold text-white dark:text-[#00313A] shadow-lg" 
                                            : "text-white hover:bg-[#004D5C] hover:shadow-md",
                                    )}
                                >
                                    <span className="inline-flex items-center justify-center">{item.icon}</span>
                                    {isExpanded && <span className="ml-4 whitespace-nowrap">{item.label}</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-white dark:bg-darkBg-interactive border-t border-gray-200 dark:border-darkBorder-light pointer-events-auto">
                {/* More Menu Popup */}
                {isMoreMenuOpen && (
                    <div className="absolute bottom-full right-4 mb-2 bg-darkBg-interactive rounded-2xl shadow-xl border border-darkBorder-light p-4 w-64 animate-in slide-in-from-bottom-10 fade-in duration-200">
                        <div className="grid grid-cols-3 gap-4">
                            {mobileSecondaryItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleClick(item.id, item.path)}
                                    className={cn(
                                        "flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors",
                                        activeItem === item.id ? "bg-brand-gold/20 text-brand-gold" : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center px-4 py-3 max-w-md md:max-w-2xl mx-auto h-24">
                    {/* Left items */}
                    <div className="flex items-center gap-8 flex-1">
                        <button
                            onClick={() => handleClick('Home', mobilePrimaryItems[0].path)}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-colors duration-200",
                                activeItem === 'Home' ? "text-brand-green dark:text-brand-gold" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            )}
                        >
                            <Home size={24} />
                            <span className="text-xs font-medium">Home</span>
                        </button>

                        <button
                            onClick={() => handleClick('Statistics', mobilePrimaryItems[1].path)}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-colors duration-200",
                                activeItem === 'Statistics' ? "text-brand-green dark:text-brand-gold" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            )}
                        >
                            <TrendingUp size={24} />
                            <span className="text-xs font-medium">Statistics</span>
                        </button>
                    </div>

                    {/* Center Scan Button - Larger */}
                    <button
                        onClick={() => handleClick('Scan', '')}
                        className="flex flex-col items-center gap-1 -mt-12 transition-transform active:scale-95 hover:scale-110 duration-200 mx-4"
                    >
                        <div className="w-16 h-16 bg-brand-green dark:bg-brand-gold rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                            <ScanLine size={32} className="text-white dark:text-darkBg-main" strokeWidth={1.5} />
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Scan</span>
                    </button>

                    {/* Right items */}
                    <div className="flex items-center gap-8 flex-1 justify-end">
                        <button
                            onClick={() => handleClick('Chat', mobilePrimaryItems[3].path)}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-colors duration-200",
                                activeItem === 'Chat' ? "text-brand-green dark:text-brand-gold" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            )}
                        >
                            <MessageCircle size={24} />
                            <span className="text-xs font-medium">Messages</span>
                        </button>

                        <button
                            onClick={() => handleClick('More', '')}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-colors duration-200",
                                isMoreMenuOpen ? "text-brand-gold" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            )}
                        >
                            <MoreHorizontal size={24} />
                            <span className="text-xs font-medium">More</span>
                        </button>
                    </div>
                </div>
            </nav>
        </>
    )
}