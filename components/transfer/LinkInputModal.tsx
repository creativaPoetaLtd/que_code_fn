"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link2, X } from "lucide-react";

interface LinkInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (link: string) => Promise<void>;
    isLoading?: boolean;
}

const LinkInputModal = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading = false,
}: LinkInputModalProps) => {
    const [link, setLink] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        setError("");

        if (!link.trim()) {
            setError("Please enter a profile link");
            return;
        }

        try {
            await onSubmit(link.trim());
            setLink("");
        } catch (err: any) {
            setError(err.message || "Failed to process link");
        }
    };

    const handleClose = () => {
        setLink("");
        setError("");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Link2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </div>
                        Use Their Link
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Input Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Profile Link
                        </label>
                        <input
                            type="text"
                            placeholder="Paste their profile link here..."
                            value={link}
                            onChange={(e) => {
                                setLink(e.target.value);
                                setError("");
                            }}
                            disabled={isLoading}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-brand-green dark:focus:border-brand-gold focus:ring-2 focus:ring-green-100 dark:focus:ring-brand-gold/10 transition-all text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-50"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Help Text */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            💡 <strong>Example:</strong> Paste the full profile URL like que.example.com/welcome/userid or just paste the shared link
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="space-y-2 pt-4">
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading || !link.trim()}
                            className="w-full h-12 bg-brand-green hover:bg-brand-green/90 text-white"
                            size="lg"
                        >
                            {isLoading ? "Processing..." : "Continue"}
                        </Button>
                        <Button
                            onClick={handleClose}
                            disabled={isLoading}
                            variant="ghost"
                            className="w-full text-gray-500 dark:text-gray-400"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LinkInputModal;
