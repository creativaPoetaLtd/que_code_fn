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
import { notificationService } from "@/services/notificationService"
import { registerPushServiceWorker } from "@/services/webPushService"
import BrowserNotificationBadge from "@/components/notifications/BrowserNotificationBadge"
import AuthSessionManager from "@/components/AuthSessionManager"
import AppLockGate from "@/components/AppLockGate"


const ClientProvider = ({ children }: { children: React.ReactNode }) => {
    useEffect(() => {
        notificationService.syncFromPrefs()

        void registerPushServiceWorker().catch((error) => {
            console.error('Service Worker registration failed:', error)
        })
    }, []);

    return (
        <Provider store={store}>
            <AuthSessionManager />
            <ThemeProvider>
                <AppLockGate />
                <NotificationProvider>
                    <BrowserNotificationBadge />
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
