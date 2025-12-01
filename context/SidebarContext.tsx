"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface SidebarContextType {
    isExpanded: boolean
    setIsExpanded: (expanded: boolean) => void
    toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isExpanded, setIsExpanded] = useState<boolean>(false)
    const [isMounted, setIsMounted] = useState(false)

    // Load sidebar state from localStorage on mount
    useEffect(() => {
        const savedState = localStorage.getItem('sidebarExpanded')
        if (savedState !== null) {
            setIsExpanded(savedState === 'true')
        }
        setIsMounted(true)
    }, [])

    // Save sidebar state to localStorage whenever it changes
    useEffect(() => {
        if (isMounted) {
            localStorage.setItem('sidebarExpanded', String(isExpanded))
        }
    }, [isExpanded, isMounted])

    const toggleSidebar = () => {
        setIsExpanded(prev => !prev)
    }

    return (
        <SidebarContext.Provider value={{ isExpanded, setIsExpanded, toggleSidebar }}>
            {children}
        </SidebarContext.Provider>
    )
}

export function useSidebar() {
    const context = useContext(SidebarContext)
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider')
    }
    return context
}
