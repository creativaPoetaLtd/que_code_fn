'use client'
import React, { useMemo, useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { DateRange } from '@/types/analytics.types'
import { useAnalyticsPeriodSummary, usePeriodTransactions } from '@/hooks/use-analytics'
import { RecentTransaction } from '@/types/analytics.types'
import moment from 'moment'
import { useUserInfo } from '@/hooks/use-user-info'

type ViewType = 'daily' | 'weekly' | 'monthly' | 'yearly'

interface TransactionTableProps {
    dateRange: DateRange
    activeView?: ViewType
}

interface TableRow {
    period: string
    date: string
    startingBalance: number
    income: number
    expenses: number
    endingBalance: number
}

interface Transaction {
    id: string
    time: string
    description: string
    amount: number
    type: 'income' | 'expense'
    balanceBefore: number
    balanceAfter: number
    category?: string
}

/**
 * Calculate running balance for transactions
 * Accumulates income/expenses to show balance before and after each transaction
 * @param transactions - Array of RecentTransaction objects sorted chronologically
 * @param startingBalance - Initial balance at the beginning of the period (default: 0)
 * @returns Array of Transaction objects with calculated balances
 */
const calculateTransactionBalances = (
    transactions: RecentTransaction[],
    startingBalance: number = 0
): Transaction[] => {
    let runningBalance = startingBalance;

    return transactions.map((txn) => {
        const balanceBefore = runningBalance;
        
        // Calculate new balance based on transaction type
        if (txn.type === 'sent') {
            runningBalance -= txn.amount;
        } else if (txn.type === 'received') {
            runningBalance += txn.amount;
        }
        
        const balanceAfter = runningBalance;

        return {
            id: txn.id,
            time: new Date(txn.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }),
            description: txn.description || 'Transaction',
            amount: txn.amount,
            type: txn.type === 'sent' ? 'expense' : 'income',
            balanceBefore,
            balanceAfter,
            category: txn.category?.name
        };
    });
};

const ITEMS_PER_PAGE = 5

