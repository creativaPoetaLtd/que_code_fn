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
import ChatNotificationSync from "@/components/ChatNotificationSync"
import SecureDeviceBootstrap from "@/components/SecureDeviceBootstrap"

const APP_LOCK_ENABLED = process.env.NEXT_PUBLIC_ENABLE_APP_LOCK === "true"
const APP_LOCK_STORAGE_KEYS = ["qc:appLocked", "qc:lastActivityAt"]

const ClientProvider = ({ children }: { children: React.ReactNode }) => {
    useEffect(() => {
        notificationService.syncFromPrefs()

        if (!APP_LOCK_ENABLED && typeof window !== "undefined") {
            APP_LOCK_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
        }

        void registerPushServiceWorker().catch((error) => {
            console.error('Service Worker registration failed:', error)
        })
    }, []);

    return (
        <Provider store={store}>
            <AuthSessionManager />
            <SecureDeviceBootstrap />
            <ThemeProvider>
                {APP_LOCK_ENABLED ? <AppLockGate /> : null}
                <NotificationProvider>
                    <BrowserNotificationBadge />
                    <ChatProvider>
                        <ChatNotificationSync />
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
