"use client"

import type React from "react"

import store from "@/lib/redux-store"
import { Provider } from "react-redux"
import { NotificationProvider } from "@/context/NotificationContext"
import { ChatProvider } from "@/context/ChatContext"
import { SidebarProvider } from "@/context/SidebarContext"


const ClientProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <Provider store={store}>
            <NotificationProvider>
                <ChatProvider>
                    <SidebarProvider>
                        {children}
                    </SidebarProvider>
                </ChatProvider>
            </NotificationProvider>
        </Provider>
    )
}

export default ClientProvider
