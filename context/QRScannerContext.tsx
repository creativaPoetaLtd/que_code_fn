"use client"

import React, { createContext, useContext, useState, type ReactNode } from 'react'

type OnScanCompleteCallback = (result: string) => void | Promise<void>

interface QRScannerContextType {
    isOpen: boolean
    openScanner: (onComplete?: OnScanCompleteCallback, title?: string) => void
    closeScanner: () => void
    onScanComplete?: OnScanCompleteCallback
    scannerTitle: string
}

const QRScannerContext = createContext<QRScannerContextType | undefined>(undefined)

export function QRScannerProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [onScanComplete, setOnScanComplete] = useState<OnScanCompleteCallback | undefined>(undefined)
    const [scannerTitle, setScannerTitle] = useState("Scan QR Code")

    const openScanner = (onComplete?: OnScanCompleteCallback, title?: string) => {
        setOnScanComplete(() => onComplete)
        setScannerTitle(title || "Scan QR Code")
        setIsOpen(true)
    }

    const closeScanner = () => {
        setIsOpen(false)
        setOnScanComplete(undefined)
        setScannerTitle("Scan QR Code")
    }

    return (
        <QRScannerContext.Provider value={{ isOpen, openScanner, closeScanner, onScanComplete, scannerTitle }}>
            {children}
        </QRScannerContext.Provider>
    )
}

export function useQRScanner() {
    const context = useContext(QRScannerContext)
    if (context === undefined) {
        throw new Error('useQRScanner must be used within a QRScannerProvider')
    }
    return context
}
