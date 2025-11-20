'use client'
import React, { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, X } from 'lucide-react'
import { RecentTransaction } from '@/types/analytics.types'
import { useCategoryTransactions } from '@/hooks/use-analytics'
import { DateRange } from '@/types/analytics.types'
import moment from 'moment'

interface CategoryTransactionPopoverProps {
    categoryId: string | null
    categoryName: string
    dateRange: DateRange
    transactionCount: number
    children: React.ReactNode
}

const CategoryTransactionPopover: React.FC<CategoryTransactionPopoverProps> = ({
    categoryId,
    categoryName,
    dateRange,
    transactionCount,
    children
}) => {
    const { data: transactions, loading, error } = useCategoryTransactions(
        categoryId,
        dateRange,
        8 // Show up to 8 transactions in popover
    )
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const formatDate = (dateString: string): string => {
        return moment(dateString).format('MMM D')
    }

    const getCategoryIcon = (categoryName?: string): string => {
        const icons: Record<string, string> = {
            'Food': '🍔',
            'Transportation': '🚗',
            'Shopping': '🛍️',
            'Entertainment': '🎬',
            'Health': '⚕️',
            'Utilities': '💡',
            'Groceries': '🛒',
            'Dining': '🍽️',
            'Travel': '✈️',
            'Other': '📍'
        }

        if (!categoryName) return '📍'

        const match = Object.keys(icons).find(key =>
            categoryName.toLowerCase().includes(key.toLowerCase()) ||
            key.toLowerCase().includes(categoryName.toLowerCase())
        )

        return match ? icons[match] : icons['Other']
    }

    const getOtherPartyName = (transaction: RecentTransaction): string => {
        const { firstName, lastName } = transaction.otherParty;
        if (firstName && lastName) {
            return `${firstName} ${lastName}`;
        }
        return transaction.otherParty.userId || 'Unknown User';
    }

    const TransactionContent = () => (
        <Card className="shadow-lg border max-w-sm w-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryIcon(categoryName)}</span>
                        <h3 className="font-semibold text-gray-900">{categoryName}</h3>
                    </div>
                    <Dialog.Close asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <X className="h-4 w-4" />
                        </Button>
                    </Dialog.Close>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                    {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto">
                {loading ? (
                    // Enhanced loading skeleton
                    <div className="p-4 space-y-3">
                        <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-sm text-gray-600">Loading transactions...</span>
                        </div>
                        {[...Array(2)].map((_, index) => (
                            <div key={index} className="animate-pulse">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    // Enhanced error state
                    <div className="p-6 text-center text-red-600">
                        <div className="text-red-500 mb-2 text-lg">⚠️</div>
                        <p className="text-sm font-medium mb-1">Unable to load transactions</p>
                        <p className="text-xs text-gray-500">Please try again later</p>
                    </div>
                ) : transactions && transactions.length > 0 ? (
                    // Transaction list with enhanced styling
                    <div className="p-2">
                        {transactions.map((transaction, index) => (
                            <div
                                key={transaction.id}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group animate-in slide-in-from-left-2 duration-300"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-900 transition-colors">
                                        {getOtherPartyName(transaction)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatDate(transaction.createdAt)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-red-600 group-hover:text-red-700 transition-colors">
                                        -{formatCurrency(transaction.amount)}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Enhanced View All button */}
                        {transactionCount > 8 && (
                            <div className="p-3 border-t border-gray-100">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200"
                                    onClick={() => {
                                        // TODO: Navigate to detailed transaction view
                                        setIsDialogOpen(false)
                                    }}
                                >
                                    View All {transactionCount} Transactions
                                    <ArrowUpRight className="w-3 h-3 ml-1" />
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    // Enhanced empty state
                    <div className="p-8 text-center text-gray-500">
                        <div className="text-2xl mb-2">📊</div>
                        <p className="text-sm font-medium mb-1">No transactions found</p>
                        <p className="text-xs">Try adjusting your date range</p>
                    </div>
                )}
            </div>
        </Card>
    )

    // Always use Dialog for click-to-open (no hover)
    return (
        <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Dialog.Trigger asChild>
                <div role="button" tabIndex={0} aria-label={`View transactions for ${categoryName}`}>
                    {children}
                </div>
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200" />
                <Dialog.Content
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in zoom-in-95 duration-200 max-w-md w-full mx-4"
                    aria-describedby={`transactions-for-${categoryName.replace(/\s+/g, '-').toLowerCase()}`}
                >
                    <TransactionContent />
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default CategoryTransactionPopover