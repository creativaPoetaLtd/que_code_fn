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
  Building,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  Ban,
  Trash2,
  Mail,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Tag,
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  email: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  contactPhone: string;
  tinNumber: string;
  approvalStatus: boolean;
  categoryId: string;
  categoryName: string;
  status: 'Active' | 'Suspended' | 'Pending' | 'Blocked';
  createdAt: Date;
  updatedAt: Date;
  // Computed properties
  registrationDate: string;
  approvalStatusText: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  organizationCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const mockCategories: Category[] = [
  {
    id: 'CAT-001',
    name: 'Religious Organization',
    description: 'Churches, mosques, temples and other religious institutions',
    isActive: true,
    organizationCount: 1,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'CAT-002',
    name: 'Transportation',
    description: 'Taxi unions, bus companies, logistics and transport services',
    isActive: true,
    organizationCount: 1,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'CAT-003',
    name: 'Technology',
    description: 'Software companies, tech startups, IT services',
    isActive: true,
    organizationCount: 1,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'CAT-004',
    name: 'Trading',
    description: 'Import/export, wholesale, retail trading companies',
    isActive: true,
    organizationCount: 1,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'CAT-005',
    name: 'Energy',
    description: 'Renewable energy, power generation, energy services',
    isActive: true,
    organizationCount: 1,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date(),
  },
];

const mockOrganizations: Organization[] = [
  {
    id: 'ORG-001',
    name: 'Hope Church Brussels',
    email: 'contact@hopechurch.be',
    ownerName: 'Samuel Mukamana',
    ownerPhone: '+3221234567',
    ownerEmail: 'samuel.mukamana@hopechurch.be',
    contactPhone: '+3221234567',
    tinNumber: 'BE0123456789',
    approvalStatus: true,
    categoryId: 'CAT-001',
    categoryName: 'Religious Organization',
    status: 'Active',
    createdAt: new Date('2023-11-10'),
    updatedAt: new Date(),
    registrationDate: '2023-11-10',
    approvalStatusText: 'Approved',
  },
  {
    id: 'ORG-002',
    name: 'Taxi Union X42',
    email: 'info@taxiunionx42.rw',
    ownerName: 'Jean Uwimana',
    ownerPhone: '+250788123456',
    ownerEmail: 'jean.uwimana@taxiunion.rw',
    contactPhone: '+250788123456',
    tinNumber: 'RW001234567',
    approvalStatus: false,
    categoryId: 'CAT-002',
    categoryName: 'Transportation',
    status: 'Pending',
    createdAt: new Date('2024-02-28'),
    updatedAt: new Date(),
    registrationDate: '2024-02-28',
    approvalStatusText: 'Pending',
  },
  {
    id: 'ORG-003',
    name: 'TechCorp Solutions',
    email: 'contact@techcorp.com',
    ownerName: 'Sarah Johnson',
    ownerPhone: '+15551234567',
    ownerEmail: 'sarah@techcorp.com',
    contactPhone: '+15551234567',
    tinNumber: 'US123456789',
    approvalStatus: true,
    categoryId: 'CAT-003',
    categoryName: 'Technology',
    status: 'Active',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date(),
    registrationDate: '2024-01-20',
    approvalStatusText: 'Approved',
  },
  {
    id: 'ORG-004',
    name: 'Cairo Trading Co',
    email: 'info@cairotrade.com',
    ownerName: 'Ahmed Hassan',
    ownerPhone: '+201001234567',
    ownerEmail: 'ahmed@cairotrade.com',
    contactPhone: '+201001234567',
    tinNumber: 'EG987654321',
    approvalStatus: false,
    categoryId: 'CAT-004',
    categoryName: 'Trading',
    status: 'Suspended',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date(),
    registrationDate: '2024-03-05',
    approvalStatusText: 'Rejected',
  },
  {
    id: 'ORG-005',
    name: 'Green Energy Rwanda',
    email: 'contact@greenenergy.rw',
    ownerName: 'Marie Uwimana',
    ownerPhone: '+250789654321',
    ownerEmail: 'marie@greenenergy.rw',
    contactPhone: '+250789654321',
    tinNumber: 'RW005432101',
    approvalStatus: true,
    categoryId: 'CAT-005',
    categoryName: 'Energy',
    status: 'Active',
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date(),
    registrationDate: '2024-05-15',
    approvalStatusText: 'Approved',
  },
];

