"use client";

import { AlertTriangle, Check, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
    id: string;
    name: string;
    description?: string;
}

interface CategorySelectorProps {
    categories: Category[];
    selectedCategoryId: string | null;
    onSelect: (category: Category) => void;
    applyConstraints: boolean;
    setApplyConstraints: (apply: boolean) => void;
    isOrganization: boolean;
    organizationCategory?: Category | null;
    userRestrictions?: any[];
}

const CategorySelector = ({
    categories,
    selectedCategoryId,
    onSelect,
    applyConstraints,
    setApplyConstraints,
    isOrganization,
    organizationCategory,
    userRestrictions = [],
}: CategorySelectorProps) => {
    return (
        <div className="bg-white dark:bg-darkBg-card rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-darkBorder-light mb-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <ShieldCheck className="w-5 h-5 text-brand-green dark:text-brand-gold" />
                    <h3 className="font-semibold">Spending Constraints</h3>
                </div>
                {!isOrganization && (
                    <button
                        onClick={() => setApplyConstraints(!applyConstraints)}
                        className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            applyConstraints ? "bg-brand-green dark:bg-brand-gold" : "bg-gray-200 dark:bg-darkBg-main"
                        )}
                    >
                        <span
                            className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                applyConstraints ? "translate-x-6" : "translate-x-1"
                            )}
                        />
                    </button>
                )}
            </div>

            {isOrganization ? (
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl">
                        <div className="flex gap-3">
                            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="text-blue-900 dark:text-blue-200 font-semibold mb-1">Organization Transfer</p>
                                <p className="text-blue-700 dark:text-blue-300">
                                    Sending to an organization automatically categorizes funds based on the receiver's purpose.
                                    {organizationCategory && (
                                        <span className="block mt-2 font-medium">
                                            Category: <span className="underline">{organizationCategory.name}</span>
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {userRestrictions.length > 0 && (
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-2xl">
                            <div className="flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="text-orange-900 dark:text-orange-200 font-semibold mb-1">Mixed Funds Warning</p>
                                    <p className="text-orange-700 dark:text-orange-300">
                                        You have restricted funds. Only unrestricted funds can be sent to organizations, as they convert all incoming funds into unrestricted balance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : applyConstraints ? (
                <div className="animate-fadeIn">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Select a category to apply restrictions. The recipient can only spend these funds within this category.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => onSelect(cat)}
                                className={cn(
                                    "p-4 rounded-2xl border text-left transition-all flex items-center justify-between group",
                                    selectedCategoryId === cat.id
                                        ? "bg-brand-green/5 dark:bg-brand-gold/5 border-brand-green dark:border-brand-gold"
                                        : "bg-gray-50 dark:bg-darkBg-main border-gray-100 dark:border-darkBorder-light hover:border-gray-300 dark:hover:border-darkBorder-hover"
                                )}
                            >
                                <div>
                                    <p className={cn(
                                        "font-medium mb-0.5",
                                        selectedCategoryId === cat.id ? "text-brand-green dark:text-brand-gold" : "text-gray-700 dark:text-gray-300"
                                    )}>
                                        {cat.name}
                                    </p>
                                    {cat.description && (
                                        <p className="text-[10px] text-gray-500 line-clamp-1">{cat.description}</p>
                                    )}
                                </div>
                                {selectedCategoryId === cat.id && (
                                    <div className="w-6 h-6 bg-brand-green dark:bg-brand-gold rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white dark:text-darkBg-main" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 rounded-2xl">
                        <div className="flex gap-3">
                            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="text-amber-900 dark:text-amber-200 font-semibold font-bold">Spending Constraints Active</p>
                                <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                                    Recipient will only be able to spend this money on the selected category.{!selectedCategoryId && " Please select a category above."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    Constraints are disabled. Funds will be sent as unrestricted.
                </p>
            )}
        </div>
    );
};

export default CategorySelector;
