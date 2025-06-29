"use client"

import type React from "react"

import store from "@/lib/redux-store"
import { Provider } from "react-redux"
import { NotificationProvider } from "@/context/NotificationContext"


const ClientProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <Provider store={store}>
            <NotificationProvider>{children}</NotificationProvider>
        </Provider>
    )
}

export default ClientProvider
