"use client";

import React from "react";
import { QrCode, Link2, UserPlus } from "lucide-react";

interface ActionButtonsRowProps {
    onScanQR: () => void;
    onUseLink: () => void;
    onAddContact: () => void;
}

const ActionButtonsRow = ({
    onScanQR,
    onUseLink,
    onAddContact,
}: ActionButtonsRowProps) => {
    return (
        <div className="bg-white dark:bg-darkBg-card rounded-2xl shadow-sm border border-gray-100 dark:border-darkBorder-light p-5 my-4">
            <p className="text-gray-700 dark:text-gray-300 font-medium mb-5">
                who are you sending to?
            </p>

            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
                {/* Scan QR Button */}
                <button
                    onClick={onScanQR}
                    className="flex items-center gap-2.5 group whitespace-nowrap"
                >
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                        <QrCode className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-500 transition-colors">
                        Scan their QR
                    </span>
                </button>

                {/* Use Link Button */}
                <button
                    onClick={onUseLink}
                    className="flex items-center gap-2.5 group whitespace-nowrap"
                >
                    <div className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
                        <Link2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                        Use their link
                    </span>
                </button>

                {/* Add Contact Button */}
                <button
                    onClick={onAddContact}
                    className="flex items-center gap-2.5 group whitespace-nowrap"
                >
                    <div className="w-10 h-10 rounded-lg bg-brand-gold flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                        <UserPlus className="w-5 h-5 text-darkBg-main" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-brand-gold transition-colors">
                        Add him as a new contact
                    </span>
                </button>
            </div>
        </div>
    );
};

export default ActionButtonsRow;
