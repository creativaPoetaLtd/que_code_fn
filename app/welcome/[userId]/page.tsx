'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input, Button } from 'antd';
import {
  User,
  Heart,
  Sparkles,
  Star,
  Gift,
  DollarSign,
  CreditCard,
  Coins,
  Banknote,
  Wallet,
  Instagram,
  Facebook,
  Twitter,
  Mail,
  MessageSquare,
  Plus,
  Ticket,
  Calendar,
  Clock,
  ChevronRight,
  Loader2,
  Scan,
  QrCode,
  Phone,
} from 'lucide-react';
import axios from 'axios';
import baseUrl from '@/helpers/baseUrl';
import Navigation from '@/components/Navigation';
import { Header } from '@/components/Header';
import { useUserInfo } from '@/hooks/use-user-info';
import { useAuthToken } from '@/hooks/use-auth-token';
import { toast } from '@/hooks/use-toast';
import { Button as CustomButton } from '@/components/ui/button';
import { Input as CustomInput } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface UserData {
  name?: string;
  profileImage?: string;
  avatar?: string;
  phone?: string;
  statusMessage?: string;
  showPhoneOnWelcome?: boolean;
  showProfileImageOnWelcome?: boolean;
  showStatusMessageOnWelcome?: boolean;
  // Additional profile fields from settings
  profileType?: 'individual' | 'organization';
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  tinNumber?: string;
  logo?: string;
  operationalDocument?: string;
  // Category information for organizations
  categoryId?: string;
  categoryName?: string;
  categoryDescription?: string;
  // New visibility controls
  showProfileTypeOnWelcome?: boolean;
  showLocationOnWelcome?: boolean;
  showTinOnWelcome?: boolean;
  showLogoOnWelcome?: boolean;
  showCategoryOnWelcome?: boolean;
}

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

