"use client"

import type React from "react"
import { useEffect } from "react"

import store from "@/lib/redux-store"
import { Provider } from "react-redux"
import { NotificationProvider } from "@/context/NotificationContext"
import { ChatProvider } from "@/context/ChatContext"
import { SidebarProvider } from "@/context/SidebarContext"
import { ThemeProvider } from "@/context/ThemeContext"
import { QRScannerProvider } from "@/context/QRScannerContext"


const ClientProvider = ({ children }: { children: React.ReactNode }) => {
    useEffect(() => {
        // Register service worker for PWA notifications
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered:', registration);
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }, []);

    return (
        <Provider store={store}>
            <ThemeProvider>
                <NotificationProvider>
                    <ChatProvider>
                        <SidebarProvider>
                            <QRScannerProvider>
                                {children}
                            </QRScannerProvider>
                        </SidebarProvider>
                    </ChatProvider>
                </NotificationProvider>
            </ThemeProvider>
        </Provider>
    )
}

export default ClientProvider
