'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input, Button } from 'antd';
import {
  User,
  Sparkles,
  Star,
  DollarSign,
  CreditCard,
  Coins,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Ticket,
  Calendar,
  Clock,
  ChevronRight,
  Loader2,
  QrCode,
  Phone,
  Share2,
  Menu as MenuIcon,
  UserPlus,
  MapPin,
  Image as ImageIcon,
  MessageSquare,
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
  showSocialLinksOnWelcome?: boolean;
  showGalleryOnWelcome?: boolean;
  showOrgStatsOnWelcome?: boolean;
  showActionsOnWelcome?: boolean;
  showSendMoneyOnWelcome?: boolean;
  showContactFormOnWelcome?: boolean;
  showOtherInfoOnWelcome?: boolean;
  showFriendRequestOnWelcome?: boolean;
  // Social media links
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
}

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

interface GalleryItem {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
}

interface OrgStats {
  scansThisWeek: number;
  totalBookings: number;
  audienceRating: number;
  liveActionsCount: number;
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
  minPrice?: string;
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
  wallet?: {
    id: string;
    balance: number;
    currency: string;
  };
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

  // Friendship / contact status
  type RelationshipStatus = 'none' | 'active' | 'blocked' | 'pending_invitation';
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus>('none');
  const [friendRequestLoading, setFriendRequestLoading] = useState(false);

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
  const [purchaseResult, setPurchaseResult] = useState<{
    referenceId: string;
    description: string;
    buyerBalanceAfter: number;
    buyerCurrency: string;
    qrCodeData?: string;
  } | null>(null);
  const [isPurchaseSuccessOpen, setIsPurchaseSuccessOpen] = useState(false);

