"use client";

import React from "react";

const RequestLoadingSkeleton = () => {
    return (
        <div className="max-w-2xl mx-auto mt-8 animate-pulse space-y-4">
            {/* Banner skeleton */}
            <div className="rounded-3xl border border-gray-100 dark:border-darkBorder-light bg-white dark:bg-darkBg-card p-6">
                <div className="flex justify-between mb-5">
                    <div className="h-5 w-32 bg-gray-100 dark:bg-darkBg-interactive rounded-full" />
                    <div className="h-5 w-24 bg-gray-100 dark:bg-darkBg-interactive rounded-full" />
                </div>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-darkBg-interactive" />
                    <div className="h-4 w-40 bg-gray-100 dark:bg-darkBg-interactive rounded-full" />
                    <div className="h-10 w-48 bg-gray-100 dark:bg-darkBg-interactive rounded-xl" />
                </div>
            </div>

            {/* Amount input skeleton */}
            <div className="rounded-3xl border border-gray-100 dark:border-darkBorder-light bg-white dark:bg-darkBg-card p-8">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-6 w-16 bg-gray-100 dark:bg-darkBg-interactive rounded-full" />
                    <div className="h-16 w-48 bg-gray-100 dark:bg-darkBg-interactive rounded-xl" />
                    <div className="h-3 w-full bg-gray-100 dark:bg-darkBg-interactive rounded-full" />
                </div>
            </div>

            {/* Button skeleton */}
            <div className="h-14 w-full bg-gray-100 dark:bg-darkBg-interactive rounded-2xl" />
        </div>
    );
};

export default RequestLoadingSkeleton;
