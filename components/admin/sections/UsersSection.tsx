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
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Ban,
  Trash2,
  Shield,
  ShieldAlert,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  UserCheck,
  UserX,
  Building,
  CreditCard,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  UserPlus,
  FileText,
  Settings,
  MoreHorizontal,
  RefreshCw,
  Flag,
} from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isVerified: boolean;
  approvalStatus: boolean;
  isOnline: boolean;
  lastSeen: Date | null;
  hasPinSet: boolean;
  pinAttempts: number;
  pinLockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Profile data
  profileImage?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  statusMessage?: string;
  // Wallet data
  balance: number;
  currency: string;
  walletActive: boolean;
  // Derived/computed fields
  fullName: string;
  accountType: 'Individual' | 'Organization';
  verificationStatus: 'Verified' | 'Pending' | 'Rejected';
  accountStatus: 'Active' | 'Suspended' | 'Blocked' | 'Inactive';
  riskLevel: 'Low' | 'Medium' | 'High';
  location: string;
  registrationDate: string;
  lastActiveFormatted: string;
}

const mockUsers: User[] = [
  {
    id: 'U-001',
    firstName: 'Marie',
    lastName: 'Lambert',
    email: 'marie.lambert@example.com',
    phone: '+32456789012',
    isVerified: true,
    approvalStatus: true,
    isOnline: true,
    lastSeen: new Date(Date.now() - 2 * 60 * 1000),
    hasPinSet: true,
    pinAttempts: 0,
    pinLockedUntil: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    profileImage: undefined,
    province: 'Brussels',
    district: 'Brussels-City',
    sector: 'Center',
    cell: 'Sainte-Catherine',
    statusMessage: 'Available for QieCode transfers',
    balance: 25075.5,
    currency: 'RWF',
    walletActive: true,
    fullName: 'Marie Lambert',
    accountType: 'Individual',
    verificationStatus: 'Verified',
    accountStatus: 'Active',
    riskLevel: 'Low',
    location: 'Brussels, Belgium',
    registrationDate: '2024-01-15',
    lastActiveFormatted: '2 min ago',
  },
  {
    id: 'U-002',
    firstName: 'Jean',
    lastName: 'Uwimana',
    email: 'jean.uwimana@taxiunion.rw',
    phone: '+250788123456',
    isVerified: false,
    approvalStatus: false,
    isOnline: false,
    lastSeen: new Date(Date.now() - 12 * 60 * 1000),
    hasPinSet: true,
    pinAttempts: 0,
    pinLockedUntil: null,
    createdAt: new Date('2024-02-28'),
    updatedAt: new Date(),
    profileImage: undefined,
    province: 'Kigali',
    district: 'Gasabo',
    sector: 'Kimironko',
    cell: 'Biryogo',
    statusMessage: 'Taxi Union X42 Representative',
    balance: 185000.0,
    currency: 'RWF',
    walletActive: true,
    fullName: 'Jean Uwimana',
    accountType: 'Individual',
    verificationStatus: 'Pending',
    accountStatus: 'Active',
    riskLevel: 'Medium',
    location: 'Kigali, Rwanda',
    registrationDate: '2024-02-28',
    lastActiveFormatted: '12 min ago',
  },
  {
    id: 'U-003',
    firstName: 'Samuel',
    lastName: 'Mukamana',
    email: 'contact@hopechurch.be',
    phone: '+3221234567',
    isVerified: true,
    approvalStatus: true,
    isOnline: false,
    lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000),
    hasPinSet: true,
    pinAttempts: 0,
    pinLockedUntil: null,
    createdAt: new Date('2023-11-10'),
    updatedAt: new Date(),
    profileImage: undefined,
    province: 'Brussels',
    district: 'Ixelles',
    sector: 'Matonge',
    cell: 'Chaussée de Wavre',
    statusMessage: 'Hope Church Brussels - Community Outreach',
    balance: 542030.0,
    currency: 'RWF',
    walletActive: true,
    fullName: 'Samuel Mukamana',
    accountType: 'Organization',
    verificationStatus: 'Verified',
    accountStatus: 'Active',
    riskLevel: 'Low',
    location: 'Brussels, Belgium',
    registrationDate: '2023-11-10',
    lastActiveFormatted: 'Yesterday',
  },
  {
    id: 'U-004',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+256701234567',
    isVerified: false,
    approvalStatus: false,
    isOnline: false,
    lastSeen: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    hasPinSet: false,
    pinAttempts: 3,
    pinLockedUntil: new Date(Date.now() + 15 * 60 * 1000),
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date(),
    profileImage: undefined,
    province: 'Central',
    district: 'Kampala',
    sector: 'Central Division',
    cell: 'Nakasero',
    statusMessage: undefined,
    balance: 0.0,
    currency: 'RWF',
    walletActive: false,
    fullName: 'John Doe',
    accountType: 'Individual',
    verificationStatus: 'Rejected',
    accountStatus: 'Suspended',
    riskLevel: 'High',
    location: 'Kampala, Uganda',
    registrationDate: '2024-03-05',
    lastActiveFormatted: '3 days ago',
  },
  {
    id: 'U-005',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@techcorp.com',
    phone: '+15551234567',
    isVerified: true,
    approvalStatus: true,
    isOnline: false,
    lastSeen: new Date(Date.now() - 60 * 60 * 1000),
    hasPinSet: true,
    pinAttempts: 0,
    pinLockedUntil: null,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date(),
    profileImage: 'https://example.com/avatar.jpg',
    province: 'California',
    district: 'San Francisco',
    sector: 'SOMA',
    cell: 'Mission Bay',
    statusMessage: 'Tech Consultant - Available for business transfers',
    balance: 320080.0,
    currency: 'RWF',
    walletActive: true,
    fullName: 'Sarah Johnson',
    accountType: 'Individual',
    verificationStatus: 'Verified',
    accountStatus: 'Active',
    riskLevel: 'Low',
    location: 'San Francisco, USA',
    registrationDate: '2024-01-20',
    lastActiveFormatted: '1 hour ago',
  },
  {
    id: 'U-006',
    firstName: 'Ahmed',
    lastName: 'Hassan',
    email: 'a.hassan@email.com',
    phone: '+201001234567',
    isVerified: false,
    approvalStatus: false,
    isOnline: true,
    lastSeen: new Date(),
    hasPinSet: false,
    pinAttempts: 0,
    pinLockedUntil: null,
    createdAt: new Date('2024-11-15'),
    updatedAt: new Date(),
    profileImage: undefined,
    province: 'Cairo',
    district: 'New Cairo',
    sector: 'Fifth Settlement',
    cell: 'Compound Area',
    statusMessage: 'New to QieCode',
    balance: 4520.0,
    currency: 'RWF',
    walletActive: true,
    fullName: 'Ahmed Hassan',
    accountType: 'Individual',
    verificationStatus: 'Pending',
    accountStatus: 'Active',
    riskLevel: 'Medium',
    location: 'Cairo, Egypt',
    registrationDate: '2024-11-15',
    lastActiveFormatted: 'Online now',
  },
];
export default function UsersSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof User>('firstName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Filter and search users
  const filteredUsers = useMemo(() => {
    let filtered = mockUsers.filter(user => {
      const matchesSearch =
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm);

      const matchesStatus =
        statusFilter === 'all' || user.accountStatus === statusFilter;
      const matchesAccountType =
        accountTypeFilter === 'all' || user.accountType === accountTypeFilter;
      const matchesVerification =
        verificationFilter === 'all' ||
        user.verificationStatus === verificationFilter;
      const matchesApproval =
        approvalFilter === 'all' ||
        (approvalFilter === 'approved' && user.approvalStatus) ||
        (approvalFilter === 'pending' && !user.approvalStatus);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesAccountType &&
        matchesVerification &&
        matchesApproval
      );
    });

    // Sort users
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      // Handle undefined or null values
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
    mockUsers,
    searchTerm,
    statusFilter,
    accountTypeFilter,
    verificationFilter,
    approvalFilter,
    sortField,
    sortDirection,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Statistics calculations
  const stats = useMemo(() => {
    const totalUsers = mockUsers.length;
    const activeUsers = mockUsers.filter(
      u => u.accountStatus === 'Active'
    ).length;
    const verifiedUsers = mockUsers.filter(u => u.isVerified).length;
    const approvedUsers = mockUsers.filter(u => u.approvalStatus).length;
    const onlineUsers = mockUsers.filter(u => u.isOnline).length;
    const suspendedUsers = mockUsers.filter(
      u => u.accountStatus === 'Suspended' || u.accountStatus === 'Blocked'
    ).length;
    const pendingVerification = mockUsers.filter(u => !u.isVerified).length;
    const pendingApproval = mockUsers.filter(u => !u.approvalStatus).length;
    const pinLockedUsers = mockUsers.filter(
      u => u.pinLockedUntil && new Date(u.pinLockedUntil) > new Date()
    ).length;
    const totalBalance = mockUsers.reduce((sum, u) => sum + u.balance, 0);

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      approvedUsers,
      onlineUsers,
      suspendedUsers,
      pendingVerification,
      pendingApproval,
      pinLockedUsers,
      totalBalance,
    };
  }, [mockUsers]);

  const getBadgeVariant = (
    status: string | boolean,
    type?: 'verification' | 'approval' | 'account' | 'online'
  ) => {
    if (type === 'verification') {
      switch (status) {
        case 'Verified':
          return 'success';
        case 'Pending':
          return 'warning';
        case 'Rejected':
          return 'danger';
        default:
          return 'default';
      }
    }
    if (type === 'approval') {
      return status === true ? 'success' : 'warning';
    }
    if (type === 'account') {
      switch (status) {
        case 'Active':
          return 'success';
        case 'Suspended':
          return 'warning';
        case 'Blocked':
          return 'danger';
        case 'Inactive':
          return 'muted';
        default:
          return 'default';
      }
    }
    if (type === 'online') {
      return status === true ? 'success' : 'muted';
    }
    return 'default';
  };

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAccountTypeFilter('all');
    setVerificationFilter('all');
    setApprovalFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className='space-y-6'>
      
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
          icon={<UserPlus className='w-4 h-4' />}
        >
          Add User
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
        <KPICard
          title='Total Users'
          value={stats.totalUsers.toLocaleString()}
          label='Registered accounts'
          trend={{
            direction: 'up',
            value: '+12%',
            timeframe: 'last month',
          }}
        />

        <KPICard
          title='Verified Users'
          value={stats.verifiedUsers.toLocaleString()}
          label=' Users confirmed'
          trend={{
            direction: 'up',
            value: '+15%',
            timeframe: 'last month',
          }}
        />

        <KPICard
          title='Approved Users'
          value={stats.approvedUsers.toLocaleString()}
          label='Admin approved'
          trend={{
            direction: 'up',
            value: '+5%',
            timeframe: 'last week',
          }}
        />

        <KPICard
          title='Suspended'
          value={stats.suspendedUsers.toLocaleString()}
          label='Blocked/Suspended'
          trend={{
            direction: 'down',
            value: '-2%',
            timeframe: 'last week',
          }}
        />
      </div>

      {/* Advanced Filters and Search */}
      <Card>
        <CardContent className='p-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end'>
            {/* Search */}
            <div className='lg:col-span-2'>
              <label className='block text-xs font-medium text-gray-700 mb-1'>
                Search users
              </label>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                <input
                  type='text'
                  placeholder='Name, email, or ID...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1'>
                Account Status
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
              >
                <option value='all'>All Statuses</option>
                <option value='Active'>Active</option>
                <option value='Suspended'>Suspended</option>
                <option value='Blocked'>Blocked</option>
                <option value='Inactive'>Inactive</option>
              </select>
            </div>

            {/* Account Type Filter */}
            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1'>
                Account Type
              </label>
              <select
                value={accountTypeFilter}
                onChange={e => setAccountTypeFilter(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
              >
                <option value='all'>All Types</option>
                <option value='Individual'>Individual</option>
                <option value='Organization'>Organization</option>
              </select>
            </div>

            {/* Verification Filter */}
            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1'>
                Email Verification
              </label>
              <select
                value={verificationFilter}
                onChange={e => setVerificationFilter(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
              >
                <option value='all'>All Verification</option>
                <option value='Verified'>Verified</option>
                <option value='Pending'>Pending</option>
                <option value='Rejected'>Rejected</option>
              </select>
            </div>

            {/* Approval Filter */}
            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1'>
                Admin Approval
              </label>
              <select
                value={approvalFilter}
                onChange={e => setApprovalFilter(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
              >
                <option value='all'>All Approvals</option>
                <option value='approved'>Approved</option>
                <option value='pending'>Pending Approval</option>
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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div
                      className='cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1 -m-2 p-2 rounded'
                      onClick={() => handleSort('firstName')}
                    >
                      Name
                      {sortField === 'firstName' && (
                        <span className='text-xs'>
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map(user => (
                  <TableRow key={user.id} className='group hover:bg-gray-50'>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <TableMainText className='font-medium'>
                          {user.fullName}
                        </TableMainText>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm'>{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm'>{user.phone}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          getBadgeVariant(user.accountStatus, 'account') as any
                        }
                        size='sm'
                      >
                        {user.accountStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm font-medium'>
                        {user.isVerified ? 'Yes' : 'No'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm font-medium'>
                        {user.approvalStatus ? 'Yes' : 'No'}
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
                                openMenuId === user.id ? null : user.id
                              )
                            }
                          >
                            <MoreHorizontal className='w-4 h-4' />
                          </IconButton>

                          {openMenuId === user.id && (
                            <>
                              {/* Backdrop */}
                              <div
                                className='fixed inset-0 z-10'
                                onClick={() => setOpenMenuId(null)}
                              />

                              {/* Dropdown Menu */}
                              <div className='absolute right-0 top-8 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1'>
                                <button
                                  className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3'
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  <Eye className='w-4 h-4 text-gray-500' />
                                  View Profile
                                </button>

                                <button
                                  className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3'
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  <Edit className='w-4 h-4 text-gray-500' />
                                  Edit User
                                </button>

                                {!user.approvalStatus && (
                                  <button
                                    className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-green-600'
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <UserCheck className='w-4 h-4' />
                                    Approve User
                                  </button>
                                )}

                                {!user.isVerified && (
                                  <button
                                    className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-blue-600'
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <Mail className='w-4 h-4' />
                                    Resend Verification
                                  </button>
                                )}

                                <div className='border-t border-gray-100 my-1' />

                                {user.accountStatus === 'Active' ? (
                                  <button
                                    className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-orange-600'
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <Ban className='w-4 h-4' />
                                    Suspend User
                                  </button>
                                ) : (
                                  <button
                                    className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-green-600'
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <UserCheck className='w-4 h-4' />
                                    Activate User
                                  </button>
                                )}

                                <button
                                  className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-red-600'
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  <Trash2 className='w-4 h-4' />
                                  Delete User
                                </button>
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

          {/* Pagination */}
          <div className='flex items-center justify-between mt-6 pt-4 border-t border-gray-200'>
            <div className='text-sm text-gray-500'>
              Showing {Math.min(startIndex + 1, filteredUsers.length)}-
              {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of{' '}
              {filteredUsers.length} results
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
        </CardContent>
      </Card>
    </div>
  );
}
