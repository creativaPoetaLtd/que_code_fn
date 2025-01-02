"use client";
import React, { useState } from "react";
import { House, ChartNoAxesColumn, Settings, LogOut, Calendar, ChevronRight, ChevronLeft, Mail } from "lucide-react";
import Image from "next/image";

export const Sidebar = () => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [activeItem, setActiveItem] = useState("Home");

    const mainMenuItems = [
        { id: "Home", icon: <House size={24} />, label: "Home" },
        { id: "Statistics", icon: <ChartNoAxesColumn size={24} />, label: "Statistics" },
        { id: "Calendar", icon: <Calendar size={24} />, label: "Calendar" },
        { id: "Message", icon: <Mail size={24} />, label: "Message" },
    ];

    const bottomMenuItems = [
        { id: "Settings", icon: <Settings size={24} />, label: "Settings" },
        { id: "Logout", icon: <LogOut size={24} />, label: "Logout" },
    ];

    const handleClick = (id: string) => {
        setActiveItem(id);
    };

    return (
        <aside
            className={`${isExpanded ? "w-64" : "w-20"
                } bg-[#00313A] fixed top-0 left-0 h-screen flex flex-col justify-between transition-all duration-300`}
        >
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute -right-3 top-8 bg-[#00313A] text-white rounded-full p-1 hover:bg-[#003D52] z-10"
            >
                {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>

            <div className="flex flex-col h-full">
                {/* Logo Section */}
                <div className="flex items-center justify-center py-6 border-b border-[#003D52]">
                    {isExpanded ? (
                        <Image
                            src="/Images/logo.png"
                            alt="Logo"
                            width={130}
                            height={130}
                            className="h-auto"
                        />
                    ) : (
                        <Image
                            src="/Images/ShortenLogo.png"
                            alt="Short Logo"
                            width={30}
                            height={30}
                            className="h-auto"
                        />
                    )}
                </div>

                {/* Main Menu Items */}
                <nav className="flex-grow">
                    <div className="flex flex-col items-center pt-8">
                        {mainMenuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleClick(item.id)}
                                className={`w-[80%] flex items-center px-4 py-3 transition-colors mb-2 ${isExpanded ? "justify-start" : "justify-center"
                                    } ${activeItem === item.id
                                        ? "bg-[#00B512] text-white rounded-r-full"
                                        : "text-white hover:bg-[#003D52]"
                                    }`}
                            >
                                <span className="inline-flex items-center justify-center">
                                    {item.icon}
                                </span>
                                {isExpanded && (
                                    <span className="ml-4 whitespace-nowrap">{item.label}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Bottom Menu Items */}
                <div className="border-t border-[#003D52] pt-4 pb-8">
                    {bottomMenuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleClick(item.id)}
                            className={`w-[80%] mx-auto flex items-center px-4 py-3 transition-colors mb-2 ${isExpanded ? "justify-start" : "justify-center"
                                } ${activeItem === item.id
                                    ? "bg-[#00B512] text-white rounded-r-full"
                                    : "text-white hover:bg-[#003D52]"
                                }`}
                        >
                            <span className="inline-flex items-center justify-center">
                                {item.icon}
                            </span>
                            {isExpanded && (
                                <span className="ml-4 whitespace-nowrap">{item.label}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );
};