export default function OrganizationsSection() {
  const [activeTab, setActiveTab] = useState<'organizations' | 'categories'>(
    'organizations'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Organization>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Category management states
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [categorySortField, setCategorySortField] =
    useState<keyof Category>('name');
  const [categorySortDirection, setCategorySortDirection] = useState<
    'asc' | 'desc'
  >('asc');

  // Filter and search organizations
  const filteredOrganizations = useMemo(() => {
    let filtered = mockOrganizations.filter(org => {
      const matchesSearch =
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.tinNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || org.status === statusFilter;
      const matchesApproval =
        approvalFilter === 'all' ||
        (approvalFilter === 'approved' && org.approvalStatus) ||
        (approvalFilter === 'pending' && !org.approvalStatus);
      const matchesCategory =
        categoryFilter === 'all' || org.categoryName === categoryFilter;

      return (
        matchesSearch && matchesStatus && matchesApproval && matchesCategory
      );
    });

    // Sort organizations
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
    mockOrganizations,
    searchTerm,
    statusFilter,
    approvalFilter,
    categoryFilter,
    sortField,
    sortDirection,
  ]);

  // Filter and search categories
  const filteredCategories = useMemo(() => {
    let filtered = mockCategories.filter(category => {
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
    mockCategories,
    categorySearchTerm,
    categorySortField,
    categorySortDirection,
  ]);

  // Pagination
  const totalPages = Math.ceil(
    (activeTab === 'organizations'
      ? filteredOrganizations.length
      : filteredCategories.length) / itemsPerPage
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrganizations = filteredOrganizations.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  const paginatedCategories = filteredCategories.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Statistics calculations
  const stats = useMemo(() => {
    const totalOrganizations = mockOrganizations.length;
    const activeOrganizations = mockOrganizations.filter(
      org => org.status === 'Active'
    ).length;
    const approvedOrganizations = mockOrganizations.filter(
      org => org.approvalStatus
    ).length;
    const pendingApproval = mockOrganizations.filter(
      org => !org.approvalStatus && org.status === 'Pending'
    ).length;
    const suspendedOrganizations = mockOrganizations.filter(
      org => org.status === 'Suspended' || org.status === 'Blocked'
    ).length;

    return {
      totalOrganizations,
      activeOrganizations,
      approvedOrganizations,
      pendingApproval,
      suspendedOrganizations,
    };
  }, [mockOrganizations]);

  // Category statistics calculations
  const categoryStats = useMemo(() => {
    const totalCategories = mockCategories.length;
    const activeCategories = mockCategories.filter(cat => cat.isActive).length;
    const inactiveCategories = mockCategories.filter(
      cat => !cat.isActive
    ).length;
    const totalOrganizationsInCategories = mockCategories.reduce(
      (sum, cat) => sum + cat.organizationCount,
      0
    );

    return {
      totalCategories,
      activeCategories,
      inactiveCategories,
      totalOrganizationsInCategories,
    };
  }, [mockCategories]);

  const getBadgeVariant = (status: string, type?: 'status' | 'approval') => {
    if (type === 'approval') {
      switch (status) {
        case 'Approved':
          return 'success';
        case 'Pending':
          return 'warning';
        case 'Rejected':
          return 'danger';
        default:
          return 'default';
      }
    }

    switch (status) {
      case 'Active':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Suspended':
        return 'warning';
      case 'Blocked':
        return 'danger';
      default:
        return 'default';
    }
  };

  const handleSort = (field: keyof Organization) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCategorySort = (field: keyof Category) => {
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
    setApprovalFilter('all');
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
              setActiveTab('organizations');
              setCurrentPage(1);
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'organizations'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className='flex items-center gap-2'>
              <Building className='w-4 h-4' />
              Organizations ({stats.totalOrganizations})
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

      {activeTab === 'organizations' ? (
        <>
          {/* Organizations Tab Content */}
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
              Add Organization
            </Button>
          </div>

          {/* Organizations Statistics Cards */}
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
            <KPICard
              title='Total Organizations'
              value={stats.totalOrganizations.toLocaleString()}
              label='Registered entities'
              trend={{
                direction: 'up',
                value: '+8%',
                timeframe: 'last month',
              }}
            />

            <KPICard
              title='Active Organizations'
              value={stats.activeOrganizations.toLocaleString()}
              label='Currently operational'
              trend={{
                direction: 'up',
                value: '+12%',
                timeframe: 'last month',
              }}
            />

            <KPICard
              title='Approved'
              value={stats.approvedOrganizations.toLocaleString()}
              label='Admin approved'
              trend={{
                direction: 'up',
                value: '+5%',
                timeframe: 'last week',
              }}
            />

            <KPICard
              title='Pending Approval'
              value={stats.pendingApproval.toLocaleString()}
              label='Awaiting review'
              trend={{
                direction: 'down',
                value: '-3%',
                timeframe: 'last week',
              }}
            />

            <KPICard
              title='Suspended'
              value={stats.suspendedOrganizations.toLocaleString()}
              label='Blocked/Suspended'
              trend={{
                direction: 'down',
                value: '-1%',
                timeframe: 'last week',
              }}
            />
          </div>

          {/* Organizations Filters and Search */}
          <Card>
            <CardContent className='p-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end'>
                {/* Search */}
                <div className='lg:col-span-2'>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>
                    Search organizations
                  </label>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                    <input
                      type='text'
                      placeholder='Name, email, TIN, or owner...'
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
                    <option value='Active'>Active</option>
                    <option value='Pending'>Pending</option>
                    <option value='Suspended'>Suspended</option>
                    <option value='Blocked'>Blocked</option>
                  </select>
                </div>

                {/* Approval Filter */}
                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>
                    Approval Status
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
                    <option value='Religious Organization'>
                      Religious Organization
                    </option>
                    <option value='Transportation'>Transportation</option>
                    <option value='Technology'>Technology</option>
                    <option value='Trading'>Trading</option>
                    <option value='Energy'>Energy</option>
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

          {/* Organizations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div
                          className='cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1 -m-2 p-2 rounded'
                          onClick={() => handleSort('name')}
                        >
                          Organization
                          {sortField === 'name' && (
                            <span className='text-xs'>
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>TIN Number</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approved</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrganizations.map(org => (
                      <TableRow key={org.id} className='group hover:bg-gray-50'>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                           
                            <div>
                              <TableMainText className='font-medium'>
                                {org.name}
                              </TableMainText>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className='text-sm font-medium'>
                              {org.ownerName}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {org.ownerEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className='text-sm'>{org.email}</div>
                            <div className='text-xs text-gray-500'>
                              {org.contactPhone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='text-sm font-mono'>
                            {org.tinNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant='info' size='sm'>
                            {org.categoryName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              getBadgeVariant(org.status, 'status') as any
                            }
                            size='sm'
                          >
                            {org.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className='text-sm font-medium'>
                            {org.approvalStatus ? 'Yes' : 'No'}
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
                                    openMenuId === org.id ? null : org.id
                                  )
                                }
                              >
                                <MoreHorizontal className='w-4 h-4' />
                              </IconButton>

                              {openMenuId === org.id && (
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
                                      View Details
                                    </button>

                                    <button
                                      className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3'
                                      onClick={() => setOpenMenuId(null)}
                                    >
                                      <Edit className='w-4 h-4 text-gray-500' />
                                      Edit Organization
                                    </button>

                                    {!org.approvalStatus && (
                                      <button
                                        className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-green-600'
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        <UserCheck className='w-4 h-4' />
                                        Approve Organization
                                      </button>
                                    )}

                                    <button
                                      className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-blue-600'
                                      onClick={() => setOpenMenuId(null)}
                                    >
                                      <Mail className='w-4 h-4' />
                                      Send Email
                                    </button>

                                    <div className='border-t border-gray-100 my-1' />

                                    {org.status === 'Active' ? (
                                      <button
                                        className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-orange-600'
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        <Ban className='w-4 h-4' />
                                        Suspend Organization
                                      </button>
                                    ) : (
                                      <button
                                        className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-green-600'
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        <CheckCircle className='w-4 h-4' />
                                        Activate Organization
                                      </button>
                                    )}

                                    <button
                                      className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-red-600'
                                      onClick={() => setOpenMenuId(null)}
                                    >
                                      <Trash2 className='w-4 h-4' />
                                      Delete Organization
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
                value: '+2%',
                timeframe: 'last month',
              }}
            />

            <KPICard
              title='Active Categories'
              value={categoryStats.activeCategories.toLocaleString()}
              label='Currently in use'
              trend={{
                direction: 'up',
                value: '+1%',
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
              title='Total Organizations'
              value={categoryStats.totalOrganizationsInCategories.toLocaleString()}
              label='Across all categories'
              trend={{
                direction: 'up',
                value: '+8%',
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
              <CardTitle>Categories</CardTitle>
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
                      <TableHead>Organizations</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <div
                          className='cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1 -m-2 p-2 rounded'
                          onClick={() => handleCategorySort('createdAt')}
                        >
                          Created
                          {categorySortField === 'createdAt' && (
                            <span className='text-xs'>
                              {categorySortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
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
                            <div>
                              <TableMainText className='font-medium'>
                                {category.name}
                              </TableMainText>
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
                            {category.organizationCount}{' '}
                            {category.organizationCount === 1 ? 'org' : 'orgs'}
                          </Badge>
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
                          <div className='text-sm text-gray-500'>
                            {new Date(category.createdAt).toLocaleDateString()}
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

                                    {category.organizationCount === 0 && (
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
            activeTab === 'organizations'
              ? filteredOrganizations.length
              : filteredCategories.length
          )}
          -
          {Math.min(
            startIndex + itemsPerPage,
            activeTab === 'organizations'
              ? filteredOrganizations.length
              : filteredCategories.length
          )}{' '}
          of{' '}
          {activeTab === 'organizations'
            ? filteredOrganizations.length
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
