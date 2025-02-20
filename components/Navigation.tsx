"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { House, ChartNoAxesColumn, Settings, LogOut, Captions, ChevronRight, ChevronLeft, Mail, CreditCard, User, ScanLine } from "lucide-react";
import Image from "next/image";

export const Navigation = () => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [activeItem, setActiveItem] = useState("Statistics");
    const router = useRouter();

    const navigationItems = [
        { id: "Home", icon: <House size={24} />, label: "Home", path: "/home" },
        { id: "Statistics", icon: <ChartNoAxesColumn size={24} />, label: "Statistics", path: "/statistics" },
        { id: "Scan", icon: <ScanLine size={24} />, label: "Scan", path: "", isCenterButton: true },
        { id: "Actions", icon: <Captions size={24} />, label: "Actions", path: "/action" },
        { id: "Profile", icon: <User size={24} />, label: "Profile", path: "" },
    ];

    const mainMenuItems = [
        { id: "Home", icon: <House size={24} />, label: "Home", path: "/home" },
        { id: "Statistics", icon: <ChartNoAxesColumn size={24} />, label: "Statistics", path: "/statistics" },
        { id: "Actions", icon: <Captions size={24} />, label: "Action", path: "/action" },
        { id: "Message", icon: <Mail size={24} />, label: "Message", path: "" },
    ];

    const bottomMenuItems = [
        { id: "Settings", icon: <Settings size={24} />, label: "Settings", path: "" },
        { id: "Logout", icon: <LogOut size={24} />, label: "Logout", path: "/logout" },
    ];

    const handleClick = (id: string, path: string) => {
        // Always update the active item
        setActiveItem(id);

        // Navigate only if there's a valid path
        if (path) {
            router.push(path);
        }
    };

    const SidebarContent = () => (
        <aside
            className={`${isExpanded ? "w-64" : "w-20"
                } bg-[#00313A] fixed top-0 left-0 h-screen flex-col justify-between transition-all duration-300 hidden lg:flex`}
        >
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute -right-3 top-8 bg-[#00313A] text-white rounded-full p-1 hover:bg-[#003D52] z-10"
            >
                {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>

            <div className="flex flex-col h-full">
                <div className="flex items-center justify-center py-6 border-b border-[#003D52]">
                    {isExpanded ? (
                        <Image src="/Images/logo.png" alt="Logo" width={130} height={130} className="h-auto" />
                    ) : (
                        <Image src="/Images/ShortenLogo.png" alt="Short Logo" width={30} height={30} className="h-auto" />
                    )}
                </div>

                <nav className="flex-grow">
                    <div className="flex flex-col items-center pt-8">
                        {mainMenuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleClick(item.id, item.path)}
                                className={`w-[80%] flex items-center px-4 py-3 transition-colors mb-2 ${isExpanded ? "justify-start" : "justify-center"
                                    } ${activeItem === item.id
                                        ? "bg-[#00B512] text-white rounded-r-full"
                                        : "text-white hover:bg-[#003D52]"
                                    }`}
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
                            className={`w-[80%] mx-auto flex items-center px-4 py-3 transition-colors mb-2 ${isExpanded ? "justify-start" : "justify-center"
                                } ${activeItem === item.id
                                    ? "bg-[#00B512] text-white rounded-r-full"
                                    : "text-white hover:bg-[#003D52]"
                                }`}
                        >
                            <span className="inline-flex items-center justify-center">{item.icon}</span>
                            {isExpanded && <span className="ml-4 whitespace-nowrap">{item.label}</span>}
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );

    const BottomNavContent = () => (
        <nav className="fixed bottom-0 left-0 right-0 px-4 lg:hidden">
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
                    const isCenterButton = item.isCenterButton;
                    const isActive = activeItem === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleClick(item.id, item.path)}
                            className={`flex flex-col items-center relative ${isCenterButton ? "-mt-10" : ""}`}
                        >
                            {isCenterButton && (
                                <span className="absolute -top-4 w-16 h-16 bg-[#00B512] rounded-full flex items-center justify-center shadow-lg" />
                            )}
                            <span
                                className={`relative z-10 mt-4 ${isCenterButton ? "text-4xl -top-3" : "text-2xl"} transition-colors 
                                ${isActive || isCenterButton ? "text-white" : "text-gray-400 hover:text-white"}`}
                            >
                                {item.icon}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );

    return (
        <>
            <SidebarContent />
            <BottomNavContent />
        </>
    );
};

export default Navigation;