interface Action {
  id: string;
  organizationId: string;
  type: string;
  name: string;
  slug: string;
  displayLayout: string;
  coverImage: string | null;
  shortDescription: string | null;
  description: string | null;
  currency: string;
  taxProfileId: string | null;
  pricing: {
    mode: string;
  };
  availability: {
    endsAt: string | null;
    startsAt: string | null;
    timezone: string | null;
    userQuota: number | null;
    salesWindow: {
      until: string | null;
    } | null;
  };
  visibility: {
    mode: string;
  };
  buyerFields: string[];
  fulfillment: {
    objectType: string;
    storeOnBuyerQR: boolean;
    postPurchaseMessage: string | null;
  };
  policy: {
    refund: string | null;
    tosUrl: string | null;
    cancellation: string | null;
  };
  webhooks: {
    onCheckout: string | null;
    onScanValid: string | null;
  };
  customFields: Record<string, any>;
  status: string;
  dedicatedQrCode: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SubAction {
  id: string;
  actionId: string;
  name: string;
  description: string | null;
  price: string;
  stock: number | null;
  stockReserved: number;
  variants: Record<string, any>;
  metadata: Record<string, any>;
  isActive: boolean;
  sortOrder: number;
  coverImage?: string | null;
  dedicatedQrCodeData?: string | null;
  createdAt: string;
  updatedAt: string;
}

const WelcomeProfilePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [user, setUser] = useState<UserData>({});
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contactForm, setContactForm] = useState<ContactFormData>({
    name: '',
    email: '',
    message: '',
  });
  const { isAuthenticated, userId: currentUserId, accountType } = useUserInfo();
  const { getToken } = useAuthToken();
  const isLoggedIn = isAuthenticated;
  const isLoggedInAsOrganization = accountType === 'organization';

  // Add a state to track if hydration is complete
  const [isHydrated, setIsHydrated] = useState(false);

  // Actions state
  const [actions, setActions] = useState<Action[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [subActions, setSubActions] = useState<SubAction[]>([]);
  const [subActionsLoading, setSubActionsLoading] = useState(false);
  const [isSubActionsModalOpen, setIsSubActionsModalOpen] = useState(false);

  // Purchase state
  const [purchaseData, setPurchaseData] = useState<Record<string, { quantity: number; buyerData: Record<string, string>; customAmount?: number }>>({});
  const [purchasing, setPurchasing] = useState<Record<string, boolean>>({});
  const [purchaseError, setPurchaseError] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // (Remove the useEffect that redirects logged-in users to their home page)

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setError('No user ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const userUrl = `${baseUrl}/users/${userId}`;
        const organizationUrl = `${baseUrl}/organizations/${userId}`;

        const [userRes, organizationRes] = await Promise.allSettled([
          axios.get(userUrl, { headers }),
          axios.get(organizationUrl, { headers }),
        ]);

        let data: any = {};
        let profile: any = {};
        let isOrganization = false;
        let effectiveUserId = userId;
        let effectiveOrganizationId = '';

        // Check if user data was successful
        if (userRes.status === 'fulfilled') {
          data = userRes.value.data;
          effectiveUserId = userId;
          effectiveOrganizationId = '';
        } else if (organizationRes.status === 'fulfilled') {
          // If user failed but organization succeeded, use organization data
          data = organizationRes.value.data;
          isOrganization = true;
          effectiveUserId = '';
          effectiveOrganizationId = userId;
        } else {
          const userErr = userRes.reason;
          const orgErr = organizationRes.reason;
        }

        // Now fetch profile with correct parameters
        const profileUrl = `${baseUrl}/profiles?userId=${encodeURIComponent(effectiveUserId)}&organizationId=${encodeURIComponent(effectiveOrganizationId)}`;

        try {
          const profileRes = await axios.get(profileUrl, { headers });
          profile = profileRes.data;
        } catch (profileError) {
          profile = {
            profileImage: '',
            statusMessage: '',
            showPhoneOnWelcome: true,
            showProfileImageOnWelcome: true,
            showStatusMessageOnWelcome: true,
          };
        }

        let name = '';
        if (isOrganization) {
          // For organizations, use the organization name
          name = data.name || 'Organization';
        } else {
          // For users, use first name and last name
          if (data.firstName || data.lastName) {
            name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
          } else if (data.name) {
            name = data.name;
          } else if (data.username) {
            name = data.username;
          } else if (data.displayName) {
            name = data.displayName;
          } else {
            name = 'User';
          }
        }

        setUser({
          name,
          profileImage: profile.profileImage || '',
          avatar: data.avatar || data.photo || data.profilePicture || '',
          phone: isOrganization
            ? data.contactPhone || ''
            : data.phone || data.phoneNumber || data.mobile || '',
          statusMessage: profile.statusMessage || '',
          showPhoneOnWelcome:
            profile.showPhoneOnWelcome !== undefined
              ? profile.showPhoneOnWelcome
              : true,
          showProfileImageOnWelcome:
            profile.showProfileImageOnWelcome !== undefined
              ? profile.showProfileImageOnWelcome
              : true,
          showStatusMessageOnWelcome:
            profile.showStatusMessageOnWelcome !== undefined
              ? profile.showStatusMessageOnWelcome
              : true,
          // Additional profile fields
          profileType: isOrganization
            ? 'organization'
            : profile.type || 'individual',
          province: profile.province || '',
          district: profile.district || '',
          sector: profile.sector || '',
          cell: profile.cell || '',
          tinNumber: profile.tinNumber || '',
          logo: profile.logo || '',
          operationalDocument: profile.operationalDocument || '',
          // Category information for organizations
          categoryId: isOrganization ? data.categoryId || '' : '',
          categoryName: isOrganization ? data.Category?.name || '' : '',
          categoryDescription: isOrganization
            ? data.Category?.description || ''
            : '',
          // New visibility controls
          showProfileTypeOnWelcome:
            profile.showProfileTypeOnWelcome !== undefined
              ? profile.showProfileTypeOnWelcome
              : true,
          showLocationOnWelcome:
            profile.showLocationOnWelcome !== undefined
              ? profile.showLocationOnWelcome
              : true,
          showTinOnWelcome:
            profile.showTinOnWelcome !== undefined
              ? profile.showTinOnWelcome
              : true,
          showLogoOnWelcome:
            profile.showLogoOnWelcome !== undefined
              ? profile.showLogoOnWelcome
              : true,
          showCategoryOnWelcome:
            profile.showCategoryOnWelcome !== undefined
              ? profile.showCategoryOnWelcome
              : true,
        });
        setLoading(false);
      } catch (error) {
        setUser({
          name: 'User',
          profileImage: '',
          avatar: '',
          phone: '',
          statusMessage: '',
          showPhoneOnWelcome: true,
          showProfileImageOnWelcome: true,
          showStatusMessageOnWelcome: true,
          // Additional profile fields with defaults
          profileType: 'individual',
          province: '',
          district: '',
          sector: '',
          cell: '',
          tinNumber: '',
          logo: '',
          operationalDocument: '',
          // Category information with defaults
          categoryId: '',
          categoryName: '',
          categoryDescription: '',
          // New visibility controls with defaults
          showProfileTypeOnWelcome: true,
          showLocationOnWelcome: true,
          showTinOnWelcome: true,
          showLogoOnWelcome: true,
          showCategoryOnWelcome: true,
        });
        setError(
          `Could not load profile data for user ID: ${userId.substring(0, 8)}...`
        );
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, getToken]);

  // Fetch actions for organizations
  useEffect(() => {
    const fetchActions = async () => {
      if (user.profileType !== 'organization' || !userId) {
        return;
      }

      try {
        setActionsLoading(true);
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const actionsUrl = `${baseUrl}/organizations/${userId}/actions/public`;

        const response = await axios.get(actionsUrl, { headers });

        if (response.data.success && response.data.data) {
          setActions(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching actions:', error);
        setActions([]);
      } finally {
        setActionsLoading(false);
      }
    };

    if (user.profileType === 'organization' && !loading) {
      fetchActions();
    }
  }, [user.profileType, userId, loading, getToken]);

  // Fetch sub-actions when an action is selected
  const fetchSubActions = async (actionId: string) => {
    try {
      setSubActionsLoading(true);
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const subActionsUrl = `${baseUrl}/actions/${actionId}/sub-actions`;

      const response = await axios.get(subActionsUrl, { headers });

      if (response.data && response.data.data) {
        // Force state update by creating a new array reference
        setSubActions([...response.data.data]);
      } else if (response.data) {
        // Handle case where data is directly in response.data
        setSubActions(Array.isArray(response.data) ? [...response.data] : []);
      }
    } catch (error) {
      console.error('Error fetching sub-actions:', error);
      setSubActions([]);
    } finally {
      setSubActionsLoading(false);
    }
  };

  const handleActionClick = async (action: Action) => {
    setSelectedAction(action);
    setIsSubActionsModalOpen(true);
    await fetchSubActions(action.id);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatPrice = (price: string, currency: string) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    return `${currency} ${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handlePurchase = async (subAction: SubAction) => {
    if (!selectedAction) return;

    const data = purchaseData[subAction.id];
    if (!data || !data.quantity || data.quantity <= 0) {
      setPurchaseError(prev => ({
        ...prev,
        [subAction.id]: 'Please enter a valid quantity',
      }));
      return;
    }

    // Validate userQuota
    const userQuota = selectedAction.availability.userQuota;
    if (userQuota && data.quantity > userQuota) {
      setPurchaseError(prev => ({
        ...prev,
        [subAction.id]: `Maximum quantity allowed is ${userQuota}`,
      }));
      return;
    }

    // Validate stock availability
    if (subAction.stock !== null && data.quantity > subAction.stock) {
      setPurchaseError(prev => ({
        ...prev,
        [subAction.id]: `Only ${subAction.stock} items available`,
      }));
      return;
    }

    // Validate buyer data - check configured buyer fields or defaults
    const requiredFields = selectedAction.buyerFields && selectedAction.buyerFields.length > 0 
      ? selectedAction.buyerFields.filter(f => f !== 'notes') 
      : ['fullName', 'email', 'phone'];

    const missingFields = requiredFields.filter(field => !data.buyerData?.[field]?.trim());
    if (missingFields.length > 0) {
      const fieldNames = missingFields
        .map(f => {
          const labels: Record<string, string> = {
            fullName: 'Full Name',
            firstName: 'First Name',
            lastName: 'Last Name',
            email: 'Email',
            phone: 'Phone',
            phoneNumber: 'Phone Number',
            address: 'Address',
            city: 'City',
            country: 'Country',
            zipCode: 'Zip Code',
            postalCode: 'Postal Code',
            idNumber: 'ID Number',
            companyName: 'Company Name',
            taxId: 'Tax ID',
          };
          return labels[f] || f;
        })
        .join(', ');
      setPurchaseError(prev => ({ ...prev, [subAction.id]: `Please fill in: ${fieldNames}` }));
      return;
    }

    try {
      setPurchasing(prev => ({ ...prev, [subAction.id]: true }));
      setPurchaseError(prev => ({ ...prev, [subAction.id]: '' }));

      const token = getToken();
      if (!token) {
        setPurchaseError(prev => ({
          ...prev,
          [subAction.id]: 'Please login to purchase',
        }));
        setPurchasing(prev => ({ ...prev, [subAction.id]: false }));
        return;
      }

      if (!currentUserId) {
        setPurchaseError(prev => ({
          ...prev,
          [subAction.id]: 'User ID not found. Please login again.',
        }));
        setPurchasing(prev => ({ ...prev, [subAction.id]: false }));
        return;
      }

      const purchaseUrl = `${baseUrl}/actions/${selectedAction.id}/purchase`;
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const requestBody: any = {
        subActionId: subAction.id,
        quantity: data.quantity,
        buyerId: currentUserId,
        buyerData: data.buyerData
      };

      // For pay_what_you_want pricing, add custom amount
      if (selectedAction?.pricing?.mode === 'pay_what_you_want') {
        requestBody.amount = data.customAmount || 0;
      }

      const response = await axios.post(purchaseUrl, requestBody, { headers });

      if (response.data) {
        // Build toast description with post-purchase message if available
        let description = `You have successfully purchased ${data.quantity} ${data.quantity === 1 ? 'item' : 'items'} of ${subAction.name}.`;
        
        if (selectedAction?.fulfillment?.postPurchaseMessage) {
          description += `\n\n${selectedAction.fulfillment.postPurchaseMessage}`;
        }
        
        toast({
          title: "Purchase Successful!",
          description,
        });

        // Reset purchase data for this sub-action
        setPurchaseData(prev => {
          const newData = { ...prev };
          delete newData[subAction.id];
          return newData;
        });

        // Clear any errors
        setPurchaseError(prev => {
          const newErrors = { ...prev };
          delete newErrors[subAction.id];
          return newErrors;
        });

        // Refresh sub-actions to update stock immediately
        if (selectedAction) {
          await fetchSubActions(selectedAction.id);
        }
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Purchase failed. Please try again.';
      setPurchaseError(prev => ({ ...prev, [subAction.id]: errorMessage }));
    } finally {
      setPurchasing(prev => ({ ...prev, [subAction.id]: false }));
    }
  };

  const updatePurchaseQuantity = (subActionId: string, quantity: number) => {
    const numQuantity = parseInt(quantity.toString());
    if (isNaN(numQuantity) || numQuantity < 0) {
      return;
    }

    setPurchaseData(prev => ({
      ...prev,
      [subActionId]: {
        quantity: numQuantity,
        buyerData: prev[subActionId]?.buyerData || {},
        customAmount: prev[subActionId]?.customAmount
      }
    }));
    setPurchaseError(prev => ({ ...prev, [subActionId]: '' }));
  };

  const updateBuyerData = (subActionId: string, field: string, value: string) => {
    setPurchaseData(prev => ({
      ...prev,
      [subActionId]: {
        quantity: prev[subActionId]?.quantity || 1,
        buyerData: {
          ...prev[subActionId]?.buyerData || {},
          [field]: value
        },
        customAmount: prev[subActionId]?.customAmount
      }
    }));
    setPurchaseError(prev => ({ ...prev, [subActionId]: '' }));
  };

  const renderBuyerField = (field: string, subActionId: string, value: string, isRequired: boolean) => {
    const fieldConfig: Record<string, { label: string; type: string; placeholder: string }> = {
      fullName: { label: 'Full Name', type: 'text', placeholder: 'Enter full name' },
      firstName: { label: 'First Name', type: 'text', placeholder: 'Enter first name' },
      lastName: { label: 'Last Name', type: 'text', placeholder: 'Enter last name' },
      email: { label: 'Email', type: 'email', placeholder: 'Enter email address' },
      phone: { label: 'Phone Number', type: 'tel', placeholder: 'Enter phone number' },
      phoneNumber: { label: 'Phone Number', type: 'tel', placeholder: 'Enter phone number' },
      address: { label: 'Address', type: 'text', placeholder: 'Enter address' },
      city: { label: 'City', type: 'text', placeholder: 'Enter city' },
      country: { label: 'Country', type: 'text', placeholder: 'Enter country' },
      zipCode: { label: 'Zip Code', type: 'text', placeholder: 'Enter zip code' },
      postalCode: { label: 'Postal Code', type: 'text', placeholder: 'Enter postal code' },
      idNumber: { label: 'ID Number', type: 'text', placeholder: 'Enter ID number' },
      companyName: { label: 'Company Name', type: 'text', placeholder: 'Enter company name' },
      taxId: { label: 'Tax ID', type: 'text', placeholder: 'Enter tax ID' },
      notes: { label: 'Notes', type: 'text', placeholder: 'Enter notes (optional)' },
    };

    const config = fieldConfig[field] || { label: field, type: 'text', placeholder: `Enter ${field}` };

    return (
      <div key={field} className="space-y-2">
        <label className="text-xs font-semibold text-[#00313A] mb-1 flex items-center gap-1">
          {config.label}
          {isRequired && <span className="text-red-500">*</span>}
        </label>
        {field === 'notes' ? (
          <textarea
            value={value || ''}
            onChange={(e) => updateBuyerData(subActionId, field, e.target.value)}
            className="w-full h-20 rounded-lg border-2 border-[#00313A]/10 focus:border-[#00B512] text-sm p-2 focus:outline-none"
            placeholder={config.placeholder}
          />
        ) : (
          <CustomInput
            type={config.type}
            value={value || ''}
            onChange={(e) => updateBuyerData(subActionId, field, e.target.value)}
            className="h-9 rounded-lg border-2 border-[#00313A]/10 focus:border-[#00B512] text-sm"
            placeholder={config.placeholder}
          />
        )}
      </div>
    );
  };

  const renderActionCard = (action: Action) => {
    const baseButtonClass = "bg-white/80 hover:bg-white rounded-xl border-2 border-[#00B512]/10 hover:border-[#00B512]/30 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] text-left group cursor-pointer";

    // List Layout (Default)
    if (action.displayLayout === 'list' || !action.displayLayout) {
      return (
        <button
          key={action.id}
          onClick={() => handleActionClick(action)}
          className={`${baseButtonClass} p-5`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-lg flex items-center justify-center shadow-sm">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-base font-bold text-[#00313A] group-hover:text-[#00B512] transition-colors">
                  {action.name}
                </h4>
              </div>
              
              {action.shortDescription && (
                <p className="text-sm text-[#00313A]/70 mb-3 line-clamp-2">
                  {action.shortDescription}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#00313A]/60">
                {action.availability.startsAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#00B512]" />
                    <span>{formatDate(action.availability.startsAt)}</span>
                  </div>
                )}
                {action.pricing.mode && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-[#00B512]" />
                    <span className="capitalize">{action.pricing.mode} Pricing</span>
                  </div>
                )}
                {action.status && (
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    action.status === 'published' 
                      ? 'bg-[#00B512]/10 text-[#00B512]' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {action.status}
                  </div>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#00B512] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        </button>
      );
    }

    // Card Layout - with background image
    if (action.displayLayout === 'card') {
      return (
        <button
          key={action.id}
          onClick={() => handleActionClick(action)}
          className={`${baseButtonClass} overflow-hidden relative min-h-72 flex flex-col`}
          style={{
            backgroundImage: action.coverImage ? `url(${action.coverImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 opacity-80 group-hover:opacity-70 transition-opacity" />
          
          {/* Content - positioned at bottom */}
          <div className="relative flex-1 flex flex-col justify-end p-5 z-10">
            <h4 className="text-xl font-bold text-white group-hover:text-[#1fd331] transition-colors mb-2">
              {action.name}
            </h4>
            
            {action.shortDescription && (
              <p className="text-sm text-white/90 mb-4 line-clamp-2">
                {action.shortDescription}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {action.pricing.mode && (
                <div className="flex items-center gap-1 bg-[#00B512]/80 backdrop-blur-sm px-3 py-1 rounded-full text-white font-semibold">
                  <DollarSign className="w-3 h-3" />
                  <span className="capitalize">{action.pricing.mode}</span>
                </div>
              )}
              {action.status && (
                <div className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                  action.status === 'published' 
                    ? 'bg-[#00B512]/80 text-white' 
                    : 'bg-gray-400/80 text-white'
                }`}>
                  {action.status}
                </div>
              )}
            </div>
          </div>
        </button>
      );
    }

    // Spotlight Layout - featured card with large image
    if (action.displayLayout === 'spotlight') {
      return (
        <button
          key={action.id}
          onClick={() => handleActionClick(action)}
          className={`${baseButtonClass} overflow-hidden relative min-h-80 flex flex-col md:col-span-2`}
          style={{
            backgroundImage: action.coverImage ? `url(${action.coverImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-85 group-hover:opacity-75 transition-opacity" />
          
          {/* Content */}
          <div className="relative flex-1 flex flex-col justify-end p-6 z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-lg flex items-center justify-center shadow-lg backdrop-blur-sm">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-white group-hover:text-[#1fd331] transition-colors">
                {action.name}
              </h4>
            </div>
            
            {action.shortDescription && (
              <p className="text-base text-white/95 mb-5 line-clamp-3">
                {action.shortDescription}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {action.pricing.mode && (
                <div className="flex items-center gap-2 bg-[#00B512]/90 backdrop-blur-sm px-4 py-2 rounded-full text-white font-bold shadow-lg">
                  <DollarSign className="w-4 h-4" />
                  <span className="capitalize">{action.pricing.mode} Pricing</span>
                </div>
              )}
              {action.availability.startsAt && (
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-semibold">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(action.availability.startsAt)}</span>
                </div>
              )}
              {action.status && (
                <div className={`px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm shadow-lg ${
                  action.status === 'published' 
                    ? 'bg-[#00B512]/90 text-white' 
                    : 'bg-gray-500/80 text-white'
                }`}>
                  {action.status}
                </div>
              )}
            </div>
          </div>
        </button>
      );
    }

    // Compact Layout
    if (action.displayLayout === 'compact') {
      return (
        <button
          key={action.id}
          onClick={() => handleActionClick(action)}
          className={`${baseButtonClass} p-4`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#00313A] group-hover:text-[#00B512] transition-colors truncate">
                  {action.name}
                </h4>
                {action.pricing.mode && (
                  <p className="text-xs text-[#00313A]/60 capitalize">
                    {action.pricing.mode} • {action.status || 'active'}
                  </p>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#00B512] flex-shrink-0" />
          </div>
        </button>
      );
    }

    // Grid Layout
    if (action.displayLayout === 'grid') {
      return (
        <button
          key={action.id}
          onClick={() => handleActionClick(action)}
          className={`${baseButtonClass} p-4 flex flex-col`}
        >
          {/* Cover Image */}
          {action.coverImage && (
            <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden -mx-4 -mt-4">
              <img
                src={action.coverImage}
                alt={action.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <div className="flex-1 flex flex-col">
            <h4 className="text-sm font-bold text-[#00313A] group-hover:text-[#00B512] transition-colors mb-2 line-clamp-2">
              {action.name}
            </h4>
            
            {action.shortDescription && (
              <p className="text-xs text-[#00313A]/70 mb-3 line-clamp-2 flex-1">
                {action.shortDescription}
              </p>
            )}

            <div className="flex items-center justify-between mt-auto">
              <div className="text-xs text-[#00313A]/60 flex items-center gap-1">
                {action.pricing.mode && (
                  <span className="capitalize">{action.pricing.mode}</span>
                )}
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                action.status === 'published' 
                  ? 'bg-[#00B512]/10 text-[#00B512]' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {action.status}
              </div>
            </div>
          </div>
        </button>
      );
    }

    // Fallback to list layout
    return renderActionCard({ ...action, displayLayout: 'list' });
  };

  const handleSendMoney = () => {
    if (!isLoggedIn) {
      // For non-logged in users, show the modal (existing behavior)
      return;
    }

    // For logged-in users, navigate directly to transfer amount page
    // Store recipient data in session storage for the transfer page
    const recipientData = {
      id: userId,
      name: user.name,
      phone: user.phone,
      avatar: getDisplayImage() || '',
      isOnline: true, // We don't have real-time status, so default to true
      type: user.profileType === 'organization' ? 'organization' : 'user', // Add type information
    };

    sessionStorage.setItem('selectedRecipient', JSON.stringify(recipientData));
    router.push('/home/transfer/amount');
  };

  const handleSubmit = () => {
    if (!amount) {
      alert('Please fill in the amount');
      return;
    }
    // For non-logged in users, this would typically redirect to login
    alert('Please login to continue with the transfer');
  };

  const handleContactSubmit = () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      alert('Please fill in all contact form fields');
      return;
    }
    // Here you would typically send the contact form data to your backend
    alert('Message sent successfully!');
    setContactForm({ name: '', email: '', message: '' });
  };

  const handleAddFriend = () => {
    // Here you would implement the add friend functionality
    alert('Friend request sent!');
  };

  const handleSocialMediaClick = (platform: string) => {
    // Here you would implement social media links
    alert(`${platform} link clicked!`);
  };

  const handleLoginClick = () => {
    router.push('/auth/login');
  };

  const handleSignupClick = () => {
    router.push('/auth/signup');
  };

  // Handler for organizations to view and validate user's QR objects
  const handleViewUserQRObjects = () => {
    if (!isLoggedIn || !isLoggedInAsOrganization) {
      toast({
        title: 'Access Denied',
        description: 'Only organizations can validate QR objects.',
        variant: 'destructive',
      });
      return;
    }

    // Navigate to the user's action page where the organization can see their QR objects
    // Pass the user's ID to view their purchased QR objects
    router.push(`/action/${userId}`);
  };

  // Function to get the display image (prioritize profileImage over avatar, or logo for organizations)
  const getDisplayImage = () => {
    // For organizations, prioritize logo over profileImage
    if (user.profileType === 'organization') {
      return user.logo || user.profileImage || user.avatar || '';
    }
    // For users, prioritize profileImage over avatar
    return user.profileImage || user.avatar || '';
  };

  // Function to get the display logo
  const getDisplayLogo = () => {
    return user.logo || '';
  };

  if (loading) {
    return (
      <>
        {isHydrated && isLoggedIn && <Header />}
        <div className='min-h-screen bg-white flex items-center justify-center px-4'>
          {/* Loading Card */}
          <div className='w-full max-w-4xl mx-auto'>
            <div className='bg-white rounded-2xl shadow-lg border border-gray-200 p-8 lg:p-12 flex flex-col items-center'>
              <div className='relative mb-6'>
                <div className='animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#00B512]'></div>
              </div>

              <div className='text-center space-y-3'>
                <p className='text-[#00313A] dark:text-white font-semibold text-lg'>
                  Loading profile...
                </p>
              </div>
            </div>
          </div>

          <div className='lg:hidden'>
            <Navigation />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {isHydrated && isLoggedIn && <Header />}
      <div className='min-h-screen bg-white dark:bg-transparent'>
        {/* Main Content Container */}
        <div className='container mx-auto px-4 py-8 lg:py-12 flex items-center justify-center min-h-screen'>
          {/* Single Centered Card Layout */}
          <div className='w-full max-w-4xl mx-auto'>
            {/* Profile Card */}
            <div className='bg-white dark:bg-darkBg-card rounded-2xl shadow-lg border border-gray-200 dark:border-darkBorder-light p-8 lg:p-12'>
              {error && (
                <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-xl mb-6'>
                  <p className='text-sm font-medium text-center'>{error}</p>
                </div>
              )}

              {/* Profile Section - Social Media Card Style */}
              <div className='relative bg-gradient-to-r from-gray-50 to-white dark:from-darkBg-interactive dark:to-darkBg-card p-6 rounded-2xl border border-gray-100 dark:border-darkBorder-light hover:shadow-md transition-shadow mb-8'>
                {/* Profile Type Badge - Top Right Corner */}
                {user.profileType && user.showProfileTypeOnWelcome && (
                  <div
                    className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-semibold border ${user.profileType === 'organization'
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700'
                      : 'bg-[#00B512]/10 dark:bg-[#D4AF37]/20 text-[#00B512] dark:text-[#D4AF37] border-[#00B512]/20 dark:border-[#D4AF37]/30'
                      }`}
                  >
                    {user.profileType === 'organization' ? 'Organization' : 'Individual'}
                  </div>
                )}

                {/* Main Profile Content */}
                <div className='flex items-start gap-5 mb-5'>
                  {/* Avatar */}
                  {user.showProfileImageOnWelcome && (
                    <div className='flex-shrink-0'>
                      <div className='w-28 h-28 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center border-3 border-[#00B512] overflow-hidden shadow-md'>
                        {getDisplayImage() ? (
                          <img
                            src={getDisplayImage()}
                            alt='User Profile'
                            className='w-full h-full object-cover rounded-full'
                            onError={e => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove(
                                'hidden'
                              );
                            }}
                          />
                        ) : (
                          <User className='w-14 h-14 text-gray-400 dark:text-gray-500' />
                        )}
                        {getDisplayImage() && (
                          <User className='w-14 h-14 text-gray-400 dark:text-gray-500 hidden absolute inset-0 m-auto' />
                        )}
                      </div>
                    </div>
                  )}

                  {/* User Details */}
                  <div className='flex-1 py-1'>
                    <h1 className='text-xl lg:text-2xl font-bold text-[#00313A] dark:text-white mb-1 leading-tight'>
                      {user.name}
                    </h1>

                    {user.showPhoneOnWelcome && user.phone && (
                      <p className='text-[#00B512] dark:text-brand-gold text-sm font-medium mb-3 flex items-center gap-2'>
                        <Phone className='w-4 h-4' /> +{user.phone}
                      </p>
                    )}

                    {user.showStatusMessageOnWelcome && user.statusMessage && (
                      <p className='text-gray-600 dark:text-gray-300 text-sm italic line-clamp-2'>
                        "{user.statusMessage}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons - Inside Card */}
                <div className='flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-darkBorder-light'>
                  {isLoggedIn ? (
                    <>
                      {user.profileType !== 'organization' ? (
                        <CustomButton
                          variant='default'
                          className='w-32 px-4 py-2 rounded-lg font-medium bg-[#00B512] dark:bg-[#D4AF37] text-white hover:bg-white dark:hover:bg-darkBg-card hover:border-[#00B512] dark:hover:border-[#D4AF37] hover:border-2 hover:text-[#00B512] dark:hover:text-[#D4AF37] text-sm'
                          onClick={handleSendMoney}
                        >
                          Send Money
                        </CustomButton>
                      ) : (
                        <CustomButton
                          variant='default'
                          className='w-32 px-4 py-2 rounded-lg font-medium bg-[#00B512] dark:bg-[#D4AF37] text-white hover:bg-white dark:hover:bg-darkBg-card hover:border-[#00B512] dark:hover:border-[#D4AF37] hover:border-2 hover:text-[#00B512] dark:hover:text-[#D4AF37] text-sm'
                          onClick={handleSendMoney}
                        >
                          Pay
                        </CustomButton>
                      )}
                      {user.profileType !== 'organization' && (
                        <CustomButton
                          variant='outline'
                          className='w-32 px-4 py-2 border-2 border-[#00B512] dark:border-[#D4AF37] text-[#00B512] dark:text-[#D4AF37] rounded-lg font-medium shadow-sm hover:bg-[#00B512] dark:hover:bg-[#D4AF37] dark:hover:text-white text-sm dark:bg-darkBg-card'
                          onClick={handleAddFriend}
                        >
                          Add Friend
                        </CustomButton>
                      )}
                      {isLoggedInAsOrganization && user.profileType !== 'organization' && (
                        <CustomButton
                          variant='outline'
                          className='w-32 px-4 py-2 border-2 border-purple-500 text-purple-600 rounded-lg font-medium shadow-sm hover:bg-purple-500 hover:text-white text-sm'
                          onClick={handleViewUserQRObjects}
                        >
                          View QR
                        </CustomButton>
                      )}
                    </>
                  ) : (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <CustomButton variant='default' className='w-32 px-4 py-2 rounded-lg font-medium bg-[#00B512] dark:bg-[#D4AF37] text-white hover:bg-white dark:hover:bg-darkBg-card hover:border-[#00B512] dark:hover:border-[#D4AF37] hover:border-2 hover:text-[#00B512] dark:hover:text-[#D4AF37] text-sm'>
                            {user.profileType === 'organization'
                              ? 'Pay'
                              : 'Send Money'}
                          </CustomButton>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {user.profileType === 'organization'
                                ? 'Pay'
                                : 'Send Money'}
                            </DialogTitle>
                          </DialogHeader>
                          <form
                            className='space-y-6'
                            onSubmit={e => {
                              e.preventDefault();
                              handleSubmit();
                            }}
                          >
                            <div className='space-y-2'>
                              <label className='text-sm font-semibold text-[#00313A] dark:text-white flex items-center gap-2'>
                                <DollarSign className='w-4 h-4 text-[#00B512] dark:text-[#D4AF37]' />
                              </label>
                              <CustomInput
                                type='number'
                                placeholder='Enter amount'
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className='h-12 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] dark:focus:border-[#D4AF37] text-lg'
                              />
                            </div>
                            <DialogFooter>
                              <CustomButton
                                type='submit'
                                variant='default'
                                className='w-full h-12 bg-[#00B512] dark:bg-[#D4AF37] border-none rounded-xl font-bold text-white shadow-lg text-lg'
                              >
                                <b>Next</b>
                              </CustomButton>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}

                  {/* Organization Actions Section */}
                  {user.profileType === 'organization' && (
                    <div className="bg-gradient-to-br from-white via-[#f8fffa] to-[#f0fff4] rounded-2xl p-6 border-2 border-[#00B512]/10 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-md animate-pulse">
                          <Ticket className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-[#00313A]">Available Actions</h3>
                      </div>

                      {actionsLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 text-[#00B512] animate-spin" />
                        </div>
                      ) : actions.length === 0 ? (
                        <div className="text-center py-8">
                          <Ticket className="w-12 h-12 text-[#00B512]/30 mx-auto mb-3" />
                          <p className="text-[#00313A]/60 font-medium">No actions available at the moment</p>
                        </div>
                      ) : (
                        <div className={`${
                          // Determine grid layout based on action layouts
                          actions.some(a => a.displayLayout === 'card' || a.displayLayout === 'grid' || a.displayLayout === 'spotlight') 
                            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4'
                            : 'grid grid-cols-1 gap-4'
                        }`}>
                          {actions.map((action) => renderActionCard(action))}
                        </div>
                      )}
                    </div>
                  )}
                </div>


              </div>

              {/* Debug Info */}
              {error && (
                <div className="bg-gray-50 rounded-2xl px-4 py-2 text-center">
                  <p className="text-xs text-gray-400">
                    Profile ID: {userId.substring(0, 8)}...
                  </p>
                </div>
              )}

            </div>

            {/* Right Side - Forms */}
            {/* <div className="flex-1 space-y-6 border-4 border-red-500"> */}
            {/* The forms have been moved to modals. You can add other content here if needed. */}
            {/* </div> */}
          </div>

          {/* Mobile Layout: Single Column */}
          <div className="lg:hidden w-full max-w-md ">
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 relative transform hover:scale-[1.02] transition-all duration-300">
              {/* Decorative top accent */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-lg">
                <Gift className="w-6 h-6 text-white" />
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-2xl mb-6 mt-4 shadow-sm">
                  <p className="text-sm font-medium text-center">{error}</p>
                </div>
              )}

              {/* Mobile Profile Section */}
              <div className="flex flex-col items-center w-full mb-6 mt-4">
                {/* Mobile Avatar */}
                {user.showProfileImageOnWelcome && (
                  <div className="relative mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#00313A] to-[#025059] rounded-full flex items-center justify-center shadow-xl border-4 border-white/20 overflow-hidden">
                      {getDisplayImage() ? (
                        <img
                          src={getDisplayImage()}
                          alt="User Profile"
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : (
                        <User className="w-10 h-10 text-white" />
                      )}
                      {getDisplayImage() && (
                        <User className="w-10 h-10 text-white hidden absolute inset-0 m-auto" />
                      )}
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <Heart className="w-3 h-3 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md">
                      <Star className="w-2 h-2 text-[#00B512]" />
                    </div>
                  </div>
                )}

                {/* Mobile User Details */}
                <div className="text-center w-full">
                  <h1 className="text-xl font-bold text-[#00313A] mb-2 leading-tight">
                    <b>{user.name}</b>
                    <span className="inline-block ml-2 text-lg">💸</span>
                  </h1>

                  {user.showStatusMessageOnWelcome && user.statusMessage && (
                    <div className="bg-gradient-to-r from-[#00B512]/10 to-[#1fd331]/10 rounded-xl px-3 py-2 mb-3 border border-[#00B512]/20">
                      <p className="text-[#00313A] text-xs font-medium italic">
                        "{user.statusMessage}"
                      </p>
                    </div>
                  )}

                  {user.showPhoneOnWelcome && user.phone && (
                    <p className="text-[#00313A]/80 font-medium text-xs mb-3">
                      <b>Tel: </b>+{user.phone}
                    </p>
                  )}

                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-3 h-3 text-[#00B512] animate-pulse" />
                    <span className="text-sm text-[#00313A] font-medium">
                      {user.profileType === 'organization' ? 'Pay' : 'Send Money'}
                    </span>
                    <Sparkles className="w-3 h-3 text-[#1fd331] animate-pulse delay-300" />
                  </div>
                </div>
              </div>

              {/* Mobile Additional Profile Information */}
              <div className="w-full mt-4 space-y-4">
                {/* Profile Type and Category Badges - Mobile */}
                <div className="flex justify-center gap-2 animate-fade-in">
                  {/* Profile Type Badge */}
                  {user.profileType && user.showProfileTypeOnWelcome && (
                    <div className={`px-4 py-2 rounded-full text-xs font-bold shadow-md transform hover:scale-105 transition-all duration-300 ${user.profileType === 'organization'
                      ? 'bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white shadow-purple-500/25 hover:shadow-purple-500/40'
                      : 'bg-gradient-to-r from-[#00B512] via-[#1fd331] to-[#00B512] text-white shadow-[#00B512]/25 hover:shadow-[#00B512]/40'
                      }`}>
                      <span className="flex items-center gap-1">
                        {user.profileType === 'organization' ? '🏢' : '👤'}
                        {user.profileType === 'organization' ? 'Organization' : 'Individual'}
                      </span>
                    </div>
                  )}

                  {/* Category Badge for Organizations - Mobile */}
                  {user.profileType === 'organization' && user.categoryName && user.showCategoryOnWelcome && (
                    <div className="px-4 py-2 rounded-full text-xs font-bold shadow-md transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white shadow-blue-500/25 hover:shadow-blue-500/40">
                      <span className="flex items-center gap-1">
                        🏷️
                        {user.categoryName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Mobile Action Buttons */}
                <div className="w-full space-y-4">
                  <div className="flex flex-col gap-3">
                    {isLoggedIn ? (
                      // For logged-in users, direct navigation
                      <CustomButton
                        variant="default"
                        className="w-full h-12 bg-gradient-to-r from-[#00B512] to-[#1fd331] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        onClick={handleSendMoney}
                      >
                        {user.profileType === 'organization' ? 'Pay' : 'Send Money'}
                      </CustomButton>
                    ) : (
                      // For non-logged in users, show modals
                      <>
                        <Dialog>
                          <DialogTrigger asChild>
                            <CustomButton variant="default" className="w-full h-12 bg-gradient-to-r from-[#00B512] to-[#1fd331] text-white rounded-xl font-bold shadow-lg">
                              {user.profileType === 'organization' ? 'Pay' : 'Send Money'}
                            </CustomButton>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>{user.profileType === 'organization' ? 'Pay' : 'Send Money'}</DialogTitle>
                            </DialogHeader>
                            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                                  <span>Amount ($)</span>
                                  <Sparkles className='w-4 h-4 text-[#00B512]' />
                                </label>
                                <CustomInput
                                  type='number'
                                  placeholder='Enter amount'
                                  value={amount}
                                  onChange={e => setAmount(e.target.value)}
                                  className='h-12 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] text-lg'
                                />
                              </div>
                              <div className='space-y-2'>
                                <label className='text-sm font-semibold text-[#00313A] dark:text-white flex items-center gap-2'>
                                  <span>Message</span>
                                  <MessageSquare className='w-4 h-4 text-[#00B512] dark:text-[#D4AF37]' />
                                </label>
                                <Textarea
                                  placeholder='Enter a message (optional)'
                                  className='rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] dark:focus:border-[#D4AF37] text-lg'
                                  rows={3}
                                />
                              </div>
                              <DialogFooter>
                                <CustomButton
                                  type='submit'
                                  variant='default'
                                  className='w-full h-12 bg-[#00B512] dark:bg-[#D4AF37] border-none rounded-xl font-bold text-white shadow-lg text-lg'
                                  disabled={!amount}
                                >
                                  <b>Next</b>
                                </CustomButton>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <CustomButton
                              variant='outline'
                              className='w-full h-12 rounded-lg font-bold shadow-lg border-[#00B512] dark:border-[#D4AF37] text-[#00B512] dark:text-[#D4AF37]'
                            >
                              Contact
                            </CustomButton>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Contact {user.name}</DialogTitle>
                            </DialogHeader>
                            <form
                              className='space-y-6'
                              onSubmit={e => {
                                e.preventDefault();
                                handleContactSubmit();
                              }}
                            >
                              <div className='space-y-2'>
                                <label className='text-sm font-semibold text-[#00313A] dark:text-white flex items-center gap-2'>
                                  <User className='w-4 h-4 text-[#00B512] dark:text-[#D4AF37]' />
                                </label>
                                <CustomInput
                                  placeholder='Enter your name'
                                  value={contactForm.name}
                                  onChange={e =>
                                    setContactForm({
                                      ...contactForm,
                                      name: e.target.value,
                                    })
                                  }
                                  className='h-12 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] dark:focus:border-[#D4AF37] text-lg'
                                />
                              </div>
                              <div className='space-y-2'>
                                <label className='text-sm font-semibold text-[#00313A] dark:text-white flex items-center gap-2'>
                                  <Mail className='w-4 h-4 text-[#00B512] dark:text-[#D4AF37]' />
                                </label>
                                <CustomInput
                                  type='email'
                                  placeholder='Enter your email'
                                  value={contactForm.email}
                                  onChange={e =>
                                    setContactForm({
                                      ...contactForm,
                                      email: e.target.value,
                                    })
                                  }
                                  className='h-12 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] dark:focus:border-[#D4AF37] text-lg'
                                />
                              </div>
                              <div className='space-y-2'>
                                <label className='text-sm font-semibold text-[#00313A] dark:text-white flex items-center gap-2'>
                                  <MessageSquare className='w-4 h-4 text-[#00B512] dark:text-[#D4AF37]' />
                                </label>
                                <Textarea
                                  placeholder='Enter your message'
                                  value={contactForm.message}
                                  onChange={e =>
                                    setContactForm({
                                      ...contactForm,
                                      message: e.target.value,
                                    })
                                  }
                                  className='rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] dark:focus:border-[#D4AF37] text-lg'
                                  rows={4}
                                />
                              </div>
                              <DialogFooter>
                                <CustomButton
                                  type='submit'
                                  variant='default'
                                  className='w-full h-12 bg-[#00B512] dark:bg-[#D4AF37] border-none rounded-xl font-bold text-white shadow-lg text-lg'
                                  disabled={!contactForm.name || !contactForm.email || !contactForm.message}
                                >
                                  <b>Send Message</b>
                                </CustomButton>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                </div>
              </div>

              {/* Additional Profile Information */}
              <div className='w-full mt-6 space-y-6'>
                {/* Category Badge for Organizations */}
                {user.profileType === 'organization' &&
                  user.categoryName &&
                  user.showCategoryOnWelcome && (
                    <div className='flex justify-center'>
                      <div className='px-4 py-2 rounded-full text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'>
                        {user.categoryName}
                      </div>
                    </div>
                  )}

                {/* Location Information */}
                {(user.province || user.district || user.sector || user.cell) &&
                  user.showLocationOnWelcome && (
                    <div className='bg-white dark:bg-darkBg-card rounded-lg p-6 border border-gray-200 dark:border-darkBorder-light mb-6'>
                      <div className='flex items-center gap-2 mb-4'>
                        <h3 className='text-lg font-semibold text-[#00313A] dark:text-white'>
                          Location Information
                        </h3>
                      </div>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        {user.province && (
                          <div className='bg-gray-50 dark:bg-darkBg-interactive rounded-lg p-3 border border-gray-200 dark:border-darkBorder-light'>
                            <div className='flex items-center gap-2 mb-1'>
                              <span className='text-[#00B512] dark:text-brand-gold font-semibold text-sm'>
                                Province
                              </span>
                            </div>
                            <span className='text-[#00313A] dark:text-white font-medium'>
                              {user.province}
                            </span>
                          </div>
                        )}
                        {user.district && (
                          <div className='bg-gray-50 dark:bg-darkBg-interactive rounded-lg p-3 border border-gray-200 dark:border-darkBorder-light'>
                            <div className='flex items-center gap-2 mb-1'>
                              <span className='text-[#00B512] dark:text-brand-gold font-semibold text-sm'>
                                District
                              </span>
                            </div>
                            <span className='text-[#00313A] dark:text-white font-medium'>
                              {user.district}
                            </span>
                          </div>
                        )}
                        {user.sector && (
                          <div className='bg-gray-50 dark:bg-darkBg-interactive rounded-lg p-3 border border-gray-200 dark:border-darkBorder-light'>
                            <div className='flex items-center gap-2 mb-1'>
                              <span className='text-[#00B512] dark:text-brand-gold font-semibold text-sm'>
                                Sector
                              </span>
                            </div>
                            <span className='text-[#00313A] dark:text-white font-medium'>
                              {user.sector}
                            </span>
                          </div>
                        )}
                        {user.cell && (
                          <div className='bg-gray-50 dark:bg-darkBg-interactive rounded-lg p-3 border border-gray-200 dark:border-darkBorder-light'>
                            <div className='flex items-center gap-2 mb-1'>
                              <span className='text-[#00B512] dark:text-brand-gold font-semibold text-sm'>
                                Cell
                              </span>
                            </div>
                            <span className='text-[#00313A] dark:text-white font-medium'>
                              {user.cell}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* TIN Number */}
                {user.tinNumber && user.showTinOnWelcome && (
                  <div className='bg-white dark:bg-darkBg-card rounded-lg p-6 border border-gray-200 dark:border-darkBorder-light mb-6'>
                    <div className='flex items-center gap-2 mb-4'>
                      <h3 className='text-lg font-semibold text-[#00313A] dark:text-white'>
                        Tax Information
                      </h3>
                    </div>
                    <div className='bg-gray-50 dark:bg-darkBg-interactive rounded-lg p-4 border border-gray-200 dark:border-darkBorder-light'>
                      <div className='flex items-center gap-3'>
                        <span className='text-[#00B512] dark:text-brand-gold font-semibold text-lg'>
                          TIN
                        </span>
                        <span className='text-black dark:text-white font-mono font-semibold text-lg'>
                          {user.tinNumber}
                        </span>
                      </div>
                      <p className='text-[#00313A]/70 dark:text-gray-300 text-sm mt-2'>
                        Tax Identification Number
                      </p>
                    </div>
                  </div>
                )}

                {/* Organization Logo */}
                {user.logo && user.showLogoOnWelcome && (
                  <div className='bg-white dark:bg-darkBg-card rounded-lg p-6 border border-gray-200 dark:border-darkBorder-light mb-6'>
                    <div className='flex items-center gap-2 mb-4'>
                      <h3 className='text-lg font-semibold text-[#00313A] dark:text-white'>
                        Organization Logo
                      </h3>
                    </div>
                    <div className='flex justify-center'>
                      <div className='bg-gray-50 dark:bg-darkBg-interactive rounded-lg p-4 border border-gray-200 dark:border-darkBorder-light'>
                        <img
                          src={getDisplayLogo()}
                          alt='Organization Logo'
                          className='w-20 h-20 object-contain rounded-lg'
                          onError={e => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Organization Actions Section */}
                {user.profileType === 'organization' && (
                  <div className='bg-white dark:bg-darkBg-card rounded-lg p-6 border border-gray-200 dark:border-darkBorder-light mb-6'>
                    <div className='flex items-center gap-2 mb-6'>
                      <h3 className='text-lg font-semibold text-[#00313A] dark:text-white'>
                        Available Actions
                      </h3>
                    </div>

                    {actionsLoading ? (
                      <div className='flex items-center justify-center py-12'>
                        <Loader2 className='w-8 h-8 text-[#00B512] animate-spin' />
                      </div>
                    ) : actions.length === 0 ? (
                      <div className='text-center py-8'>
                        <Ticket className='w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3' />
                        <p className='text-gray-500 dark:text-gray-400 font-medium'>
                          No actions available at the moment
                        </p>
                      </div>
                    ) : (
                      <div className='grid grid-cols-1 gap-4'>
                        {actions.map(action => (
                          <button
                            key={action.id}
                            onClick={() => handleActionClick(action)}
                            className='bg-gray-50 dark:bg-darkBg-interactive hover:bg-white dark:hover:bg-darkBg-card rounded-lg p-5 border border-gray-200 dark:border-darkBorder-light hover:border-[#00B512] dark:hover:border-[#D4AF37]/30 text-left group'
                          >
                            <div className='flex items-start justify-between gap-4'>
                              <div className='flex-1'>
                                <div className='flex items-center gap-3 mb-2'>
                                  <div className='w-10 h-10 bg-[#00B512] dark:bg-[#D4AF37] rounded-lg flex items-center justify-center'>
                                    <Ticket className='w-5 h-5 text-white' />
                                  </div>
                                  <h4 className='text-base font-semibold text-[#00313A] dark:text-white group-hover:text-[#00B512] dark:group-hover:text-[#D4AF37]'>
                                    {action.name}
                                  </h4>
                                </div>

                                {action.shortDescription && (
                                  <p className='text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2'>
                                    {action.shortDescription}
                                  </p>
                                )}

                                <div className='flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400'>
                                  {action.availability.startsAt && (
                                    <div className='flex items-center gap-1'>
                                      <Calendar className='w-3 h-3 text-[#00B512]' />
                                      <span>
                                        {formatDate(
                                          action.availability.startsAt
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  {action.pricing.mode && (
                                    <div className='flex items-center gap-1'>
                                      <DollarSign className='w-3 h-3 text-[#00B512]' />
                                      <span className='capitalize'>
                                        {action.pricing.mode} Pricing
                                      </span>
                                    </div>
                                  )}
                                  {action.status && (
                                    <div
                                      className={`px-2 py-1 rounded-full text-xs font-semibold ${action.status === 'published'
                                          ? 'bg-[#00B512]/10 text-[#00B512]'
                                          : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                      {action.status}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className='w-5 h-5 text-[#00B512] opacity-0 group-hover:opacity-100 flex-shrink-0' />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Debug Info */}
              {error && (
                <div className='bg-gray-50 rounded-lg px-4 py-2 text-center'>
                  <p className='text-xs text-gray-400'>
                    Profile ID: {userId.substring(0, 8)}...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isHydrated && isLoggedIn && (
          <div className='lg:hidden'>
            <Navigation />
          </div>
        )}
      </div>

      {/* Sub-Actions Modal */}
      <Dialog
        open={isSubActionsModalOpen}
        onOpenChange={setIsSubActionsModalOpen}
      >
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold text-[#00313A] dark:text-white flex items-center gap-3'>
              <div className='w-10 h-10 bg-[#00B512] dark:bg-[#D4AF37] rounded-lg flex items-center justify-center shadow-md'>
                <Ticket className='w-5 h-5 text-white' />
              </div>
              {selectedAction?.name || 'Action Details'}
            </DialogTitle>
          </DialogHeader>

          {selectedAction && (
            <div className='space-y-6'>
              {/* Action Details */}
              <div className='bg-white dark:bg-darkBg-card rounded-xl p-5 border-2 border-[#00B512]/10 dark:border-[#D4AF37]/10'>
                {selectedAction.description && (
                  <p className='text-sm text-[#00313A]/80 dark:text-gray-300 mb-4 leading-relaxed'>
                    {selectedAction.description}
                  </p>
                )}

                <div className='grid grid-cols-2 gap-4'>
                  {selectedAction.availability.startsAt && (
                    <div className='flex items-center gap-2'>
                      <Calendar className='w-4 h-4 text-[#00B512] dark:text-[#D4AF37]' />
                      <div>
                        <p className='text-xs text-[#00313A]/60 dark:text-gray-400 font-semibold'>
                          Start Date
                        </p>
                        <p className='text-sm text-[#00313A] dark:text-white font-medium'>
                          {formatDate(selectedAction.availability.startsAt)}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedAction.availability.endsAt && (
                    <div className='flex items-center gap-2'>
                      <Clock className='w-4 h-4 text-[#00B512] dark:text-[#D4AF37]' />
                      <div>
                        <p className='text-xs text-[#00313A]/60 dark:text-gray-400 font-semibold'>
                          End Date
                        </p>
                        <p className='text-sm text-[#00313A] dark:text-white font-medium'>
                          {formatDate(selectedAction.availability.endsAt)}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedAction.pricing.mode && (
                    <div className='flex items-center gap-2'>
                      <DollarSign className='w-4 h-4 text-[#00B512] dark:text-[#D4AF37]' />
                      <div>
                        <p className='text-xs text-[#00313A]/60 dark:text-gray-400 font-semibold'>
                          Pricing Mode
                        </p>
                        <p className='text-sm text-[#00313A] dark:text-white font-medium capitalize'>
                          {selectedAction.pricing.mode}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedAction.currency && (
                    <div className='flex items-center gap-2'>
                      <Coins className='w-4 h-4 text-[#00B512] dark:text-[#D4AF37]' />
                      <div>
                        <p className='text-xs text-[#00313A]/60 dark:text-gray-400 font-semibold'>
                          Currency
                        </p>
                        <p className='text-sm text-[#00313A] dark:text-white font-medium'>
                          {selectedAction.currency}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sub-Actions List */}
              <div>
                <h3 className='text-lg font-bold text-[#00313A] dark:text-white mb-4 flex items-center gap-2'>
                  <Sparkles className='w-5 h-5 text-[#00B512] dark:text-[#D4AF37]' />
                  Available Options
                </h3>

                {subActionsLoading ? (
                  <div className='flex items-center justify-center py-12'>
                    <Loader2 className='w-8 h-8 text-[#00B512] dark:text-[#D4AF37] animate-spin' />
                  </div>
                ) : subActions.length === 0 ? (
                  <div className='text-center py-8 bg-white dark:bg-darkBg-card rounded-xl border-2 border-[#00B512]/10 dark:border-[#D4AF37]/10'>
                    <Ticket className='w-12 h-12 text-[#00B512]/30 dark:text-[#D4AF37]/30 mx-auto mb-3' />
                    <p className='text-[#00313A]/60 dark:text-gray-400 font-medium'>
                      No options available for this action
                    </p>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {subActions
                      .filter(subAction => subAction.isActive)
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map(subAction => (
                        <div
                          key={subAction.id}
                          className='bg-white dark:bg-darkBg-card rounded-xl p-5 border-2 border-[#00B512]/10 dark:border-[#D4AF37]/10 hover:border-[#00B512]/30 dark:hover:border-[#D4AF37]/30 shadow-md hover:shadow-lg'
                        >
                          {/* Cover Image Display */}
                          {subAction.coverImage && (
                            <div className="mb-4 -mx-5 -mt-5 rounded-t-xl overflow-hidden">
                              <img 
                                src={subAction.coverImage} 
                                alt={subAction.name}
                                className="w-full h-48 object-cover"
                              />
                            </div>
                          )}

                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-lg flex items-center justify-center shadow-sm">
                                  <Star className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h4 className='text-base font-bold text-[#00313A] dark:text-white'>
                                    {subAction.name}
                                  </h4>
                                  <div className='flex items-center gap-2 mt-1'>
                                    <span className='text-lg font-bold text-[#00B512] dark:text-[#D4AF37]'>
                                      {formatPrice(
                                        subAction.price,
                                        selectedAction.currency
                                      )}
                                    </span>
                                    {subAction.stock !== null && (
                                      <span className='text-xs text-[#00313A]/60 dark:text-gray-400 bg-[#00B512]/10 dark:bg-[#D4AF37]/10 px-2 py-1 rounded-full'>
                                        {subAction.stock} available
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {subAction.description && (
                                <p className='text-sm text-[#00313A]/70 dark:text-gray-300 mb-3 ml-[52px]'>
                                  {subAction.description}
                                </p>
                              )}

                              {subAction.metadata && Object.keys(subAction.metadata).length > 0 && (
                                <div className="ml-[52px] space-y-2">
                                  {subAction.metadata.benefits && Array.isArray(subAction.metadata.benefits) && (
                                    <div>
                                      <p className="text-xs font-semibold text-[#00B512] mb-1">Benefits:</p>
                                      <ul className="list-disc list-inside text-xs text-[#00313A]/70 space-y-1">
                                        {subAction.metadata.benefits.map((benefit: string, index: number) => (
                                          <li key={index}>{benefit}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {subAction.metadata.seatType && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-[#00B512]">Seat Type:</span>
                                      <span className="text-xs text-[#00313A]/70 capitalize">{subAction.metadata.seatType}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* QR Code Display */}
                              {subAction.dedicatedQrCodeData && (
                                <div className="ml-[52px] mt-4 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <QrCode className="w-4 h-4 text-[#00B512]" />
                                    <span className="text-xs font-semibold text-[#00B512]">QR Code</span>
                                  </div>
                                  <div className="bg-white border-2 border-[#00B512]/20 rounded-lg p-3 inline-block">
                                    <img 
                                      src={subAction.dedicatedQrCodeData} 
                                      alt="QR Code" 
                                      className="w-24 h-24"
                                    />
                                  </div>
                                  <p className="text-xs text-[#00313A]/60">Scan to access this ticket</p>
                                </div>
                              )}

                              {/* Purchase Form */}
                              <div className="mt-4 ml-[52px] pt-4 border-t border-[#00B512]/10">
                                <div className="space-y-4">
                                  {/* Custom Amount for Pay What You Want */}
                                  {selectedAction?.pricing?.mode === 'pay_what_you_want' && (
                                    <div className="space-y-2">
                                      <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                                        <span>Your Price</span>
                                        <DollarSign className="w-4 h-4 text-[#00B512]" />
                                      </label>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-[#00313A]">{selectedAction.currency}</span>
                                        <CustomInput
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={purchaseData[subAction.id]?.customAmount || ''}
                                          onChange={(e) => {
                                            const value = e.target.value ? parseFloat(e.target.value) : 0;
                                            if (!isNaN(value) && value >= 0) {
                                              setPurchaseData(prev => ({
                                                ...prev,
                                                [subAction.id]: {
                                                  quantity: prev[subAction.id]?.quantity || 1,
                                                  buyerData: prev[subAction.id]?.buyerData || {},
                                                  customAmount: value
                                                }
                                              }));
                                            }
                                          }}
                                          className="flex-1 h-10 rounded-lg border-2 border-[#00B512]/30 focus:border-[#00B512] text-right font-semibold"
                                          placeholder="Enter amount you want to pay"
                                        />
                                      </div>
                                      <p className="text-xs text-[#00313A]/60">Enter any amount you'd like to pay</p>
                                    </div>
                                  )}

                                  {/* Quantity Input */}
                                  <div className='space-y-2'>
                                    <label className='text-sm font-semibold text-[#00313A] dark:text-white flex items-center gap-2'>
                                      <span>Quantity</span>
                                      {(() => {
                                        const userQuota =
                                          selectedAction.availability.userQuota;
                                        const availableStock =
                                          subAction.stock !== null
                                            ? subAction.stock
                                            : null;

                                        if (
                                          userQuota &&
                                          availableStock !== null
                                        ) {
                                          const maxAllowed = Math.min(
                                            userQuota,
                                            availableStock
                                          );
                                          return (
                                            <span className='text-xs text-[#00313A]/60 dark:text-gray-400 font-normal'>
                                              (Max: {maxAllowed}{' '}
                                              {userQuota !== availableStock
                                                ? `(Quota: ${userQuota}, Stock: ${availableStock})`
                                                : ''}
                                              )
                                            </span>
                                          );
                                        } else if (userQuota) {
                                          return (
                                            <span className='text-xs text-[#00313A]/60 dark:text-gray-400 font-normal'>
                                              (Max: {userQuota})
                                            </span>
                                          );
                                        } else if (availableStock !== null) {
                                          return (
                                            <span className='text-xs text-[#00313A]/60 dark:text-gray-400 font-normal'>
                                              (Max: {availableStock} available)
                                            </span>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </label>
                                    <div className='flex items-center gap-3'>
                                      <CustomInput
                                        type='number'
                                        min='1'
                                        max={(() => {
                                          const userQuota =
                                            selectedAction.availability
                                              .userQuota;
                                          const availableStock =
                                            subAction.stock !== null
                                              ? subAction.stock
                                              : null;

                                          if (
                                            userQuota &&
                                            availableStock !== null
                                          ) {
                                            return Math.min(
                                              userQuota,
                                              availableStock
                                            );
                                          }
                                          return (
                                            userQuota ||
                                            availableStock ||
                                            undefined
                                          );
                                        })()}
                                        value={
                                          purchaseData[subAction.id]
                                            ?.quantity || ''
                                        }
                                        onChange={e => {
                                          const value = parseInt(
                                            e.target.value
                                          );
                                          const userQuota =
                                            selectedAction.availability
                                              .userQuota;
                                          const availableStock =
                                            subAction.stock !== null
                                              ? subAction.stock
                                              : null;

                                          let maxValue: number | null = null;
                                          if (
                                            userQuota &&
                                            availableStock !== null
                                          ) {
                                            maxValue = Math.min(
                                              userQuota,
                                              availableStock
                                            );
                                          } else {
                                            maxValue =
                                              userQuota ||
                                              availableStock ||
                                              null;
                                          }

                                          if (!isNaN(value) && value >= 0) {
                                            if (
                                              maxValue !== null &&
                                              value > maxValue
                                            ) {
                                              updatePurchaseQuantity(
                                                subAction.id,
                                                maxValue
                                              );
                                            } else {
                                              updatePurchaseQuantity(
                                                subAction.id,
                                                value
                                              );
                                            }
                                          } else if (e.target.value === '') {
                                            updatePurchaseQuantity(
                                              subAction.id,
                                              0
                                            );
                                          }
                                        }}
                                        className='w-24 h-10 rounded-lg border-2 border-[#00313A]/10 focus:border-[#00B512] text-center font-semibold'
                                        placeholder='0'
                                      />
                                      <span className='text-sm text-[#00313A]/60 dark:text-gray-400'>
                                        x{' '}
                                        {formatPrice(
                                          subAction.price,
                                          selectedAction.currency
                                        )}{' '}
                                        ={' '}
                                        {purchaseData[subAction.id]?.quantity
                                          ? formatPrice(
                                            (
                                              parseFloat(subAction.price) *
                                              purchaseData[subAction.id]
                                                .quantity
                                            ).toString(),
                                            selectedAction.currency
                                          )
                                          : formatPrice(
                                            '0',
                                            selectedAction.currency
                                          )}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Buyer Data Form - Collect Buyer Fields */}
                                  {purchaseData[subAction.id]?.quantity && purchaseData[subAction.id].quantity > 0 && (
                                    <div className="space-y-3 bg-gradient-to-br from-[#f0fff4] via-[#e6f9f0] to-[#f6fff9] rounded-lg p-4 border border-[#00B512]/10">
                                      <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xs font-semibold text-[#00B512]">Buyer Information</span>
                                        <User className="w-4 h-4 text-[#00B512]" />
                                      </div>
                                      
                                      <div className="space-y-3">
                                        {selectedAction?.buyerFields && selectedAction.buyerFields.length > 0 ? (
                                          selectedAction.buyerFields.map((field) => (
                                            renderBuyerField(
                                              field,
                                              subAction.id,
                                              purchaseData[subAction.id]?.buyerData?.[field] || '',
                                              !['notes'].includes(field) // All fields are required except notes
                                            )
                                          ))
                                        ) : (
                                          // Fallback to default fields if buyerFields is not configured
                                          <>
                                            {renderBuyerField('fullName', subAction.id, purchaseData[subAction.id]?.buyerData?.fullName || '', true)}
                                            {renderBuyerField('email', subAction.id, purchaseData[subAction.id]?.buyerData?.email || '', true)}
                                            {renderBuyerField('phone', subAction.id, purchaseData[subAction.id]?.buyerData?.phone || '', true)}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Error Message */}
                                  {purchaseError[subAction.id] && (
                                    <div className='bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-lg text-xs'>
                                      {purchaseError[subAction.id]}
                                    </div>
                                  )}

                                  {/* Purchase Button */}
                                  <CustomButton
                                    onClick={() => handlePurchase(subAction)}
                                    disabled={
                                      !purchaseData[subAction.id]?.quantity ||
                                      purchaseData[subAction.id].quantity <=
                                      0 ||
                                      purchasing[subAction.id]
                                    }
                                    className='w-full h-11 bg-[#00B512] dark:bg-[#D4AF37] text-white rounded-lg font-bold shadow-lg hover:bg-[#1fd331] dark:hover:bg-[#C9A530] disabled:opacity-50 disabled:cursor-not-allowed'
                                  >
                                    {purchasing[subAction.id] ? (
                                      <span className='flex items-center justify-center gap-2'>
                                        <Loader2 className='w-4 h-4 animate-spin' />
                                        Processing...
                                      </span>
                                    ) : (
                                      <span className='flex items-center justify-center gap-2'>
                                        <CreditCard className='w-4 h-4' />
                                        Purchase
                                      </span>
                                    )}
                                  </CustomButton>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <CustomButton
              variant='outline'
              onClick={() => setIsSubActionsModalOpen(false)}
              className='border-2 border-[#00B512] text-[#00B512] rounded-xl font-bold hover:bg-[#00B512] hover:text-white'
            >
              Close
            </CustomButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
};

export default WelcomeProfilePage;
