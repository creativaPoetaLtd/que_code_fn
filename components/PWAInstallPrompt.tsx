'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Check if user has dismissed before
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            if (!dismissed) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowPrompt(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.error('User accepted the install prompt');
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        localStorage.setItem('pwa-install-dismissed', 'true');
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border-2 border-[#00B512] rounded-lg shadow-2xl p-4 z-50 animate-in slide-in-from-bottom">
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                aria-label="Dismiss"
            >
                <X size={20} />
            </button>

            <div className="flex items-start gap-3">
                <div className="bg-[#00B512] p-2 rounded-lg">
                    <Download size={24} className="text-white" />
                </div>

                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                        Install QiewCode App
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                        Install our app for a better experience with offline access and push notifications.
                    </p>

                    <div className="flex gap-2">
                        <Button
                            onClick={handleInstall}
                            className="bg-[#00B512] hover:bg-green-700 text-white"
                            size="sm"
                        >
                            Install
                        </Button>
                        <Button
                            onClick={handleDismiss}
                            variant="outline"
                            size="sm"
                        >
                            Not now
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