  // Gallery state
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryPreviewIndex, setGalleryPreviewIndex] = useState<number | null>(null);

  // Organization stats state
  const [orgStats, setOrgStats] = useState<OrgStats | null>(null);
  const [orgStatsLoading, setOrgStatsLoading] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isGalleryModalOpen || galleryPreviewIndex === null || gallery.length === 0) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsGalleryModalOpen(false);
        setGalleryPreviewIndex(null);
        return;
      }

      if (event.key === 'ArrowLeft') {
        setGalleryPreviewIndex(prev => {
          if (prev === null || gallery.length === 0) return prev;
          return (prev - 1 + gallery.length) % gallery.length;
        });
        return;
      }

      if (event.key === 'ArrowRight') {
        setGalleryPreviewIndex(prev => {
          if (prev === null || gallery.length === 0) return prev;
          return (prev + 1) % gallery.length;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gallery.length, galleryPreviewIndex, isGalleryModalOpen]);

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
          showSocialLinksOnWelcome:
            profile.showSocialLinksOnWelcome !== undefined
              ? profile.showSocialLinksOnWelcome
              : true,
          showGalleryOnWelcome:
            profile.showGalleryOnWelcome !== undefined
              ? profile.showGalleryOnWelcome
              : true,
          showOrgStatsOnWelcome:
            profile.showOrgStatsOnWelcome !== undefined
              ? profile.showOrgStatsOnWelcome
              : true,
          showActionsOnWelcome:
            profile.showActionsOnWelcome !== undefined
              ? profile.showActionsOnWelcome
              : true,
          showSendMoneyOnWelcome:
            profile.showSendMoneyOnWelcome !== undefined
              ? profile.showSendMoneyOnWelcome
              : true,
          showContactFormOnWelcome:
            profile.showContactFormOnWelcome !== undefined
              ? profile.showContactFormOnWelcome
              : true,
          showOtherInfoOnWelcome:
            profile.showOtherInfoOnWelcome !== undefined
              ? profile.showOtherInfoOnWelcome
              : true,
          showFriendRequestOnWelcome:
            profile.showFriendRequestOnWelcome !== undefined
              ? profile.showFriendRequestOnWelcome
              : true,
          // Social media links
          socialLinks: profile.socialLinks || {
            instagram: '',
            facebook: '',
            twitter: '',
            linkedin: '',
          },
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
          showSocialLinksOnWelcome: true,
          showGalleryOnWelcome: true,
          showOrgStatsOnWelcome: true,
          showActionsOnWelcome: true,
          showSendMoneyOnWelcome: true,
          showContactFormOnWelcome: true,
          showOtherInfoOnWelcome: true,
          showFriendRequestOnWelcome: true,
        });
        setError(
          `Could not load profile data for user ID: ${userId.substring(0, 8)}...`
        );
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, getToken]);

  // Fetch gallery (users and organizations)
  useEffect(() => {
    const fetchGallery = async () => {
      if (!userId) return;
      try {
        setGalleryLoading(true);
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        let galleryUrl = '';
        if (user.profileType === 'organization') {
          galleryUrl = `${baseUrl}/organizations/${userId}/gallery`;
        } else {
          galleryUrl = `${baseUrl}/profiles/${userId}/gallery`;
        }

        const response = await axios.get(galleryUrl, { headers });
        if (response.data && response.data.items) {
          setGallery(response.data.items);
        }
      } catch (error) {
        console.error('Error fetching gallery:', error);
        setGallery([]);
      } finally {
        setGalleryLoading(false);
      }
    };

    if (!loading) {
      fetchGallery();
    }
  }, [userId, user.profileType, loading, getToken]);

  // Fetch organization stats
  useEffect(() => {
    const fetchOrgStats = async () => {
      if (user.profileType !== 'organization' || !userId) return;
      try {
        setOrgStatsLoading(true);
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const statsUrl = `${baseUrl}/organizations/${userId}/stats`;

        const response = await axios.get(statsUrl, { headers });
        if (response.data) {
          setOrgStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching org stats:', error);
        setOrgStats(null);
      } finally {
        setOrgStatsLoading(false);
      }
    };

    if (user.profileType === 'organization' && !loading) {
      fetchOrgStats();
    }
  }, [user.profileType, userId, loading, getToken]);

  // Fetch relationship status (individual profiles only, when logged in)
  useEffect(() => {
    const fetchRelationshipStatus = async () => {
      if (!isLoggedIn || !userId || user.profileType === 'organization') return;
      try {
        const token = getToken();
        if (!token) return;
        const res = await axios.get(
          `${baseUrl}/contacts/search?query=${encodeURIComponent(userId)}&limit=1`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const results: Array<{ id: string; relationshipStatus: RelationshipStatus }> = res.data;
        const match = results.find(u => u.id === userId);
        if (match) setRelationshipStatus(match.relationshipStatus);
      } catch {
        // non-critical — keep default 'none'
      }
    };
    if (!loading) fetchRelationshipStatus();
  }, [userId, isLoggedIn, loading, user.profileType, getToken]);

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
        const resultData = response.data?.data;

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

        if (resultData?.transaction) {
          // Show enriched success dialog
          setPurchaseResult({
            referenceId: resultData.transaction.referenceId || '',
            description: resultData.transaction.description || '',
            buyerBalanceAfter: resultData.wallets?.buyer?.balanceAfter ?? 0,
            buyerCurrency: resultData.wallets?.buyer?.currency || 'RWF',
            qrCodeData: resultData.qrObject?.qrCodeData,
          });
          setIsPurchaseSuccessOpen(true);
        } else {
          // Fallback toast
          let description = `You have successfully purchased ${data.quantity} ${data.quantity === 1 ? 'item' : 'items'} of ${subAction.name}.`;
          if (selectedAction?.fulfillment?.postPurchaseMessage) {
            description += `\n\n${selectedAction.fulfillment.postPurchaseMessage}`;
          }
          toast({
            title: 'Purchase Successful!',
            description,
          });
        }

        // Refresh sub-actions to update stock
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
            className="w-full h-20 rounded-lg border-2 border-[#00313A]/10 focus:border-[#D4AF37] text-sm p-2 focus:outline-none text-black"
            placeholder={config.placeholder}
          />
        ) : (
          <CustomInput
            type={config.type}
            value={value || ''}
            onChange={(e) => updateBuyerData(subActionId, field, e.target.value)}
            className="h-9 rounded-lg border-2 border-[#00313A]/10 focus:border-[#D4AF37] text-sm text-black"
            placeholder={config.placeholder}
          />
        )}
      </div>
    );
  };

  const renderActionCard = (action: Action) => {
    const baseButtonClass = "bg-white/80 hover:bg-white rounded-xl border-2 border-[#D4AF37]/10 hover:border-[#D4AF37]/30 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] text-left group cursor-pointer";

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
                <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#E5C158] rounded-lg flex items-center justify-center shadow-sm">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-base font-bold text-[#00313A] group-hover:text-[#D4AF37] transition-colors">
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
                    <Calendar className="w-3 h-3 text-[#D4AF37]" />
                    <span>{formatDate(action.availability.startsAt)}</span>
                  </div>
                )}
                {action.pricing.mode && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-[#D4AF37]" />
                    <span className="capitalize">{action.pricing.mode} Pricing</span>
                  </div>
                )}
                {action.status && (
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    action.status === 'published' 
                      ? 'bg-[#D4AF37]/10 text-[#D4AF37]' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {action.status}
                  </div>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
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
            <h4 className="text-xl font-bold text-white group-hover:text-[#E5C158] transition-colors mb-2">
              {action.name}
            </h4>
            
            {action.shortDescription && (
              <p className="text-sm text-white/90 mb-4 line-clamp-2">
                {action.shortDescription}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {action.pricing.mode && (
                <div className="flex items-center gap-1 bg-[#D4AF37]/80 backdrop-blur-sm px-3 py-1 rounded-full text-white font-semibold">
                  <DollarSign className="w-3 h-3" />
                  <span className="capitalize">{action.pricing.mode}</span>
                </div>
              )}
              {action.status && (
                <div className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                  action.status === 'published' 
                    ? 'bg-[#D4AF37]/80 text-white' 
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
              <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#E5C158] rounded-lg flex items-center justify-center shadow-lg backdrop-blur-sm">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-white group-hover:text-[#E5C158] transition-colors">
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
                <div className="flex items-center gap-2 bg-[#D4AF37]/90 backdrop-blur-sm px-4 py-2 rounded-full text-white font-bold shadow-lg">
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
                    ? 'bg-[#D4AF37]/90 text-white' 
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
              <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#E5C158] rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#00313A] group-hover:text-[#D4AF37] transition-colors truncate">
                  {action.name}
                </h4>
                {action.pricing.mode && (
                  <p className="text-xs text-[#00313A]/60 capitalize">
                    {action.pricing.mode} • {action.status || 'active'}
                  </p>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
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
            <h4 className="text-sm font-bold text-[#00313A] group-hover:text-[#D4AF37] transition-colors mb-2 line-clamp-2">
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
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37]' 
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
    if (!amount) return;
    router.push(`/auth/login?redirect=${encodeURIComponent(`/welcome/${userId}`)}&recipientId=${userId}&amount=${amount}`);
  };

  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [friendMessageLoading, setFriendMessageLoading] = useState(false);

  const handleContactSubmit = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    try {
      setContactSubmitting(true);
      await axios.post(
        `${baseUrl}/outside-messages`,
        {
          receiverId: userId,
          senderName: contactForm.name,
          senderContact: contactForm.email,
          message: contactForm.message,
        }
      );
      toast({ title: 'Message sent!', description: `Your message has been sent to ${user.name}.` });
      setContactForm({ name: '', email: '', message: '' });
    } catch (err: any) {
      toast({ title: 'Failed to send message', description: err.response?.data?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleSendMessageToFriend = async () => {
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }

    if (relationshipStatus !== 'active') {
      toast({
        title: 'Friendship required',
        description: 'You can send direct messages after becoming friends.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setFriendMessageLoading(true);
      const token = getToken();
      if (!token) {
        toast({
          title: 'Authentication required',
          description: 'Please log in again to continue.',
          variant: 'destructive',
        });
        return;
      }

      const response = await axios.post(
        `${baseUrl}/chats/dm`,
        { participantId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const chatId = response?.data?.data?.chatId;
      if (chatId) {
        sessionStorage.setItem('pendingChatId', chatId);
      }

      router.push('/chat');
    } catch (err: any) {
      toast({
        title: 'Unable to open chat',
        description: err.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setFriendMessageLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!isLoggedIn) { router.push('/auth/login'); return; }
    if (relationshipStatus !== 'none') return;
    try {
      setFriendRequestLoading(true);
      const token = getToken();
      await axios.post(
        `${baseUrl}/contact-invitations`,
        { inviteeId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRelationshipStatus('pending_invitation');
      toast({ title: 'Request sent!', description: `A contact request has been sent to ${user.name}.` });
    } catch (err: any) {
      toast({ title: 'Failed to send request', description: err.response?.data?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setFriendRequestLoading(false);
    }
  };

  const handleSocialMediaClick = (platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin') => {
    const url = user.socialLinks?.[platform];
    
    if (!url || url.trim() === '') {
      toast({ title: 'Not available', description: `${platform} link is not configured on this profile.` });
      return;
    }
    
    window.open(url, '_blank');
  };

  const openGalleryPreview = (index: number) => {
    if (gallery.length === 0) return;
    setGalleryPreviewIndex(index);
    setIsGalleryModalOpen(true);
  };

  const closeGalleryPreview = () => {
    setIsGalleryModalOpen(false);
    setGalleryPreviewIndex(null);
  };

  const goToPreviousGalleryItem = () => {
    setGalleryPreviewIndex(prev => {
      if (prev === null || gallery.length === 0) return prev;
      return (prev - 1 + gallery.length) % gallery.length;
    });
  };

  const goToNextGalleryItem = () => {
    setGalleryPreviewIndex(prev => {
      if (prev === null || gallery.length === 0) return prev;
      return (prev + 1) % gallery.length;
    });
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
    if (user.profileType === 'organization') {
      if (user.showLogoOnWelcome !== false && user.logo) {
        return user.logo;
      }
      if (user.showProfileImageOnWelcome !== false) {
        return user.profileImage || user.avatar || '';
      }
      return '';
    }

    if (user.showProfileImageOnWelcome === false) {
      return '';
    }

    return user.profileImage || user.avatar || '';
  };

  // Function to get the display logo
  const getDisplayLogo = () => {
    return user.logo || '';
  };

  const isOrg = user.profileType === 'organization';
  const shouldShowProfileMedia = isOrg
    ? user.showProfileImageOnWelcome !== false || user.showLogoOnWelcome !== false
    : user.showProfileImageOnWelcome !== false;
  const shouldShowGallery = user.showGalleryOnWelcome !== false && gallery.length > 0;
  const shouldShowOrgStats = isOrg && user.showOrgStatsOnWelcome !== false;
  const shouldShowActions = isOrg && user.showActionsOnWelcome !== false;
  const shouldShowSendMoney = user.showSendMoneyOnWelcome !== false;
  const shouldShowContactForm = user.showContactFormOnWelcome !== false;
  const shouldShowOtherInfo = user.showOtherInfoOnWelcome !== false;
  const shouldShowSocialLinks = user.showSocialLinksOnWelcome !== false;
  const shouldShowOutsideContactForm = !isLoggedIn && shouldShowContactForm;
  const shouldShowFriendMessageButton =
    isLoggedIn && !isOrg && shouldShowContactForm && relationshipStatus === 'active';
  const shouldShowFriendshipRequest =
    !isOrg &&
    isHydrated &&
    user.showFriendRequestOnWelcome !== false &&
    (!isLoggedIn || relationshipStatus !== 'active');

  if (loading) {
    return (
      <>
        {isHydrated && isLoggedIn && <Header />}
        <div className="min-h-screen bg-[#0d1a0d] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-white/30 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      {isHydrated && isLoggedIn && <Header />}
      <div className={`min-h-screen ${isOrg ? 'bg-[#0a0f1e]' : 'bg-[#0d1a0d]'}`}>
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">

          {/* Profile header card */}
          <div className={`rounded-2xl p-6 md:p-8 ${isOrg ? 'bg-[#0f172a]' : 'bg-[#132213]'}`}>

            {/* Top bar */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2 border border-white/20 rounded-full px-4 py-2">
                <div className={`w-2 h-2 rounded-full ${isOrg ? 'bg-blue-400' : 'bg-[#4ade80]'}`} />
                <span className="text-xs font-bold text-white tracking-widest uppercase">
                  {isOrg ? 'QC PRO PROFILE' : 'QC PROFILE'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/welcome/${userId}`;
                    if (navigator.share) {
                      navigator.share({ title: user.name || 'QC Profile', url });
                    } else {
                      navigator.clipboard.writeText(url);
                      toast({ title: 'Link copied!', description: 'Profile link copied to clipboard.' });
                    }
                  }}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <Share2 className="w-4 h-4 text-white" />
                </button>
                <button className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <MenuIcon className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Profile row */}
            <div className="flex flex-col sm:flex-row gap-7 items-start">
              {shouldShowProfileMedia && (
                <div className="relative flex-shrink-0">
                  <div className={`w-36 h-36 rounded-full overflow-hidden border-4 bg-white/10 ${isOrg ? 'border-blue-500/40' : 'border-[#4ade80]/40'}`}>
                    {getDisplayImage() ? (
                      <img src={getDisplayImage()} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-14 h-14 text-white/30" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="bg-black/75 backdrop-blur-sm text-white/90 text-xs px-3 py-1 rounded-full font-medium">
                      {isOrg ? 'Professional QC identity' : 'Private QC identity'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex-1 min-w-0 mt-2 sm:mt-0">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">{user.name}</h1>

                <div className="flex flex-wrap gap-2 mb-4">
                  {user.showProfileTypeOnWelcome !== false && (
                    <span className="border border-white/25 rounded-full px-3 py-1 text-xs text-white/80">
                      {isOrg ? 'Professional account' : 'Personal account'}
                    </span>
                  )}
                  <span className="border border-white/25 rounded-full px-3 py-1 text-xs text-white/80">QC verified</span>
                  {isOrg && user.showCategoryOnWelcome !== false && user.categoryName && (
                    <span className="border border-white/25 rounded-full px-3 py-1 text-xs text-white/80">{user.categoryName}</span>
                  )}
                  {!isOrg && (
                    <span className="border border-white/25 rounded-full px-3 py-1 text-xs text-white/80">Friend-only chat</span>
                  )}
                </div>

                {user.showStatusMessageOnWelcome && user.statusMessage && (
                  <p className="text-white/60 text-sm mb-5 leading-relaxed max-w-xl">{user.statusMessage}</p>
                )}

                {/* Icon action buttons */}
                <div className="flex gap-3">
                  {isLoggedIn ? (
                    <button
                      onClick={handleSendMoney}
                      title={isOrg ? 'Pay' : 'Send Money'}
                      className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors"
                    >
                      <DollarSign className="w-5 h-5 text-white" />
                    </button>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors">
                          <DollarSign className="w-5 h-5 text-white" />
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>{isOrg ? 'Pay' : 'Send Money'}</DialogTitle></DialogHeader>
                        <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
                          <CustomInput type="number" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} className="h-12 rounded-xl" />
                          <DialogFooter>
                            <CustomButton type="submit" disabled={!amount} className={`w-full h-12 rounded-xl font-bold border-none ${isOrg ? 'bg-blue-500 text-white' : 'bg-[#4ade80] text-black'}`}>Next</CustomButton>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}

                  {!isOrg && isLoggedIn && relationshipStatus === 'active' && (
                    <button
                      onClick={handleSendMessageToFriend}
                      title="Send message"
                      className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors"
                    >
                      <MessageSquare className="w-5 h-5 text-white" />
                    </button>
                  )}

                  {!isOrg && isLoggedIn && relationshipStatus !== 'active' && (
                    <button onClick={handleAddFriend} title="Add Friend" className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors">
                      <UserPlus className="w-5 h-5 text-white" />
                    </button>
                  )}

                  {isLoggedInAsOrganization && !isOrg && isLoggedIn && (
                    <button onClick={handleViewUserQRObjects} title="View QR" className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors">
                      <QrCode className="w-5 h-5 text-white" />
                    </button>
                  )}

                  <button 
                    onClick={() => setIsGalleryModalOpen(true)}
                    disabled={gallery.length === 0}
                    className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Gallery">
                    <ImageIcon className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Gallery Strip */}
            {shouldShowGallery && (
              <div className="mt-7 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg">{isOrg ? 'Gallery' : 'Status photos'}</h3>
                    <p className="text-white/40 text-sm">Tap a photo to preview it full screen.</p>
                  </div>
                  <button
                    onClick={() => openGalleryPreview(0)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                  >
                    Open gallery
                  </button>
                </div>

                {galleryLoading ? (
                  <div className="flex items-center gap-2 text-white/40 text-sm py-3">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading gallery...
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-white/15 scrollbar-track-transparent">
                    {gallery.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => openGalleryPreview(index)}
                        className="relative flex-shrink-0 w-40 sm:w-48 h-28 sm:h-32 rounded-2xl overflow-hidden border border-white/10 snap-start group text-left"
                        title={item.caption || 'Open photo'}
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.caption || 'Gallery item'}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-3">
                          {item.caption ? (
                            <p className="text-white text-xs font-semibold line-clamp-2">{item.caption}</p>
                          ) : (
                            <p className="text-white/70 text-xs">Open photo</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stats row — organisation only */}
            {shouldShowOrgStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-8 border-t border-white/5">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-xs mb-1">Scans this week</p>
                  <p className="text-3xl font-black text-white">{orgStatsLoading ? '—' : orgStats?.scansThisWeek || 0}</p>
                  <p className="text-white/30 text-xs mt-1">QR code scans</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-xs mb-1">Total bookings</p>
                  <p className="text-3xl font-black text-white">{orgStatsLoading ? '—' : orgStats?.totalBookings || 0}</p>
                  <p className="text-white/30 text-xs mt-1">Confirmed reservations</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-xs mb-1">Audience rating</p>
                  <p className="text-xl font-black text-white">{orgStatsLoading ? '—' : orgStats?.audienceRating.toFixed(1) || '0.0'} / 5</p>
                  <p className="text-white/30 text-xs mt-1">Customer satisfaction</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-xs mb-1">Live actions</p>
                  <p className="text-3xl font-black text-white">{actionsLoading ? '—' : actions.length}</p>
                  <p className="text-white/30 text-xs mt-1">Tickets & offers</p>
                </div>
              </div>
            )}
          </div>

          {/* Organisation: Actions section */}
          {shouldShowActions && (
            <div>
              <div className="mb-5">
                <h2 className="text-white font-bold text-xl">Actions</h2>
                <p className="text-white/40 text-sm mt-0.5">Buy, reserve, vote or access any offer directly from this profile.</p>
              </div>

              {actionsLoading ? (
                <div className="rounded-2xl bg-[#0f172a] flex items-center justify-center py-20 border border-white/5">
                  <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
                </div>
              ) : actions.length === 0 ? (
                <div className="rounded-2xl bg-[#0f172a] py-16 text-center border border-white/5">
                  <Ticket className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/30 font-medium">No actions available at the moment</p>
                </div>
              ) : (
                <>
                  {/* Featured action — first action, full-width split card */}
                  <div
                    className="rounded-2xl overflow-hidden flex flex-col md:flex-row mb-5 cursor-pointer border border-white/5 hover:border-white/10 transition-colors"
                    style={{ minHeight: 340 }}
                    onClick={() => handleActionClick(actions[0])}
                  >
                    <div className="md:w-1/2 relative bg-[#0f172a] min-h-48">
                      {actions[0].coverImage ? (
                        <img src={actions[0].coverImage} alt={actions[0].name} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 to-[#0a0f1e] flex items-center justify-center">
                          <Ticket className="w-16 h-16 text-blue-800" />
                        </div>
                      )}
                    </div>
                    <div className="md:w-1/2 bg-[#0f172a] p-7 flex flex-col justify-center">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="border border-white/20 rounded-full px-3 py-1 text-xs text-white/70">Featured action</span>
                        {actions[0].status === 'published' && (
                          <span className="border border-white/20 rounded-full px-3 py-1 text-xs text-white/70">New</span>
                        )}
                        <span className="border border-white/20 rounded-full px-3 py-1 text-xs text-white/70">Hot</span>
                      </div>
                      <h2 className="text-3xl font-black text-white mb-3 leading-tight">{actions[0].name}</h2>
                      {(actions[0].description || actions[0].shortDescription) && (
                        <p className="text-white/50 text-sm mb-5 line-clamp-3 leading-relaxed">
                          {actions[0].description || actions[0].shortDescription}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-5">
                        {actions[0].availability.startsAt && (
                          <span className="border border-white/15 rounded-full px-3 py-1 text-xs text-white/60">
                            {formatDate(actions[0].availability.startsAt)}
                          </span>
                        )}
                        {actions[0].pricing.mode && (
                          <span className="border border-white/15 rounded-full px-3 py-1 text-xs text-white/60 capitalize">
                            {actions[0].pricing.mode}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={e => { e.stopPropagation(); handleActionClick(actions[0]); }}
                          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-bold text-sm transition-colors"
                        >
                          Buy now
                        </button>
                        <button className="px-6 py-2.5 border border-white/20 rounded-xl text-white text-sm hover:bg-white/10 transition-colors">
                          View details
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remaining actions grid */}
                  {actions.length > 1 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {actions.slice(1).map(action => (
                        <button
                          key={action.id}
                          onClick={() => handleActionClick(action)}
                          className="relative rounded-2xl overflow-hidden text-left group border border-white/5 hover:border-white/10 transition-colors"
                          style={{ minHeight: 220 }}
                        >
                          {action.coverImage ? (
                            <img src={action.coverImage} alt={action.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#1e2a3a] to-[#0f172a]" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                            <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full capitalize">
                              {action.type || 'Buy'}
                            </span>
                            {action.minPrice && (
                              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-lg font-bold">
                                {action.currency} {parseFloat(action.minPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h4 className="text-white font-bold text-sm mb-1 line-clamp-2">{action.name}</h4>
                            {action.shortDescription && (
                              <p className="text-white/50 text-xs line-clamp-2 mb-2">{action.shortDescription}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-medium ${action.status === 'published' ? 'text-blue-400' : 'text-white/40'}`}>
                                {action.status === 'published' ? 'Available' : action.status}
                              </span>
                              <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-lg font-bold">
                                {action.type === 'vote' ? 'Vote' : action.type === 'booking' ? 'Reserve' : 'Buy'}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Bottom 2-col: Send me + Other infos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Left: Send me + Contact form */}
            <div className="space-y-5">

              {/* Send me */}
              {shouldShowSendMoney && (
              <div className={`rounded-2xl p-6 border border-white/5 ${isOrg ? 'bg-[#0f172a]' : 'bg-[#132213]'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-bold text-xl">Send me</h3>
                    <p className="text-white/40 text-sm">Fast, secure and private</p>
                  </div>
                  <span className="border border-white/15 text-white/40 text-xs px-3 py-1.5 rounded-full">
                    {isOrg ? 'Professional transfer' : 'Private transfer'}
                  </span>
                </div>
                <p className="text-white/40 text-sm mb-6">Send money quickly and securely through QC.</p>
                {isLoggedIn ? (
                  <button
                    onClick={handleSendMoney}
                    className={`w-full py-4 rounded-2xl font-bold text-sm transition-colors ${isOrg ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-[#4ade80] hover:bg-[#22c55e] text-black'}`}
                  >
                    Send me
                  </button>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className={`w-full py-4 rounded-2xl font-bold text-sm transition-colors ${isOrg ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-[#4ade80] hover:bg-[#22c55e] text-black'}`}>
                        Send me
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>{isOrg ? 'Pay' : 'Send Money'}</DialogTitle></DialogHeader>
                      <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
                        <CustomInput type="number" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} className="h-12 rounded-xl" />
                        <DialogFooter>
                          <CustomButton type="submit" disabled={!amount} className={`w-full h-12 rounded-xl font-bold border-none ${isOrg ? 'bg-blue-500 text-white' : 'bg-[#4ade80] text-black'}`}>Next</CustomButton>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              )}

              {/* Private contact form */}
              {shouldShowOutsideContactForm && (
              <div className={`rounded-2xl p-6 border border-white/5 ${isOrg ? 'bg-[#0f172a]' : 'bg-[#132213]'}`}>
                <h3 className="text-white font-bold text-xl mb-1">Private contact form</h3>
                <p className="text-white/40 text-sm mb-6">
                  {isOrg
                    ? 'Need more information, a partnership or a direct question? Use this form to contact the business securely.'
                    : 'If you are not logged in yet, you can send an outside message through this form.'}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-white/60 text-sm mb-1.5 block">Name</label>
                    <CustomInput
                      placeholder="Your name"
                      value={contactForm.name}
                      onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                      className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm mb-1.5 block">Email or phone</label>
                    <CustomInput
                      placeholder="Email or phone"
                      value={contactForm.email}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm mb-1.5 block">Message</label>
                    <Textarea
                      placeholder="Write your message here..."
                      value={contactForm.message}
                      onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                      rows={5}
                      className="rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleContactSubmit}
                      disabled={!contactForm.name || !contactForm.email || !contactForm.message || contactSubmitting}
                      className={`px-8 py-3 rounded-2xl font-bold text-sm disabled:opacity-40 transition-colors ${isOrg ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-[#4ade80] hover:bg-[#22c55e] text-black'}`}
                    >
                      {contactSubmitting ? 'Sending...' : 'Send message'}
                    </button>
                  </div>
                </div>
              </div>
              )}

              {shouldShowFriendMessageButton && (
                <div className={`rounded-2xl p-6 border border-white/5 ${isOrg ? 'bg-[#0f172a]' : 'bg-[#132213]'}`}>
                  <h3 className="text-white font-bold text-xl mb-1">Direct messages</h3>
                  <p className="text-white/40 text-sm mb-6">
                    You are friends. Continue this conversation in your messages tab.
                  </p>
                  <button
                    onClick={handleSendMessageToFriend}
                    disabled={friendMessageLoading}
                    className={`w-full py-4 rounded-2xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isOrg ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-[#4ade80] hover:bg-[#22c55e] text-black'}`}
                  >
                    {friendMessageLoading ? 'Opening chat...' : 'Send message'}
                  </button>
                </div>
              )}
            </div>

            {/* Right: Other infos + Friendship */}
            <div className="space-y-5">

              {/* Other infos */}
              {shouldShowOtherInfo && (
              <div className={`rounded-2xl p-6 border border-white/5 ${isOrg ? 'bg-[#0f172a]' : 'bg-[#132213]'}`}>
                <h3 className="text-white font-bold text-xl mb-1">Other infos</h3>
                <p className="text-white/40 text-sm mb-5">
                  {isOrg ? 'Public details and social links for this professional account.' : 'More ways to stay connected.'}
                </p>

                {(user.province || user.district || user.sector) && user.showLocationOnWelcome && (
                  <div className="rounded-xl bg-white/5 border border-white/5 px-4 py-3 mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-white/40 text-xs mb-0.5">Address</p>
                      <p className="text-white font-semibold text-sm">
                        {[user.district, user.sector, user.province].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <MapPin className="w-4 h-4 text-white/25 flex-shrink-0" />
                  </div>
                )}

                {user.showPhoneOnWelcome && user.phone && (
                  <div className="rounded-xl bg-white/5 border border-white/5 px-4 py-3 mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-white/40 text-xs mb-0.5">Phone number</p>
                      <p className="text-white font-semibold text-sm">+{user.phone}</p>
                    </div>
                    <Phone className="w-4 h-4 text-white/25 flex-shrink-0" />
                  </div>
                )}

                {shouldShowSocialLinks && (
                <div className="flex gap-3">
                  {user.socialLinks?.instagram && (
                    <button onClick={() => handleSocialMediaClick('instagram')} className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                      <Instagram className="w-4 h-4 text-white/60" />
                    </button>
                  )}
                  {user.socialLinks?.facebook && (
                    <button onClick={() => handleSocialMediaClick('facebook')} className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                      <Facebook className="w-4 h-4 text-white/60" />
                    </button>
                  )}
                  {user.socialLinks?.twitter && (
                    <button onClick={() => handleSocialMediaClick('twitter')} className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                      <Twitter className="w-4 h-4 text-white/60" />
                    </button>
                  )}
                  {user.socialLinks?.linkedin && (
                    <button onClick={() => handleSocialMediaClick('linkedin')} className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                      <Linkedin className="w-4 h-4 text-white/60" />
                    </button>
                  )}
                </div>
                )}
              </div>
              )}

              {/* Friendship request — only when not already friends */}
              {shouldShowFriendshipRequest && (
                <div className="rounded-2xl p-6 border border-white/5 bg-[#132213]">
                  <h3 className="text-white font-bold text-xl mb-3">Friendship request</h3>
                  <div className="mb-3">
                    <div className="inline-flex items-center gap-2 border border-white/20 rounded-full px-3 py-1.5">
                      <div className={`w-2 h-2 rounded-full ${
                        relationshipStatus === 'active' ? 'bg-[#4ade80]' :
                        relationshipStatus === 'pending_invitation' ? 'bg-yellow-400' :
                        'bg-white/30'
                      }`} />
                      <span className="text-white text-xs font-medium">
                        {relationshipStatus === 'active' ? 'Already friends' :
                         relationshipStatus === 'pending_invitation' ? 'Request sent' :
                         relationshipStatus === 'blocked' ? 'Blocked' :
                         'Not friends yet'}
                      </span>
                    </div>
                  </div>
                  <p className="text-white/40 text-sm mb-5">Send a friendship request to unlock more private interactions on QC.</p>
                  {isLoggedIn ? (
                    <button
                      onClick={handleAddFriend}
                      disabled={relationshipStatus !== 'none' || friendRequestLoading}
                      className="px-6 py-2.5 border border-white/20 rounded-xl text-white text-sm hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {friendRequestLoading ? 'Sending...' :
                       relationshipStatus === 'active' ? 'Already friends' :
                       relationshipStatus === 'pending_invitation' ? 'Request pending' :
                       'Add friend'}
                    </button>
                  ) : (
                    <button onClick={handleLoginClick} className="px-6 py-2.5 border border-white/20 rounded-xl text-white text-sm hover:bg-white/10 transition-colors">
                      Log in to send request
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Join QC footer — non-logged-in */}
          {isHydrated && !isLoggedIn && (
            <div className={`rounded-2xl p-6 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 ${isOrg ? 'bg-[#0f172a]' : 'bg-[#132213]'}`}>
              <div>
                <h3 className="text-white font-bold text-xl mb-1">Join QC</h3>
                <p className="text-white/40 text-sm">Create an account or log in to access the full QC experience.</p>
                <p className="text-white/20 text-xs mt-1">Create an account or log in to continue on QC.</p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <button onClick={handleSignupClick} className="px-6 py-2.5 border border-white/25 rounded-full text-white text-sm hover:bg-white/10 transition-colors">
                  Create account
                </button>
                <button onClick={handleLoginClick} className={`px-6 py-2.5 rounded-full font-bold text-sm transition-colors ${isOrg ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-[#4ade80] hover:bg-[#22c55e] text-black'}`}>
                  Log in
                </button>
              </div>
            </div>
          )}

        </div>

        {isHydrated && isLoggedIn && (
          <div className='lg:hidden'>
            <Navigation />
          </div>
        )}
      </div>

      {/* Sub-Actions Modal */}
      <Dialog open={isSubActionsModalOpen} onOpenChange={setIsSubActionsModalOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0f172a] border border-white/10 p-0 gap-0'>

          {/* Header with cover image */}
          {selectedAction?.coverImage ? (
            <div className="relative h-40 w-full overflow-hidden rounded-t-2xl flex-shrink-0">
              <img src={selectedAction.coverImage} alt={selectedAction.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="border border-white/20 rounded-full px-3 py-0.5 text-xs text-white/70 capitalize">{selectedAction.type || 'action'}</span>
                  {selectedAction.status === 'published' && <span className="border border-white/20 rounded-full px-3 py-0.5 text-xs text-white/70">Published</span>}
                </div>
                <h2 className="text-2xl font-black text-white leading-tight">{selectedAction?.name || 'Action Details'}</h2>
              </div>
              <button onClick={() => setIsSubActionsModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-colors text-lg leading-none">×</button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">{selectedAction?.name || 'Action Details'}</h2>
                  {selectedAction?.type && <p className="text-white/40 text-xs capitalize">{selectedAction.type}</p>}
                </div>
              </div>
              <button onClick={() => setIsSubActionsModalOpen(false)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors text-lg leading-none">×</button>
            </div>
          )}

          {selectedAction && (
            <div className="p-5 space-y-5">

              {/* Action meta row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {selectedAction.availability.startsAt && (
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-white/40 text-xs mb-1">Starts</p>
                    <p className="text-white text-xs font-semibold">{formatDate(selectedAction.availability.startsAt)}</p>
                  </div>
                )}
                {selectedAction.availability.endsAt && (
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-white/40 text-xs mb-1">Ends</p>
                    <p className="text-white text-xs font-semibold">{formatDate(selectedAction.availability.endsAt)}</p>
                  </div>
                )}
                {selectedAction.pricing.mode && (
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-white/40 text-xs mb-1">Pricing</p>
                    <p className="text-white text-xs font-semibold capitalize">{selectedAction.pricing.mode.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {selectedAction.currency && (
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-white/40 text-xs mb-1">Currency</p>
                    <p className="text-white text-xs font-semibold">{selectedAction.currency}</p>
                  </div>
                )}
              </div>

              {selectedAction.description && (
                <p className="text-white/50 text-sm leading-relaxed">{selectedAction.description}</p>
              )}

              {/* Sub-Actions */}
              <div>
                <h3 className="text-white font-bold text-base mb-3">Available options</h3>

                {subActionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-7 h-7 text-white/30 animate-spin" />
                  </div>
                ) : subActions.filter(s => s.isActive).length === 0 ? (
                  <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/5">
                    <Ticket className="w-10 h-10 text-white/15 mx-auto mb-3" />
                    <p className="text-white/30 font-medium text-sm">No options available for this action</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subActions
                      .filter(s => s.isActive)
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map(subAction => (
                        <div key={subAction.id} className="rounded-2xl overflow-hidden border border-white/5 bg-white/5">

                          {/* Cover image */}
                          {subAction.coverImage && (
                            <div className="relative h-36 w-full">
                              <img src={subAction.coverImage} alt={subAction.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 to-transparent" />
                            </div>
                          )}

                          <div className="p-5">
                            {/* Title + price row */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <h4 className="text-white font-bold text-base">{subAction.name}</h4>
                                {subAction.description && (
                                  <p className="text-white/40 text-sm mt-1">{subAction.description}</p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                {selectedAction?.pricing?.mode !== 'pay_what_you_want' && (
                                  <p className="text-blue-400 font-black text-lg">{formatPrice(subAction.price, selectedAction.currency)}</p>
                                )}
                                {subAction.stock !== null && (
                                  <span className="text-white/30 text-xs">{subAction.stock} left</span>
                                )}
                              </div>
                            </div>

                            {/* Wallet info for org viewing own sub-action */}
                            {subAction.wallet && currentUserId === userId && isLoggedInAsOrganization && (
                              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 mb-3 text-xs text-blue-300 font-semibold">
                                Wallet: {subAction.wallet.currency} {subAction.wallet.balance.toLocaleString()}
                              </div>
                            )}

                            {/* Metadata */}
                            {subAction.metadata && Object.keys(subAction.metadata).length > 0 && (
                              <div className="space-y-2 mb-3">
                                {subAction.metadata.benefits && Array.isArray(subAction.metadata.benefits) && (
                                  <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-white/40 text-xs font-semibold mb-2">Benefits</p>
                                    <ul className="space-y-1">
                                      {subAction.metadata.benefits.map((benefit: string, i: number) => (
                                        <li key={i} className="text-white/60 text-xs flex items-start gap-2">
                                          <span className="text-blue-400 mt-0.5">•</span>{benefit}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {subAction.metadata.seatType && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-white/30 text-xs">Seat type:</span>
                                    <span className="text-white/60 text-xs capitalize">{subAction.metadata.seatType}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* QR Code */}
                            {subAction.dedicatedQrCodeData && (
                              <div className="bg-white/5 rounded-xl p-4 mb-3 flex items-center gap-4">
                                <div className="bg-white rounded-lg p-2">
                                  <img src={subAction.dedicatedQrCodeData} alt="QR Code" className="w-20 h-20" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <QrCode className="w-4 h-4 text-blue-400" />
                                    <span className="text-white text-sm font-semibold">Your QR Code</span>
                                  </div>
                                  <p className="text-white/40 text-xs">Show this at the entry gate</p>
                                </div>
                              </div>
                            )}

                            {/* Purchase form */}
                            <div className="pt-4 border-t border-white/5 space-y-4">

                              {/* Pay what you want */}
                              {selectedAction?.pricing?.mode === 'pay_what_you_want' && (
                                <div>
                                  <label className="text-white/60 text-xs font-semibold mb-1.5 block">Amount ({selectedAction.currency})</label>
                                  <CustomInput
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={purchaseData[subAction.id]?.customAmount || ''}
                                    onChange={e => {
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
                                    className="h-10 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20"
                                    placeholder="Enter amount"
                                  />
                                </div>
                              )}

                              {/* Quantity */}
                              <div>
                                <label className="text-white/60 text-xs font-semibold mb-1.5 flex items-center gap-2">
                                  Quantity
                                  {(() => {
                                    const quota = selectedAction.availability.userQuota;
                                    const stock = subAction.stock !== null ? subAction.stock : null;
                                    const max = quota && stock !== null ? Math.min(quota, stock) : quota || stock;
                                    return max ? <span className="text-white/30 font-normal">(max {max})</span> : null;
                                  })()}
                                </label>
                                <div className="flex items-center gap-3">
                                  <CustomInput
                                    type="number"
                                    min="1"
                                    max={(() => {
                                      const quota = selectedAction.availability.userQuota;
                                      const stock = subAction.stock !== null ? subAction.stock : null;
                                      return quota && stock !== null ? Math.min(quota, stock) : quota || stock || undefined;
                                    })()}
                                    value={purchaseData[subAction.id]?.quantity || ''}
                                    onChange={e => {
                                      const value = parseInt(e.target.value);
                                      const quota = selectedAction.availability.userQuota;
                                      const stock = subAction.stock !== null ? subAction.stock : null;
                                      const max = quota && stock !== null ? Math.min(quota, stock) : quota || stock || null;
                                      if (!isNaN(value) && value >= 0) {
                                        updatePurchaseQuantity(subAction.id, max !== null && value > max ? max : value);
                                      } else if (e.target.value === '') {
                                        updatePurchaseQuantity(subAction.id, 0);
                                      }
                                    }}
                                    className="w-24 h-10 rounded-xl bg-white/5 border-white/10 text-white text-center placeholder:text-white/20"
                                    placeholder="0"
                                  />
                                  <span className="text-white/40 text-sm">
                                    ×{' '}
                                    {selectedAction?.pricing?.mode === 'pay_what_you_want'
                                      ? formatPrice((purchaseData[subAction.id]?.customAmount || 0).toString(), selectedAction.currency)
                                      : formatPrice(subAction.price, selectedAction.currency)}
                                    {' '}={' '}
                                    <span className="text-white font-bold">
                                      {purchaseData[subAction.id]?.quantity
                                        ? formatPrice(((selectedAction?.pricing?.mode === 'pay_what_you_want' ? (purchaseData[subAction.id]?.customAmount || 0) : parseFloat(subAction.price)) * purchaseData[subAction.id].quantity).toString(), selectedAction.currency)
                                        : formatPrice('0', selectedAction.currency)}
                                    </span>
                                  </span>
                                </div>
                              </div>

                              {/* Buyer fields */}
                              {purchaseData[subAction.id]?.quantity > 0 && (
                                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                                  <p className="text-white/40 text-xs font-semibold">Buyer information</p>
                                  {(selectedAction?.buyerFields?.length > 0
                                    ? selectedAction.buyerFields
                                    : ['fullName', 'email', 'phone']
                                  ).map(field =>
                                    renderBuyerField(field, subAction.id, purchaseData[subAction.id]?.buyerData?.[field] || '', field !== 'notes')
                                  )}
                                </div>
                              )}

                              {/* Error */}
                              {purchaseError[subAction.id] && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-xl text-xs">
                                  {purchaseError[subAction.id]}
                                </div>
                              )}

                              {/* CTA */}
                              <button
                                onClick={() => handlePurchase(subAction)}
                                disabled={!purchaseData[subAction.id]?.quantity || purchaseData[subAction.id].quantity <= 0 || purchasing[subAction.id]}
                                className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                              >
                                {purchasing[subAction.id] ? (
                                  <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                                ) : (
                                  <><CreditCard className="w-4 h-4" />
                                  {selectedAction.type === 'booking' ? 'Book Now' :
                                   selectedAction.type === 'vote' ? 'Vote' :
                                   selectedAction.type === 'donation' ? 'Donate' :
                                   selectedAction.type === 'subscription' ? 'Subscribe' :
                                   selectedAction.type === 'payment' || selectedAction.type === 'transport' ? 'Pay' :
                                   'Purchase'}</>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Purchase Success Dialog */}
      <Dialog open={isPurchaseSuccessOpen} onOpenChange={setIsPurchaseSuccessOpen}>
        <DialogContent className='bg-white dark:bg-darkBg-card border border-gray-200 dark:border-darkBorder-light rounded-3xl max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold text-[#00313A] dark:text-white flex items-center gap-3'>
              <div className='w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#E5C158] rounded-full flex items-center justify-center shadow-md'>
                <Star className='w-6 h-6 text-white' />
              </div>
              Purchase Successful!
            </DialogTitle>
          </DialogHeader>
          {purchaseResult && (
            <div className='space-y-5 py-4'>
              {/* Reference ID */}
              <div className='bg-[#FFF9E6] dark:bg-darkBg-interactive rounded-xl p-4 border border-[#D4AF37]/20'>
                <p className='text-xs font-semibold text-[#D4AF37] uppercase tracking-wide mb-1'>Receipt / Reference</p>
                <p className='text-base font-bold text-[#00313A] dark:text-white font-mono'>{purchaseResult.referenceId}</p>
              </div>

              {/* Description */}
              {purchaseResult.description && (
                <div className='bg-gray-50 dark:bg-darkBg-interactive rounded-xl p-4 border border-gray-200 dark:border-darkBorder-light'>
                  <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'>Purchase Summary</p>
                  <p className='text-sm text-[#00313A] dark:text-white'>{purchaseResult.description}</p>
                </div>
              )}

              {/* Updated Wallet Balance */}
              <div className='bg-gradient-to-br from-[#FFF9E6] to-[#FFFEF8] dark:from-darkBg-interactive dark:to-darkBg-card rounded-xl p-4 border-2 border-[#D4AF37]/20'>
                <p className='text-xs font-semibold text-[#D4AF37] uppercase tracking-wide mb-1'>Your New Wallet Balance</p>
                <p className='text-2xl font-bold text-[#00313A] dark:text-white'>
                  {purchaseResult.buyerCurrency} {purchaseResult.buyerBalanceAfter.toLocaleString()}
                </p>
              </div>

              {/* Post Purchase Message */}
              {selectedAction?.fulfillment?.postPurchaseMessage && (
                <div className='bg-gradient-to-br from-[#FFF9E6] to-[#FFFEF8] dark:bg-darkBg-interactive rounded-xl p-4 border-2 border-[#D4AF37]/20'>
                  <p className='text-xs font-semibold text-[#D4AF37] uppercase tracking-wide mb-1'>Message from Organizer</p>
                  <p className='text-sm font-bold text-[#00313A] leading-relaxed'>{selectedAction.fulfillment.postPurchaseMessage}</p>
                </div>
              )}

              {/* QR Code */}
              {purchaseResult.qrCodeData && (
                <div className='flex flex-col items-center gap-3 bg-white dark:bg-darkBg-main rounded-xl p-4 border-2 border-[#D4AF37]/20'>
                  <p className='text-xs font-semibold text-[#D4AF37] uppercase tracking-wide'>Your Ticket QR Code</p>
                  <img
                    src={purchaseResult.qrCodeData}
                    alt='Ticket QR Code'
                    className='w-40 h-40 rounded-lg'
                  />
                  <p className='text-xs text-gray-500 dark:text-gray-400 text-center'>Show this at the entry gate</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <CustomButton
              variant='outline'
              onClick={() => setIsPurchaseSuccessOpen(false)}
              className='border-2 border-[#D4AF37] text-[#D4AF37] rounded-xl font-bold hover:bg-[#D4AF37] hover:text-white'
            >
              Close
            </CustomButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gallery Modal */}
      <Dialog open={isGalleryModalOpen} onOpenChange={setIsGalleryModalOpen}>
        <DialogContent className='bg-black border border-white/10 rounded-3xl max-w-6xl max-h-[92vh] overflow-hidden p-0 gap-0'>
          <div className="relative">
            <DialogHeader className="absolute top-0 left-0 right-0 z-20 p-5 bg-gradient-to-b from-black/80 to-transparent">
              <DialogTitle className='text-white text-2xl font-bold flex items-center gap-2'>
                <ImageIcon className='w-6 h-6 text-blue-400' />
                {user.profileType === 'organization' ? 'Gallery' : 'Status Photos'}
              </DialogTitle>
              <p className='text-white/60 text-sm mt-1'>Use the arrows or keyboard to browse.</p>
            </DialogHeader>

            {galleryLoading ? (
              <div className='flex items-center justify-center min-h-[70vh]'>
                <Loader2 className='w-8 h-8 text-white/30 animate-spin' />
              </div>
            ) : gallery.length === 0 ? (
              <div className='text-center min-h-[70vh] flex flex-col items-center justify-center px-6'>
                <ImageIcon className='w-10 h-10 text-white/20 mx-auto mb-3' />
                <p className='text-white/40 font-medium'>No gallery items yet</p>
              </div>
            ) : galleryPreviewIndex !== null ? (
              (() => {
                const currentItem = gallery[galleryPreviewIndex];
                return (
                  <div className='relative min-h-[70vh] flex items-center justify-center bg-black'>
                    <button
                      onClick={closeGalleryPreview}
                      className='absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors'
                      aria-label='Close gallery'
                    >
                      ×
                    </button>

                    {gallery.length > 1 && (
                      <>
                        <button
                          onClick={goToPreviousGalleryItem}
                          className='absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors'
                          aria-label='Previous image'
                        >
                          <ChevronRight className='w-6 h-6 rotate-180' />
                        </button>
                        <button
                          onClick={goToNextGalleryItem}
                          className='absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors'
                          aria-label='Next image'
                        >
                          <ChevronRight className='w-6 h-6' />
                        </button>
                      </>
                    )}

                    <div className='w-full max-w-5xl px-4 py-16'>
                      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] items-start'>
                        <div className='relative rounded-3xl overflow-hidden bg-[#05070d] border border-white/10 shadow-2xl'>
                          <img
                            src={currentItem.imageUrl}
                            alt={currentItem.caption || 'Gallery preview'}
                            className='w-full max-h-[68vh] object-contain bg-black'
                          />
                        </div>

                        <div className='rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-4'>
                          <div>
                            <p className='text-white/40 text-xs uppercase tracking-wider mb-1'>Preview</p>
                            <h3 className='text-white font-bold text-lg'>
                              {currentItem.caption || 'Untitled image'}
                            </h3>
                            <p className='text-white/40 text-sm mt-1'>
                              {new Date(currentItem.createdAt).toLocaleString()}
                            </p>
                          </div>

                          <div className='rounded-2xl border border-white/10 bg-black/20 p-3'>
                            <p className='text-white/40 text-xs mb-2'>Photo {galleryPreviewIndex + 1} of {gallery.length}</p>
                            <div className='flex gap-2 overflow-x-auto pb-1'>
                              {gallery.map((item, index) => (
                                <button
                                  key={item.id}
                                  onClick={() => setGalleryPreviewIndex(index)}
                                  className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border transition-all ${index === galleryPreviewIndex ? 'border-blue-400 scale-105' : 'border-white/10 opacity-70 hover:opacity-100'}`}
                                  title={item.caption || `Image ${index + 1}`}
                                >
                                  <img src={item.imageUrl} alt={item.caption || 'Gallery thumbnail'} className='w-full h-full object-cover' />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WelcomeProfilePage;
