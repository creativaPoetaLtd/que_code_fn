'use client';

import { useState, useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import KPICard from '../KPICard';
import Table, {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableMainText,
  TableSubText,
  TableActions,
} from '../ui/Table';
import { IconButton } from '../ui/Button';
import {
  Search,
  Download,
  CreditCard,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  Ban,
  Trash2,
  RefreshCw,
  Plus,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  DollarSign,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Transaction {
  id: string;
  referenceId: string;
  senderWalletId: string;
  receiverWalletId: string;
  senderName: string;
  receiverName: string;
  amount: number;
  fee: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  type: 'transfer' | 'payment' | 'donation' | 'vote' | 'topup' | 'withdrawal';
  externalSenderName?: string;
  externalSenderProvider?:
    | 'mtn_momo'
    | 'airtel_money'
    | 'bank'
    | 'visa'
    | 'mastercard'
    | 'paypal'
    | 'other';
  description?: string;
  categoryName?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TransactionCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  transactionCount: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const mockTransactions: Transaction[] = [
  {
    id: 'TXN-001',
    referenceId: 'REF-2024-001',
    senderWalletId: 'WALLET-001',
    receiverWalletId: 'WALLET-002',
    senderName: 'Marie Lambert',
    receiverName: 'Hope Church Brussels',
    amount: 5000,
    fee: 50,
    totalAmount: 5050,
    currency: 'RWF',
    status: 'completed',
    type: 'donation',
    description: 'Monthly donation',
    categoryName: 'Religious',
    createdAt: new Date('2024-12-04T10:30:00'),
    updatedAt: new Date('2024-12-04T10:35:00'),
  },
  {
    id: 'TXN-002',
    referenceId: 'REF-2024-002',
    senderWalletId: 'WALLET-003',
    receiverWalletId: 'WALLET-004',
    senderName: 'Jean Uwimana',
    receiverName: 'Sarah Johnson',
    amount: 12500,
    fee: 125,
    totalAmount: 12625,
    currency: 'RWF',
    status: 'pending',
    type: 'transfer',
    description: 'Payment for services',
    createdAt: new Date('2024-12-04T09:15:00'),
    updatedAt: new Date('2024-12-04T09:15:00'),
  },
  {
    id: 'TXN-003',
    referenceId: 'REF-2024-003',
    senderWalletId: 'EXTERNAL',
    receiverWalletId: 'WALLET-001',
    senderName: 'External Source',
    receiverName: 'Marie Lambert',
    amount: 50000,
    fee: 0,
    totalAmount: 50000,
    currency: 'RWF',
    status: 'completed',
    type: 'topup',
    externalSenderName: 'MTN Mobile Money',
    externalSenderProvider: 'mtn_momo',
    description: 'Wallet top-up via MTN',
    createdAt: new Date('2024-12-03T16:45:00'),
    updatedAt: new Date('2024-12-03T16:47:00'),
  },
  {
    id: 'TXN-004',
    referenceId: 'REF-2024-004',
    senderWalletId: 'WALLET-002',
    receiverWalletId: 'WALLET-005',
    senderName: 'Hope Church Brussels',
    receiverName: 'Green Energy Rwanda',
    amount: 25000,
    fee: 250,
    totalAmount: 25250,
    currency: 'RWF',
    status: 'failed',
    type: 'payment',
    description: 'Solar panel installation',
    categoryName: 'Energy',
    createdAt: new Date('2024-12-02T14:20:00'),
    updatedAt: new Date('2024-12-02T14:25:00'),
  },
  {
    id: 'TXN-005',
    referenceId: 'REF-2024-005',
    senderWalletId: 'WALLET-001',
    receiverWalletId: 'EXTERNAL',
    senderName: 'Marie Lambert',
    receiverName: 'Bank Account',
    amount: 15000,
    fee: 150,
    totalAmount: 15150,
    currency: 'RWF',
    status: 'completed',
    type: 'withdrawal',
    description: 'Cash withdrawal',
    createdAt: new Date('2024-12-01T11:00:00'),
    updatedAt: new Date('2024-12-01T11:05:00'),
  },
];

const mockTransactionCategories: TransactionCategory[] = [
  {
    id: 'CAT-001',
    name: 'Religious',
    description: 'Donations and payments to religious organizations',
    isActive: true,
    transactionCount: 15,
    totalAmount: 125000,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'CAT-002',
    name: 'Transportation',
    description: 'Payments for taxi, bus, and transport services',
    isActive: true,
    transactionCount: 8,
    totalAmount: 45000,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'CAT-003',
    name: 'Energy',
    description: 'Payments for electricity, solar, and energy services',
    isActive: true,
    transactionCount: 3,
    totalAmount: 75000,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'CAT-004',
    name: 'Technology',
    description: 'Payments for software, IT services, and tech products',
    isActive: true,
    transactionCount: 12,
    totalAmount: 200000,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'CAT-005',
    name: 'Healthcare',
    description: 'Medical payments and healthcare services',
    isActive: false,
    transactionCount: 0,
    totalAmount: 0,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date(),
  },
];

export default function TransactionsSection() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'categories'>(
    'transactions'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Transaction>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Category management states
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [categorySortField, setCategorySortField] =
    useState<keyof TransactionCategory>('name');
  const [categorySortDirection, setCategorySortDirection] = useState<
    'asc' | 'desc'
  >('asc');

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = mockTransactions.filter(txn => {
      const matchesSearch =
        txn.referenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || txn.status === statusFilter;
      const matchesType = typeFilter === 'all' || txn.type === typeFilter;
      const matchesCategory =
        categoryFilter === 'all' || txn.categoryName === categoryFilter;

      return matchesSearch && matchesStatus && matchesType && matchesCategory;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [
    mockTransactions,
    searchTerm,
    statusFilter,
    typeFilter,
    categoryFilter,
    sortField,
    sortDirection,
  ]);

  // Filter and search categories
  const filteredCategories = useMemo(() => {
    let filtered = mockTransactionCategories.filter(category => {
      const matchesSearch =
        category.name
          .toLowerCase()
          .includes(categorySearchTerm.toLowerCase()) ||
        category.description
          ?.toLowerCase()
          .includes(categorySearchTerm.toLowerCase()) ||
        category.id.toLowerCase().includes(categorySearchTerm.toLowerCase());

      return matchesSearch;
    });

    // Sort categories
    filtered.sort((a, b) => {
      const aValue = a[categorySortField];
      const bValue = b[categorySortField];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return categorySortDirection === 'asc' ? -1 : 1;
      if (bValue == null) return categorySortDirection === 'asc' ? 1 : -1;

      if (categorySortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [
    mockTransactionCategories,
    categorySearchTerm,
    categorySortField,
    categorySortDirection,
  ]);

  // Pagination
  const totalPages = Math.ceil(
    (activeTab === 'transactions'
      ? filteredTransactions.length
      : filteredCategories.length) / itemsPerPage
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  const paginatedCategories = filteredCategories.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Statistics calculations
  const stats = useMemo(() => {
    const totalTransactions = mockTransactions.length;
    const completedTransactions = mockTransactions.filter(
      t => t.status === 'completed'
    ).length;
    const pendingTransactions = mockTransactions.filter(
      t => t.status === 'pending'
    ).length;
    const failedTransactions = mockTransactions.filter(
      t => t.status === 'failed'
    ).length;
    const totalVolume = mockTransactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalFees = mockTransactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.fee, 0);

    return {
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      failedTransactions,
      totalVolume,
      totalFees,
    };
  }, [mockTransactions]);

  // Category statistics calculations
  const categoryStats = useMemo(() => {
    const totalCategories = mockTransactionCategories.length;
    const activeCategories = mockTransactionCategories.filter(
      cat => cat.isActive
    ).length;
    const inactiveCategories = mockTransactionCategories.filter(
      cat => !cat.isActive
    ).length;
    const totalCategoryVolume = mockTransactionCategories.reduce(
      (sum, cat) => sum + cat.totalAmount,
      0
    );

    return {
      totalCategories,
      activeCategories,
      inactiveCategories,
      totalCategoryVolume,
    };
  }, [mockTransactionCategories]);

  const getBadgeVariant = (status: string, type?: 'status' | 'type') => {
    if (type === 'status') {
      switch (status) {
        case 'completed':
          return 'success';
        case 'pending':
          return 'warning';
        case 'failed':
          return 'danger';
        case 'cancelled':
          return 'muted';
        default:
          return 'default';
      }
    }

    if (type === 'type') {
      switch (status) {
        case 'transfer':
          return 'info';
        case 'payment':
          return 'default';
        case 'donation':
          return 'success';
        case 'vote':
          return 'warning';
        case 'topup':
          return 'info';
        case 'withdrawal':
          return 'muted';
        default:
          return 'default';
      }
    }

    return 'default';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'transfer':
        return <ArrowUpRight className='w-4 h-4' />;
      case 'payment':
        return <CreditCard className='w-4 h-4' />;
      case 'donation':
        return <CheckCircle className='w-4 h-4' />;
      case 'topup':
        return <ArrowDownLeft className='w-4 h-4' />;
      case 'withdrawal':
        return <ArrowUpRight className='w-4 h-4' />;
      case 'vote':
        return <CheckCircle className='w-4 h-4' />;
      default:
        return <CreditCard className='w-4 h-4' />;
    }
  };

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCategorySort = (field: keyof TransactionCategory) => {
    if (categorySortField === field) {
      setCategorySortDirection(
        categorySortDirection === 'asc' ? 'desc' : 'asc'
      );
    } else {
      setCategorySortField(field);
      setCategorySortDirection('asc');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setCategoryFilter('all');
    setCategorySearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div className='space-y-6'>
      {/* Tab Navigation */}
      <div className='border-b border-gray-200'>
        <nav className='-mb-px flex space-x-8'>
          <button
            onClick={() => {
              setActiveTab('transactions');
              setCurrentPage(1);
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className='flex items-center gap-2'>
              <CreditCard className='w-4 h-4' />
              Transactions ({stats.totalTransactions})
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('categories');
              setCurrentPage(1);
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className='flex items-center gap-2'>
              <Tag className='w-4 h-4' />
              Categories ({categoryStats.totalCategories})
            </div>
          </button>
        </nav>
      </div>

      {activeTab === 'transactions' ? (
        <>
          {/* Transactions Tab Content */}
          <div className='flex justify-end gap-3'>
            <Button
              variant='default'
              size='sm'
              icon={<Download className='w-4 h-4' />}
            >
              Export
            </Button>
            <Button
              variant='primary'
              size='sm'
              icon={<Plus className='w-4 h-4' />}
            >
              New Transaction
            </Button>
          </div>

          {/* Transactions Statistics Cards */}
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
            <KPICard
              title='Total Transactions'
              value={stats.totalTransactions.toLocaleString()}
              label='All transactions'
              trend={{
                direction: 'up',
                value: '+15%',
                timeframe: 'last month',
              }}
            />

            <KPICard
              title='Completed'
              value={stats.completedTransactions.toLocaleString()}
              label='Successful transactions'
              trend={{
                direction: 'up',
                value: '+18%',
                timeframe: 'last month',
              }}
            />

            <KPICard
              title='Pending'
              value={stats.pendingTransactions.toLocaleString()}
              label='Awaiting processing'
              trend={{
                direction: 'down',
                value: '-5%',
                timeframe: 'last week',
              }}
            />

            <KPICard
              title='Failed'
              value={stats.failedTransactions.toLocaleString()}
              label='Failed transactions'
              trend={{
                direction: 'down',
                value: '-10%',
                timeframe: 'last week',
              }}
            />

            <KPICard
              title='Total Volume'
              value={`${(stats.totalVolume / 1000000).toFixed(1)}M`}
              label='RWF transaction volume'
              trend={{
                direction: 'up',
                value: '+25%',
                timeframe: 'last month',
              }}
            />

            <KPICard
              title='Total Fees'
              value={stats.totalFees.toLocaleString()}
              label='RWF fees collected'
              trend={{
                direction: 'up',
                value: '+20%',
                timeframe: 'last month',
              }}
            />
          </div>

          {/* Transactions Filters and Search */}
          <Card>
            <CardContent className='p-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end'>
                {/* Search */}
                <div className='lg:col-span-2'>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>
                    Search transactions
                  </label>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                    <input
                      type='text'
                      placeholder='Reference, sender, receiver...'
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
                  >
                    <option value='all'>All Statuses</option>
                    <option value='completed'>Completed</option>
                    <option value='pending'>Pending</option>
                    <option value='failed'>Failed</option>
                    <option value='cancelled'>Cancelled</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>
                    Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
                  >
                    <option value='all'>All Types</option>
                    <option value='transfer'>Transfer</option>
                    <option value='payment'>Payment</option>
                    <option value='donation'>Donation</option>
                    <option value='vote'>Vote</option>
                    <option value='topup'>Top-up</option>
                    <option value='withdrawal'>Withdrawal</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
                  >
                    <option value='all'>All Categories</option>
                    <option value='Religious'>Religious</option>
                    <option value='Transportation'>Transportation</option>
                    <option value='Energy'>Energy</option>
                    <option value='Technology'>Technology</option>
                  </select>
                </div>

                {/* Reset Filters */}
                <div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={resetFilters}
                    icon={<RefreshCw className='w-4 h-4' />}
                    className='w-full'
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div
                          className='cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1 -m-2 p-2 rounded'
                          onClick={() => handleSort('referenceId')}
                        >
                          Reference
                          {sortField === 'referenceId' && (
                            <span className='text-xs'>
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Sender</TableHead>
                      <TableHead>Receiver</TableHead>
                      <TableHead>
                        <div
                          className='cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1 -m-2 p-2 rounded'
                          onClick={() => handleSort('amount')}
                        >
                          Amount
                          {sortField === 'amount' && (
                            <span className='text-xs'>
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <div
                          className='cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1 -m-2 p-2 rounded'
                          onClick={() => handleSort('createdAt')}
                        >
                          Date
                          {sortField === 'createdAt' && (
                            <span className='text-xs'>
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.map(txn => (
                      <TableRow key={txn.id} className='group hover:bg-gray-50'>
                        <TableCell>
                          <div>
                            <TableMainText className='font-medium font-mono text-sm'>
                              {txn.referenceId}
                            </TableMainText>
                            <TableSubText className='text-xs text-gray-500'>
                              ID: {txn.id}
                            </TableSubText>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className='text-sm font-medium'>
                              {txn.senderName}
                            </div>
                            {txn.externalSenderProvider && (
                              <div className='text-xs text-gray-500'>
                                via {txn.externalSenderProvider}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='text-sm font-medium'>
                            {txn.receiverName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className='text-sm font-medium'>
                              {txn.amount.toLocaleString()} {txn.currency}
                            </div>
                            {txn.fee > 0 && (
                              <div className='text-xs text-gray-500'>
                                Fee: {txn.fee.toLocaleString()} {txn.currency}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            {getTypeIcon(txn.type)}
                            <Badge
                              variant={getBadgeVariant(txn.type, 'type') as any}
                              size='sm'
                            >
                              {txn.type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              getBadgeVariant(txn.status, 'status') as any
                            }
                            size='sm'
                          >
                            {txn.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className='text-sm'>
                            {new Date(txn.createdAt).toLocaleDateString()}
                          </div>
                          <div className='text-xs text-gray-500'>
                            {new Date(txn.createdAt).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <TableActions>
                            <div className='relative'>
                              <IconButton
                                variant='ghost'
                                size='sm'
                                title='Actions'
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === txn.id ? null : txn.id
                                  )
                                }
                              >
                                <MoreHorizontal className='w-4 h-4' />
                              </IconButton>

                              {openMenuId === txn.id && (
                                <>
                                  <div
                                    className='fixed inset-0 z-10'
                                    onClick={() => setOpenMenuId(null)}
                                  />

                                  <div className='absolute right-0 top-8 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1'>
                                    <button
                                      className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3'
                                      onClick={() => setOpenMenuId(null)}
                                    >
                                      <Eye className='w-4 h-4 text-gray-500' />
                                      View Details
                                    </button>

                                    <button
                                      className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3'
                                      onClick={() => setOpenMenuId(null)}
                                    >
                                      <Download className='w-4 h-4 text-gray-500' />
                                      Download Receipt
                                    </button>

                                    {txn.status === 'pending' && (
                                      <>
                                        <button
                                          className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-green-600'
                                          onClick={() => setOpenMenuId(null)}
                                        >
                                          <CheckCircle className='w-4 h-4' />
                                          Approve Transaction
                                        </button>

                                        <button
                                          className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-red-600'
                                          onClick={() => setOpenMenuId(null)}
                                        >
                                          <Ban className='w-4 h-4' />
                                          Cancel Transaction
                                        </button>
                                      </>
                                    )}

                                    {txn.status === 'failed' && (
                                      <button
                                        className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-blue-600'
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        <RefreshCw className='w-4 h-4' />
                                        Retry Transaction
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </TableActions>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Categories Tab Content */}
          <div className='flex justify-end gap-3'>
            <Button
              variant='default'
              size='sm'
              icon={<Download className='w-4 h-4' />}
            >
              Export
            </Button>
            <Button
              variant='primary'
              size='sm'
              icon={<Plus className='w-4 h-4' />}
            >
              Add Category
            </Button>
          </div>

          {/* Categories Statistics Cards */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <KPICard
              title='Total Categories'
              value={categoryStats.totalCategories.toLocaleString()}
              label='Available categories'
              trend={{
                direction: 'up',
                value: '+1%',
                timeframe: 'last month',
              }}
            />

            <KPICard
              title='Active Categories'
              value={categoryStats.activeCategories.toLocaleString()}
              label='Currently in use'
              trend={{
                direction: 'up',
                value: '+2%',
                timeframe: 'last month',
              }}
            />

            <KPICard
              title='Inactive Categories'
              value={categoryStats.inactiveCategories.toLocaleString()}
              label='Disabled categories'
              trend={{
                direction: 'down',
                value: '0%',
                timeframe: 'last month',
              }}
            />

            <KPICard
              title='Total Volume'
              value={`${(categoryStats.totalCategoryVolume / 1000000).toFixed(1)}M`}
              label='RWF across categories'
              trend={{
                direction: 'up',
                value: '+15%',
                timeframe: 'last month',
              }}
            />
          </div>

          {/* Categories Search */}
          <Card>
            <CardContent className='p-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end'>
                <div className='lg:col-span-2'>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>
                    Search categories
                  </label>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                    <input
                      type='text'
                      placeholder='Name, description, or ID...'
                      value={categorySearchTerm}
                      onChange={e => setCategorySearchTerm(e.target.value)}
                      className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
                    />
                  </div>
                </div>

                <div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={resetFilters}
                    icon={<RefreshCw className='w-4 h-4' />}
                    className='w-full'
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories Table */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div
                          className='cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1 -m-2 p-2 rounded'
                          onClick={() => handleCategorySort('name')}
                        >
                          Category
                          {categorySortField === 'name' && (
                            <span className='text-xs'>
                              {categorySortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>
                        <div
                          className='cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1 -m-2 p-2 rounded'
                          onClick={() => handleCategorySort('transactionCount')}
                        >
                          Transactions
                          {categorySortField === 'transactionCount' && (
                            <span className='text-xs'>
                              {categorySortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>
                        <div
                          className='cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1 -m-2 p-2 rounded'
                          onClick={() => handleCategorySort('totalAmount')}
                        >
                          Total Volume
                          {categorySortField === 'totalAmount' && (
                            <span className='text-xs'>
                              {categorySortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCategories.map(category => (
                      <TableRow
                        key={category.id}
                        className='group hover:bg-gray-50'
                      >
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <div className='w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-medium'>
                              <Tag className='w-4 h-4' />
                            </div>
                            <div>
                              <TableMainText className='font-medium'>
                                {category.name}
                              </TableMainText>
                              <TableSubText className='text-xs text-gray-500'>
                                ID: {category.id}
                              </TableSubText>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='text-sm text-gray-600 max-w-xs'>
                            {category.description || 'No description'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant='info' size='sm'>
                            {category.transactionCount}{' '}
                            {category.transactionCount === 1 ? 'txn' : 'txns'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className='text-sm font-medium'>
                            {category.totalAmount.toLocaleString()} RWF
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={category.isActive ? 'success' : 'muted'}
                            size='sm'
                          >
                            {category.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TableActions>
                            <div className='relative'>
                              <IconButton
                                variant='ghost'
                                size='sm'
                                title='Actions'
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === category.id
                                      ? null
                                      : category.id
                                  )
                                }
                              >
                                <MoreHorizontal className='w-4 h-4' />
                              </IconButton>

                              {openMenuId === category.id && (
                                <>
                                  <div
                                    className='fixed inset-0 z-10'
                                    onClick={() => setOpenMenuId(null)}
                                  />

                                  <div className='absolute right-0 top-8 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1'>
                                    <button
                                      className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3'
                                      onClick={() => setOpenMenuId(null)}
                                    >
                                      <Eye className='w-4 h-4 text-gray-500' />
                                      View Details
                                    </button>

                                    <button
                                      className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3'
                                      onClick={() => setOpenMenuId(null)}
                                    >
                                      <Edit className='w-4 h-4 text-gray-500' />
                                      Edit Category
                                    </button>

                                    <div className='border-t border-gray-100 my-1' />

                                    {category.isActive ? (
                                      <button
                                        className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-orange-600'
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        <Ban className='w-4 h-4' />
                                        Deactivate Category
                                      </button>
                                    ) : (
                                      <button
                                        className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-green-600'
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        <CheckCircle className='w-4 h-4' />
                                        Activate Category
                                      </button>
                                    )}

                                    {category.transactionCount === 0 && (
                                      <button
                                        className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-red-600'
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        <Trash2 className='w-4 h-4' />
                                        Delete Category
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </TableActions>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Shared Pagination */}
      <div className='flex items-center justify-between mt-6 pt-4 border-t border-gray-200'>
        <div className='text-sm text-gray-500'>
          Showing{' '}
          {Math.min(
            startIndex + 1,
            activeTab === 'transactions'
              ? filteredTransactions.length
              : filteredCategories.length
          )}
          -
          {Math.min(
            startIndex + itemsPerPage,
            activeTab === 'transactions'
              ? filteredTransactions.length
              : filteredCategories.length
          )}{' '}
          of{' '}
          {activeTab === 'transactions'
            ? filteredTransactions.length
            : filteredCategories.length}{' '}
          results
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            icon={<ChevronLeft className='w-4 h-4' />}
          >
            Previous
          </Button>

          <div className='flex items-center gap-1'>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                page =>
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
              )
              .map((page, index, array) => (
                <div key={page} className='flex items-center'>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className='px-2 text-gray-400'>...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      currentPage === page
                        ? 'bg-green-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                </div>
              ))}
          </div>

          <Button
            variant='ghost'
            size='sm'
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            icon={<ChevronRight className='w-4 h-4' />}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