const TransactionTable: React.FC<TransactionTableProps> = ({ dateRange, activeView: initialView }) => {
    // State for drilldown view, pagination, and tab selection
    const [selectedPeriod, setSelectedPeriod] = useState<TableRow | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedTab, setSelectedTab] = useState<'daily' | 'weekly' | 'monthly'>(
        (initialView === 'daily' || initialView === 'weekly' || initialView === 'monthly') ? initialView : 'daily'
    )
    
    // Get user info
    const { userId, isAuthenticated } = useUserInfo()

    // Call hooks at top level (unconditionally)
    // Use selectedTab as the active view
    const apiInterval = selectedTab
    
    // Fetch period summary from backend with accurate historical balances
    const { data: periodSummaryData, loading, error } = useAnalyticsPeriodSummary(
        dateRange,
        apiInterval as 'daily' | 'weekly' | 'monthly'
    )
    
    // Use useMemo to prevent creating new Date objects on every render (which would trigger infinite loop)
    const periodStartDate = useMemo(() => 
        selectedPeriod ? new Date(selectedPeriod.date) : null,
        [selectedPeriod?.date]
    )
    const periodEndDate = useMemo(() => 
        selectedPeriod ? new Date(new Date(selectedPeriod.date).getTime() + 24 * 60 * 60 * 1000) : null,
        [selectedPeriod?.date]
    )
    const { data: periodTransactions, loading: txnLoading, error: txnError } = usePeriodTransactions(
        periodStartDate,
        periodEndDate,
        200
    )

    // Define getPeriodLabel before using it
    const getPeriodLabel = (date: string, view: ViewType): string => {
        const d = moment(date)
        switch (view) {
            case 'daily':
                return d.format('MMM DD, YYYY')
            case 'weekly':
                return `Week ${d.week()} (${d.startOf('week').format('MMM DD')} - ${d.endOf('week').format('MMM DD')})`
            case 'monthly':
                return d.format('MMMM YYYY')
            case 'yearly':
                return d.format('YYYY')
            default:
                return d.format('MMM DD, YYYY')
        }
    }

    const tableData = useMemo(() => {
        if (!periodSummaryData || !periodSummaryData.periods || periodSummaryData.periods.length === 0) return []

        // Backend already calculates accurate historical balances
        // Just map them to our TableRow format
        return periodSummaryData.periods.map((period: any) => ({
            period: getPeriodLabel(period.date, selectedTab),
            date: period.date,
            startingBalance: period.startingBalance,
            income: period.income,
            expenses: period.expenses,
            endingBalance: period.endingBalance
        }))
    }, [periodSummaryData, selectedTab])

    const totals = useMemo(() => {
        if (tableData.length === 0) {
            return { income: 0, expenses: 0, endingBalance: 0 }
        }
        return {
            income: tableData.reduce((sum: number, row: TableRow) => sum + row.income, 0),
            expenses: tableData.reduce((sum: number, row: TableRow) => sum + row.expenses, 0),
            endingBalance: tableData[tableData.length - 1]?.endingBalance || 0
        }
    }, [tableData])

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    // Calculate transactions for detail view (must be at top level, before any returns)
    const transactions = useMemo(() => {
        if (!selectedPeriod || !periodTransactions || periodTransactions.length === 0) return []
        return calculateTransactionBalances(periodTransactions, selectedPeriod.startingBalance)
    }, [periodTransactions, selectedPeriod])

    // Pagination calculations
    const totalPages = Math.ceil(tableData.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const paginatedData = tableData.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    if (loading) {
        return (
            <Card className="p-6 dark:bg-darkBg-card">
                <div className="space-y-4">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
                    <div className="overflow-x-auto">
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="p-6 text-center text-red-600 dark:text-red-400 dark:bg-darkBg-card">
                <p>Error loading transaction data</p>
            </Card>
        )
    }

    if (tableData.length === 0) {
        return (
            <Card className="p-6 text-center text-gray-500 dark:text-gray-400 dark:bg-darkBg-card">
                <p>No transaction data available for the selected period</p>
            </Card>
        )
    }

    // ===== DETAIL VIEW =====
    if (selectedPeriod) {
        // Handle loading state
        if (txnLoading) {
            return (
                <Card className="p-6 dark:bg-darkBg-card">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => setSelectedPeriod(null)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Loading transactions...</h3>
                    </div>
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                        ))}
                    </div>
                </Card>
            )
        }

        // Handle error state
        if (txnError) {
            return (
                <Card className="p-6 dark:bg-darkBg-card">
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={() => setSelectedPeriod(null)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <div>
                            <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Error loading transactions</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{txnError}</p>
                        </div>
                    </div>
                </Card>
            )
        }

        return (
            <Card className="p-4 lg:p-6 dark:bg-darkBg-card">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSelectedPeriod(null)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <div>
                            <h3 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white">
                                Transaction Details - {selectedPeriod.period}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Final Balance: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedPeriod.endingBalance)}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Transactions List */}
                {transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>No transactions found for this period</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((transaction: Transaction) => (
                            <div
                                key={transaction.id}
                                className={`border-l-4 rounded-lg p-4 ${
                                    transaction.type === 'income'
                                        ? 'border-l-green-500 bg-green-50 dark:bg-green-900/30'
                                        : 'border-l-red-500 bg-red-50 dark:bg-red-900/30'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-sm font-bold ${
                                                transaction.type === 'income'
                                                    ? 'text-green-700 dark:text-green-400'
                                                    : 'text-red-700 dark:text-red-400'
                                            }`}>
                                                {transaction.time}
                                            </span>
                                            {transaction.category && (
                                                <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                                    {transaction.category}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                                    </div>
                                    <div className={`text-right font-bold ${
                                        transaction.type === 'income'
                                            ? 'text-green-700 dark:text-green-400'
                                            : 'text-red-700 dark:text-red-400'
                                    }`}>
                                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                    </div>
                                </div>

                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    Balance: {formatCurrency(transaction.balanceBefore)} → {formatCurrency(transaction.balanceAfter)}
                                </div>

                                {transaction.id && (
                                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                        ID: {transaction.id}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary Footer */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-darkBorder-light">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 mb-1">Total Income</p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                +{formatCurrency(selectedPeriod.income)}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 mb-1">Total Expenses</p>
                            <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                -{formatCurrency(selectedPeriod.expenses)}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        )
    }

    // ===== SUMMARY VIEW =====
    return (
        <div className="space-y-4">
            {/* Tabs for View Selection */}
            <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setSelectedTab(tab)
                            setCurrentPage(1) // Reset pagination when changing tabs
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            selectedTab === tab
                                ? 'bg-blue-600 dark:bg-blue-700 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            <Card className="p-0 overflow-hidden border border-gray-200 dark:border-darkBorder-light dark:bg-darkBg-card">
                {/* Header Section */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-darkBorder-light bg-white dark:bg-darkBg-card">
                    <h3 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white">
                        {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} View
                    </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Balance flow for each period</p>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-darkBorder-light bg-gray-50 dark:bg-gray-900/40">
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">
                                Period
                            </th>
                            <th className="text-right py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">
                                Starting Balance
                            </th>
                            <th className="text-right py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">
                                Income
                            </th>
                            <th className="text-right py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">
                                Expenses
                            </th>
                            <th className="text-right py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">
                                Ending Balance
                            </th>
                            <th className="text-center py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row: TableRow, index: number) => (
                            <tr
                                key={index}
                                className="border-b border-gray-100 dark:border-darkBorder-light hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
                            >
                                <td className="py-4 px-6 text-gray-900 dark:text-white font-medium">{row.period}</td>
                                <td className="py-4 px-6 text-right text-gray-700 dark:text-gray-300">
                                    {formatCurrency(row.startingBalance)}
                                </td>
                                <td className="py-4 px-6 text-right text-green-600 dark:text-green-400 font-semibold">
                                    +{formatCurrency(row.income)}
                                </td>
                                <td className="py-4 px-6 text-right text-red-600 dark:text-red-400 font-semibold">
                                    -{formatCurrency(row.expenses)}
                                </td>
                                <td className="py-4 px-6 text-right font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(row.endingBalance)}
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <button
                                        onClick={() => setSelectedPeriod(row)}
                                        className="px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Total Row - Below Table */}
                <div className="border-t-2 border-gray-300 dark:border-darkBorder-medium bg-gray-50 dark:bg-gray-900/40 px-6 py-4">
                    <div className="grid grid-cols-6 gap-4 text-sm">
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">Total</p>
                        </div>
                        <div className="text-right">-</div>
                        <div className="text-right">
                            <p className="text-green-600 dark:text-green-400 font-bold">+{formatCurrency(totals.income)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-red-600 dark:text-red-400 font-bold">-{formatCurrency(totals.expenses)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-900 dark:text-white font-bold">{formatCurrency(totals.endingBalance)}</p>
                        </div>
                        <div></div>
                    </div>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-darkBorder-light bg-white dark:bg-darkBg-card flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing <span className="font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                        <span className="font-semibold">
                            {Math.min(currentPage * ITEMS_PER_PAGE, tableData.length)}
                        </span>{' '}
                        of <span className="font-semibold">{tableData.length}</span> entries
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-md border border-gray-300 dark:border-darkBorder-light text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        currentPage === page
                                            ? 'bg-blue-600 dark:bg-blue-700 text-white'
                                            : 'border border-gray-300 dark:border-darkBorder-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/40'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-md border border-gray-300 dark:border-darkBorder-light text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden">
                <div className="divide-y divide-gray-200 dark:divide-darkBorder-light">
                    {paginatedData.map((row: TableRow, index: number) => (
                        <div key={index} className="p-4 space-y-3 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                            <div className="font-semibold text-gray-900 dark:text-white text-sm">{row.period}</div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400 mb-1">Starting Balance</div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(row.startingBalance)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400 mb-1">Ending Balance</div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(row.endingBalance)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400 mb-1">Income</div>
                                    <div className="font-medium text-green-600 dark:text-green-400">
                                        +{formatCurrency(row.income)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400 mb-1">Expenses</div>
                                    <div className="font-medium text-red-600 dark:text-red-400">
                                        -{formatCurrency(row.expenses)}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedPeriod(row)}
                                className="w-full px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                            >
                                View Details
                            </button>
                        </div>
                    ))}
                </div>

                {/* Mobile Totals */}
                <div className="border-t-2 border-gray-300 dark:border-darkBorder-medium bg-gray-50 dark:bg-gray-900/40 p-4 space-y-3">
                    <div className="font-bold text-gray-900 dark:text-white text-sm">Total</div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                            <div className="text-gray-600 dark:text-gray-400 mb-1">Total Income</div>
                            <div className="font-bold text-green-600 dark:text-green-400">
                                +{formatCurrency(totals.income)}
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-600 dark:text-gray-400 mb-1">Total Expenses</div>
                            <div className="font-bold text-red-600 dark:text-red-400">
                                -{formatCurrency(totals.expenses)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Pagination */}
                <div className="border-t border-gray-200 dark:border-darkBorder-light bg-white dark:bg-darkBg-card p-4 flex items-center justify-between">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-md border border-gray-300 dark:border-darkBorder-light text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        Page {currentPage} of {totalPages}
                    </div>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-md border border-gray-300 dark:border-darkBorder-light text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </Card>
        </div>
    )
}

export default TransactionTable
