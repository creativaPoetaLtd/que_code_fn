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
    QrCode,
    CreditCard,
    PanelLeftClose,
    PanelLeft,
    TrendingUp,
    Wallet,
    Users,
    Clock,
    Store,
    MoreHorizontal,
    X,
    HelpCircle,
    Sun,
    Headphones
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthToken } from "@/hooks/use-auth-token"
import { useSidebar } from "@/context/SidebarContext"
import { useDispatch } from "react-redux"
import { useTheme } from "@/context/ThemeContext"
import { ChevronIcon } from "@/components/ui/chevron-icon"
import { useQRScanner } from "@/context/QRScannerContext"
import QRCodeScanner from "@/components/chat/qr-code-scanner"
import { performClientLogout } from "@/utils/logout"

interface NavigationItem {
    id: string
    icon: React.ReactNode
    label: string
    path: string
    isCenterButton?: boolean
}

interface NavigationProps {
    hideBottomNav?: boolean // Add prop to control bottom nav visibility
}

export default function Navigation({ hideBottomNav = false }: NavigationProps) {
    const { isExpanded, toggleSidebar } = useSidebar()
    const { theme, toggleTheme } = useTheme()
    const { isOpen, openScanner, closeScanner, onScanComplete } = useQRScanner()
    const [activeItem, setActiveItem] = useState<string>("Home")
    const [userId, setUserId] = useState<string>("")
    const [isReady, setIsReady] = useState<boolean>(false)
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
    const { getToken, removeToken } = useAuthToken()
    const router = useRouter()
    const params = useParams()
    const pathname = usePathname()
    const dispatch = useDispatch()

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
        } else if (pathname.includes('/support')) {
            setActiveItem('Support');
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
        { id: "Finances", icon: <BarChart2 size={24} />, label: "Finances", path: "/analytics" },
        { id: "Scan", icon: <ScanLine size={24} />, label: "Scan", path: "", isCenterButton: true },
        { id: "Chat", icon: <MessageCircle size={24} />, label: "Chat", path: userId ? `/chat` : '/chat' },
        { id: "More", icon: <MoreHorizontal size={24} />, label: "More", path: "" },
    ]

    const mobileSecondaryItems: NavigationItem[] = [
        { id: "Contacts", icon: <Users size={24} />, label: "Contacts", path: '/contacts' },
        { id: "Merchants", icon: <Store size={24} />, label: "Merchants", path: userId ? `/merchants/${userId}` : '/merchants' },
        { id: "History", icon: <Clock size={24} />, label: "History", path: "/transactions" },
        { id: "Wallet", icon: <Wallet size={24} />, label: "Wallet", path: userId ? `/wallet/${userId}` : '/wallet' },
        { id: "Settings", icon: <Settings size={24} />, label: "Settings", path: `/settings` },
        { id: "Help", icon: <HelpCircle size={24} />, label: "Help", path: `/help` },
    ]

    const mainMenuItems: NavigationItem[] = [
        { id: "Home", icon: <Home size={24} />, label: "Home", path: userId ? `/home/${userId}` : '/home' },
        { id: "Finances", icon: <BarChart2 size={24} />, label: "Finances", path: "/analytics" },
        { id: "Messages", icon: <MessageCircle size={24} />, label: "Messages", path: "/chat" },
        { id: "Actions", icon: <FileText size={24} />, label: "Actions", path: userId ? `/action/${userId}` : '/action' },
        { id: "Contacts", icon: <Users size={24} />, label: "Contacts", path: '/contacts' },
        { id: "Merchants", icon: <Store size={24} />, label: "Merchants", path: userId ? `/merchants/${userId}` : '/merchants' },
        { id: "History", icon: <Clock size={24} />, label: "History", path: "/transactions" },
        { id: "Wallet", icon: <Wallet size={24} />, label: "Wallet", path: userId ? `/wallet/${userId}` : '/wallet' },
    ]

    const bottomMenuItems: NavigationItem[] = [
        { id: "Settings", icon: <Settings size={24} />, label: "Settings", path: `/settings` },
        { id: "Logout", icon: <LogOut size={24} />, label: "Logout", path: "/logout" },
    ]

    const handleClick = async (id: string, path: string) => {
        // Handle logout separately
        if (id === "Logout") {
            try {
                await performClientLogout({
                    token: getToken(),
                    removeToken,
                    dispatch,
                });
            } catch (error) {
                console.error('Error during logout:', error);
            }

            // Force complete page reload to home using full URL
            setTimeout(() => {
                window.location.href = window.location.origin + "/";
            }, 50);
            return;
        }

        // Handle scan button - open QR scanner
        if (id === "Scan") {
            setActiveItem(id);
            openScanner(undefined, "Scan Profile QR Code");
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
                    "fixed top-0 left-0 h-screen flex-col justify-between transition-all duration-300 hidden lg:flex z-20",
                    theme === "dark" ? "bg-darkBg-sidebar" : "bg-white border-r border-gray-200",
                    isExpanded ? "w-64" : "w-20",
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo and Toggle Section */}
                    <div className={cn(
                        "flex items-center justify-between px-3 py-4 border-b",
                        theme === "dark" ? "border-darkBorder-light" : "border-gray-200"
                    )}>
                        {isExpanded ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className={cn("font-bold text-xl", theme === "dark" ? "text-white" : "text-gray-900")}>QiewCode</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleSidebar}
                                    className={cn(
                                        "h-10 w-10 rounded-lg transition-all hover:scale-110",
                                        theme === "dark"
                                            ? "text-white hover:bg-brand-green hover:text-[#00313A]"
                                            : "text-gray-900 hover:bg-gray-100"
                                    )}
                                    aria-label="Collapse sidebar"
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        <ChevronIcon
                                            direction="left"
                                            size={16}
                                            className={theme === "dark" ? "text-white" : "text-gray-900"}
                                        />
                                        <PanelLeftClose size={18} />
                                    </div>
                                </Button>
                            </>
                        ) : (
                            <button
                                onClick={toggleSidebar}
                                className={cn(
                                    "h-10 w-10 mx-auto rounded-lg flex items-center justify-center font-bold text-sm shadow-lg transition-all hover:scale-105",
                                    theme === "dark"
                                        ? "bg-darkBorder-medium text-white hover:bg-brand-green hover:text-darkBg-main"
                                        : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                                )}
                                aria-label="Expand sidebar"
                            >
                                <ChevronIcon
                                    direction="right"
                                    size={16}
                                    className={theme === "dark" ? "text-white" : "text-gray-900"}
                                />
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
                                            ? theme === "dark"
                                                ? "bg-brand-gold text-gray-900 shadow-lg"
                                                : "bg-brand-green text-white shadow-lg"
                                            : theme === "dark"
                                                ? "text-white hover:bg-darkBg-interactive hover:shadow-md"
                                                : "text-gray-700 hover:bg-gray-100 hover:shadow-md"
                                    )}
                                >
                                    <span className="inline-flex items-center justify-center">{item.icon}</span>
                                    {isExpanded && <span className="ml-4 whitespace-nowrap">{item.label}</span>}
                                </button>
                            ))}
                        </div>
                    </nav>

                    <div className={cn(
                        "border-t pt-4 pb-8 px-2",
                        theme === "dark" ? "border-darkBorder-light" : "border-gray-200"
                    )}>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => handleClick("Support", "/support")}
                                className={cn(
                                    "flex items-center px-3 py-3.5 transition-all rounded-xl duration-200",
                                    "justify-center",
                                    activeItem === "Support"
                                        ? theme === "dark"
                                            ? "bg-brand-gold text-gray-900 shadow-lg"
                                            : "bg-brand-green text-white shadow-lg"
                                        : theme === "dark"
                                            ? "text-white hover:bg-darkBg-interactive hover:shadow-md"
                                            : "text-gray-700 hover:bg-gray-100 hover:shadow-md"
                                )}
                                aria-label="Support"
                                title="Support"
                            >
                                <span className="inline-flex items-center justify-center">
                                    <HelpCircle size={24} />
                                </span>
                            </button>

                            {bottomMenuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleClick(item.id, item.path)}
                                    className={cn(
                                        "flex items-center px-3 py-3.5 transition-all rounded-xl duration-200",
                                        isExpanded ? "justify-start" : "justify-center",
                                        activeItem === item.id
                                            ? theme === "dark"
                                                ? "bg-brand-gold text-gray-900 shadow-lg"
                                                : "bg-brand-green text-white shadow-lg"
                                            : theme === "dark"
                                                ? "text-white hover:bg-darkBg-interactive hover:shadow-md"
                                                : "text-gray-700 hover:bg-gray-100 hover:shadow-md"
                                    )}
                                >
                                    <span className="inline-flex items-center justify-center">{item.icon}</span>
                                    {isExpanded && <span className="ml-4 whitespace-nowrap">{item.label}</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </aside >

            {/* Mobile Bottom Navigation */}
            {!hideBottomNav && < nav className={
                cn(
                    "fixed bottom-0 left-0 right-0 lg:hidden z-50 border-t pointer-events-auto",
                    theme === "dark"
                        ? "bg-darkBg-sidebar border-darkBorder-light"
                        : "bg-white border-gray-200"
                )}>
                {/* More Menu Modal Overlay */}
                {
                    isMoreMenuOpen && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                            {/* Modal Container */}
                            <div className={cn(
                                "relative w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200",
                                theme === "dark" ? "bg-darkBg-card border border-darkBorder-light" : "bg-white"
                            )}>
                                {/* Header and Close Button */}
                                <div className="w-full flex justify-between items-center mb-6">
                                    <span className="opacity-0 w-8 flex-shrink-0"></span> {/* Spacer for centering */}
                                    <h2 className={cn("text-lg font-bold flex-1 text-center", theme === "dark" ? "text-white" : "text-gray-900")}>
                                        More
                                    </h2>
                                    <button
                                        onClick={() => setIsMoreMenuOpen(false)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-darkBg-interactive dark:hover:bg-darkBg-hover transition-colors text-gray-500 dark:text-gray-400"
                                    >
                                        <X size={18} strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* Grid of Items */}
                                <div className="grid grid-cols-2 gap-4 w-full mb-8">
                                    {mobileSecondaryItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleClick(item.id, item.path)}
                                            className={cn(
                                                "flex flex-col items-center justify-center gap-3 py-6 px-2 rounded-2xl transition-all border",
                                                theme === "dark"
                                                    ? "bg-darkBg-sidebar border-darkBorder-light hover:border-brand-gold hover:bg-brand-gold/5"
                                                    : "bg-[#F8F9FA] border-gray-100 shadow-sm hover:border-brand-green/30 hover:shadow-md"
                                            )}
                                        >
                                            <div className={cn(
                                                "text-3xl",
                                                theme === "dark" ? "text-brand-gold" : "text-brand-gold"
                                            )}>
                                                {item.icon}
                                            </div>
                                            <span className={cn(
                                                "text-[13px] font-medium opacity-80",
                                                theme === "dark" ? "text-gray-200" : "text-gray-600"
                                            )}>
                                                {item.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Dark Mode Toggle */}
                                <button
                                    onClick={() => {
                                        toggleTheme();
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 mb-8 transition-opacity hover:opacity-80 font-medium text-sm",
                                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                                    )}
                                >
                                    {theme === "dark" ? (
                                        <Sun size={20} className="text-brand-gold" />
                                    ) : (
                                        <Sun size={20} className="text-brand-gold fill-brand-gold" />
                                    )}
                                    <span>Light / Dark Mode</span>
                                </button>

                                {/* Footer Copyright */}
                                <div className={cn(
                                    "text-xs mt-auto",
                                    theme === "dark" ? "text-gray-500" : "text-gray-400"
                                )}>
                                    © {new Date().getFullYear()} QiewCode — <span className="text-brand-gold">Legal & Privacy</span>
                                </div>
                            </div>
                        </div>
                    )
                }

                <div className="flex justify-between items-center px-4 py-3 max-w-md md:max-w-2xl mx-auto h-16">
                    {/* Left items */}
                    <div className="flex items-center gap-8 flex-1">
                        <button
                            onClick={() => handleClick('Home', mobilePrimaryItems[0].path)}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-colors duration-200",
                                activeItem === 'Home'
                                    ? theme === "dark"
                                        ? "text-brand-gold"
                                        : "text-brand-green"
                                    : theme === "dark"
                                        ? "text-gray-400 hover:text-gray-300"
                                        : "text-gray-600 hover:text-gray-900"
                            )}
                        >
                            <Home size={24} />
                            <span className="text-xs font-medium">Home</span>
                        </button>

                        <button
                            onClick={() => handleClick('Finances', mobilePrimaryItems[1].path)}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-colors duration-200",
                                activeItem === 'Finances'
                                    ? theme === "dark"
                                        ? "text-brand-gold"
                                        : "text-brand-green"
                                    : theme === "dark"
                                        ? "text-gray-400 hover:text-gray-300"
                                        : "text-gray-600 hover:text-gray-900"
                            )}
                        >
                            <TrendingUp size={24} />
                            <span className="text-xs font-medium">Finances</span>
                        </button>
                    </div>

                    {/* Center Scan Button - Larger with Glow */}
                    <button
                        onClick={() => handleClick('Scan', '')}
                        className="flex flex-col items-center gap-1 -mt-10 transition-all active:scale-95 hover:scale-105 duration-200 mx-4"
                    >
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center shadow-[0_18px_40px_rgba(245,158,11,0.6)] hover:shadow-[0_22px_50px_rgba(245,158,11,0.8)] hover:-translate-y-0.5 transition-all duration-200"
                            style={{
                                background: 'radial-gradient(circle at 20% 20%, #ffffff, #f6e08b, #f59e0b)'
                            }}
                        >
                            <QrCode size={30} className="text-gray-900" strokeWidth={2} />
                        </div>
                    </button>

                    {/* Right items */}
                    <div className="flex items-center gap-8 flex-1 justify-end">
                        <button
                            onClick={() => handleClick('Chat', mobilePrimaryItems[3].path)}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-colors duration-200",
                                activeItem === 'Chat'
                                    ? theme === "dark"
                                        ? "text-brand-gold"
                                        : "text-brand-green"
                                    : theme === "dark"
                                        ? "text-gray-400 hover:text-gray-300"
                                        : "text-gray-600 hover:text-gray-900"
                            )}
                        >
                            <MessageCircle size={24} />
                            <span className="text-xs font-medium">Messages</span>
                        </button>

                        <button
                            onClick={() => handleClick('More', '')}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-colors duration-200",
                                isMoreMenuOpen
                                    ? "text-brand-gold"
                                    : theme === "dark"
                                        ? "text-gray-400 hover:text-gray-300"
                                        : "text-gray-600 hover:text-gray-900"
                            )}
                        >
                            <MoreHorizontal size={24} />
                            <span className="text-xs font-medium">More</span>
                        </button>
                    </div>
                </div>
            </nav >}

            {/* Global QR Code Scanner Modal */}
            <QRCodeScanner
                isOpen={isOpen}
                onClose={closeScanner}
                onScanComplete={async (result: string) => {
                    if (onScanComplete) {
                        await onScanComplete(result);
                    }
                    closeScanner();
                }}
                title="Scan Profile QR Code"
            />
        </>
    )
}
