"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus, Send, X } from "lucide-react";

interface ScannedUser {
    id: string;
    name: string;
    profileLink: string;
    type?: 'user' | 'organization';
    avatar?: string;
    isOrganization?: boolean;
}

interface ScanOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    scannedUser: ScannedUser | null;
    onAddContactAndTransfer: () => void;
    onDirectTransfer: () => void;
    isInviting: boolean;
    isLookingUpUser?: boolean;
    isExistingContact?: boolean;
}

const ScanOptionsModal = ({
    isOpen,
    onClose,
    scannedUser,
    onAddContactAndTransfer,
    onDirectTransfer,
    isInviting,
    isLookingUpUser = false,
    isExistingContact = false,
}: ScanOptionsModalProps) => {
    if (!scannedUser) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        {isExistingContact ? "Send Money" : "User Found"}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {/* User Info Card */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6">
                        {scannedUser.avatar ? (
                            <img 
                                src={scannedUser.avatar} 
                                alt={scannedUser.name}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-lg font-semibold text-white">
                                    {scannedUser.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                                {scannedUser.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {scannedUser.isOrganization ? 'Organization' : 'User'} • {isExistingContact ? "In your contacts" : "Not in your contacts"}
                            </p>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        {isExistingContact ? (
                            // For existing contacts, show only "Send Money" button
                            <>
                                <Button
                                    onClick={onDirectTransfer}
                                    disabled={isInviting || isLookingUpUser}
                                    className="w-full h-12 bg-brand-green hover:bg-brand-green/90 text-white"
                                    size="lg"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Money
                                </Button>

                                <Button
                                    onClick={onClose}
                                    variant="ghost"
                                    className="w-full text-gray-500 dark:text-gray-400"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            // For new contacts, show both options
                            <>
                                <Button
                                    onClick={onAddContactAndTransfer}
                                    disabled={isInviting || isLookingUpUser}
                                    className="w-full h-12 bg-brand-green hover:bg-brand-green/90 text-white"
                                    size="lg"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    {isInviting ? "Sending Invitation..." : "Add Contact & Send Money"}
                                </Button>
                                
                                <Button
                                    onClick={onDirectTransfer}
                                    disabled={isInviting || isLookingUpUser}
                                    variant="outline"
                                    className="w-full h-12"
                                    size="lg"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Money Only
                                </Button>

                                <Button
                                    onClick={onClose}
                                    variant="ghost"
                                    className="w-full text-gray-500 dark:text-gray-400"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Info Text */}
                    {!isExistingContact && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                💡 <strong>Add Contact:</strong> Send invitation and proceed to transfer.
                                <br />
                                💸 <strong>Send Only:</strong> One-time transfer without adding to contacts.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ScanOptionsModal;