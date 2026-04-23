"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
    className?: string;
    label?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ className, label = "Back" }) => {
    const router = useRouter();

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className={`flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors ${className}`}
        >
            <ArrowLeft className="h-4 w-4" />
            {label && <span className="text-sm font-medium">{label}</span>}
        </Button>
    );
};
