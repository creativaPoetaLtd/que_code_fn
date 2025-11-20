"use client"
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input, Button } from 'antd';
import { User, Heart, Sparkles, Star, Gift, DollarSign, CreditCard, Coins, Banknote, Wallet, Instagram, Facebook, Twitter, Mail, MessageSquare, Plus, Ticket, Calendar, Clock, ChevronRight, Loader2 } from 'lucide-react';
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
  DialogFooter
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
  createdAt: string;
  updatedAt: string;
}

const WelcomeProfilePage = () => {
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
    message: ''
  });
  const { isAuthenticated, userId: currentUserId } = useUserInfo();
  const { getToken } = useAuthToken();
  const isLoggedIn = isAuthenticated;

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
  const [purchaseData, setPurchaseData] = useState<Record<string, { quantity: number; buyerData: { fullName: string; email: string; phone: string } }>>({});
  const [purchasing, setPurchasing] = useState<Record<string, boolean>>({});
  const [purchaseError, setPurchaseError] = useState<Record<string, string>>({});

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
        let effectiveOrganizationId = "";

        // Check if user data was successful
        if (userRes.status === 'fulfilled') {
          data = userRes.value.data;
          effectiveUserId = userId;
          effectiveOrganizationId = "";
        } else if (organizationRes.status === 'fulfilled') {
          // If user failed but organization succeeded, use organization data
          data = organizationRes.value.data;
          isOrganization = true;
          effectiveUserId = "";
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
          phone: isOrganization ? (data.contactPhone || '') : (data.phone || data.phoneNumber || data.mobile || ''),
          statusMessage: profile.statusMessage || '',
          showPhoneOnWelcome: profile.showPhoneOnWelcome !== undefined ? profile.showPhoneOnWelcome : true,
          showProfileImageOnWelcome: profile.showProfileImageOnWelcome !== undefined ? profile.showProfileImageOnWelcome : true,
          showStatusMessageOnWelcome: profile.showStatusMessageOnWelcome !== undefined ? profile.showStatusMessageOnWelcome : true,
          // Additional profile fields
          profileType: isOrganization ? 'organization' : (profile.type || 'individual'),
          province: profile.province || '',
          district: profile.district || '',
          sector: profile.sector || '',
          cell: profile.cell || '',
          tinNumber: profile.tinNumber || '',
          logo: profile.logo || '',
          operationalDocument: profile.operationalDocument || '',
          // Category information for organizations
          categoryId: isOrganization ? (data.categoryId || '') : '',
          categoryName: isOrganization ? (data.Category?.name || '') : '',
          categoryDescription: isOrganization ? (data.Category?.description || '') : '',
          // New visibility controls
          showProfileTypeOnWelcome: profile.showProfileTypeOnWelcome !== undefined ? profile.showProfileTypeOnWelcome : true,
          showLocationOnWelcome: profile.showLocationOnWelcome !== undefined ? profile.showLocationOnWelcome : true,
          showTinOnWelcome: profile.showTinOnWelcome !== undefined ? profile.showTinOnWelcome : true,
          showLogoOnWelcome: profile.showLogoOnWelcome !== undefined ? profile.showLogoOnWelcome : true,
          showCategoryOnWelcome: profile.showCategoryOnWelcome !== undefined ? profile.showCategoryOnWelcome : true,
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
        setError(`Could not load profile data for user ID: ${userId.substring(0, 8)}...`);
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
        minute: '2-digit'
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
      setPurchaseError(prev => ({ ...prev, [subAction.id]: 'Please enter a valid quantity' }));
      return;
    }

    // Validate userQuota
    const userQuota = selectedAction.availability.userQuota;
    if (userQuota && data.quantity > userQuota) {
      setPurchaseError(prev => ({ ...prev, [subAction.id]: `Maximum quantity allowed is ${userQuota}` }));
      return;
    }

    // Validate stock availability
    if (subAction.stock !== null && data.quantity > subAction.stock) {
      setPurchaseError(prev => ({ ...prev, [subAction.id]: `Only ${subAction.stock} items available` }));
      return;
    }

    // Validate buyer data
    if (!data.buyerData.fullName || !data.buyerData.email || !data.buyerData.phone) {
      setPurchaseError(prev => ({ ...prev, [subAction.id]: 'Please fill in all buyer information' }));
      return;
    }

    try {
      setPurchasing(prev => ({ ...prev, [subAction.id]: true }));
      setPurchaseError(prev => ({ ...prev, [subAction.id]: '' }));

      const token = getToken();
      if (!token) {
        setPurchaseError(prev => ({ ...prev, [subAction.id]: 'Please login to purchase' }));
        setPurchasing(prev => ({ ...prev, [subAction.id]: false }));
        return;
      }

      if (!currentUserId) {
        setPurchaseError(prev => ({ ...prev, [subAction.id]: 'User ID not found. Please login again.' }));
        setPurchasing(prev => ({ ...prev, [subAction.id]: false }));
        return;
      }

      const purchaseUrl = `${baseUrl}/actions/${selectedAction.id}/purchase`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const requestBody = {
        subActionId: subAction.id,
        quantity: data.quantity,
        buyerId: currentUserId, // Add buyerId from logged-in user
        buyerData: data.buyerData
      };

      const response = await axios.post(purchaseUrl, requestBody, { headers });

      if (response.data) {
        toast({
          title: "Purchase Successful!",
          description: `You have successfully purchased ${data.quantity} ${data.quantity === 1 ? 'item' : 'items'} of ${subAction.name}.`,
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
          // Immediately refresh to get updated stock
          await fetchSubActions(selectedAction.id);
        }
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Purchase failed. Please try again.';
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
        ...prev[subActionId],
        quantity: numQuantity,
        buyerData: prev[subActionId]?.buyerData || { fullName: '', email: '', phone: '' }
      }
    }));
    setPurchaseError(prev => ({ ...prev, [subActionId]: '' }));
  };

  const updateBuyerData = (subActionId: string, field: 'fullName' | 'email' | 'phone', value: string) => {
    setPurchaseData(prev => ({
      ...prev,
      [subActionId]: {
        quantity: prev[subActionId]?.quantity || 1,
        buyerData: {
          ...prev[subActionId]?.buyerData || { fullName: '', email: '', phone: '' },
          [field]: value
        }
      }
    }));
    setPurchaseError(prev => ({ ...prev, [subActionId]: '' }));
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
      type: user.profileType === 'organization' ? 'organization' : 'user' // Add type information
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
        <div className="min-h-screen bg-gradient-to-br from-[#013f47] via-[#025059] to-[#01363d] flex items-center justify-center px-4 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-10 w-20 h-20 md:w-32 md:h-32 lg:w-40 lg:h-40 bg-[#00B512]/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-24 h-24 md:w-40 md:h-40 lg:w-48 lg:h-48 bg-[#1fd331]/10 rounded-full blur-xl animate-pulse delay-700"></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 md:w-24 md:h-24 bg-white/5 rounded-full blur-lg animate-pulse delay-300"></div>

            {/* Floating Money Icons */}
            {[DollarSign, CreditCard, Coins, Banknote, Wallet].map((Icon, index) => (
              <div key={index} className={`absolute animate-bounce delay-${(index + 1) * 1000}`}
                style={{
                  top: `${Math.random() * 80 + 10}%`,
                  left: `${Math.random() * 80 + 10}%`,
                }}>
                <Icon className="w-4 h-4 md:w-6 md:h-6 text-[#00B512]/25 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Loading Card */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 flex flex-col items-center max-w-md w-full relative z-10">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-lg">
              <Gift className="w-8 h-8 text-white" />
            </div>

            <div className="relative mt-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#00B512]/30 border-t-[#00B512] mb-6 shadow-lg"></div>
              <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#00B512] animate-pulse" />
            </div>

            <div className="text-center space-y-3">
              <p className="text-[#00313A] font-semibold text-lg">Loading profile...</p>
              <div className="flex items-center justify-center gap-2">
                <Star className="w-4 h-4 text-[#00B512] animate-pulse" />
                <Star className="w-4 h-4 text-[#1fd331] animate-pulse delay-150" />
                <Star className="w-4 h-4 text-[#00B512] animate-pulse delay-300" />
              </div>
            </div>
          </div>

          <div className="lg:hidden">
            <Navigation />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {isHydrated && isLoggedIn && <Header />}
      <div className="min-h-screen bg-gradient-to-br from-[#013f47] via-[#025059] to-[#01363d] relative overflow-hidden">
        {/* Enhanced Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large Background Circles */}
          <div className="absolute top-10 left-10 w-20 h-20 md:w-32 md:h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48 bg-[#00B512]/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 bg-[#1fd331]/10 rounded-full blur-xl animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-white/5 rounded-full blur-lg animate-pulse delay-300"></div>
          <div className="absolute bottom-1/4 left-1/3 w-18 h-18 md:w-28 md:h-28 lg:w-36 lg:h-36 bg-[#00B512]/5 rounded-full blur-lg animate-pulse delay-500"></div>

          {/* Floating Money Icons */}
          {[
            { Icon: DollarSign, position: 'top-16 left-[10%]', delay: 1000 },
            { Icon: CreditCard, position: 'top-1/3 left-[20%]', delay: 1500 },
            { Icon: Coins, position: 'top-2/3 left-[15%]', delay: 2500 },
            { Icon: Banknote, position: 'bottom-1/3 left-[25%]', delay: 3500 },
            { Icon: Wallet, position: 'top-[80%] left-[12%]', delay: 4500 },
            { Icon: CreditCard, position: 'top-20 right-[10%]', delay: 1200 },
            { Icon: Coins, position: 'top-1/2 right-[20%]', delay: 2200 },
            { Icon: Banknote, position: 'bottom-1/3 right-[15%]', delay: 3200 },
            { Icon: Wallet, position: 'top-[75%] right-[25%]', delay: 4200 },
            { Icon: DollarSign, position: 'top-[10%] right-[12%]', delay: 5200 },
          ].map(({ Icon, position, delay }, index) => (
            <div key={index} className={`absolute ${position} animate-bounce delay-${delay}`}>
              <Icon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-[#00B512]/25 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Main Content Container */}
        <div className="container mx-auto px-4 py-8 lg:py-12 flex items-center justify-center min-h-screen relative z-10 ">
          {/* Desktop Layout: Two Column */}
          <div className="hidden lg:flex w-full max-w-4xl xl:max-w-5xl gap-8 xl:gap-12 items-center mx-auto">
            {/* Left Side - Profile Information */}
            <div className="flex-1 bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 xl:p-12 relative ">
              {/* Decorative top accent */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-lg">
                <Gift className="w-8 h-8 text-white" />
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-2xl mb-6 mt-4 shadow-sm">
                  <p className="text-sm font-medium text-center">{error}</p>
                </div>
              )}

              {/* Profile Section */}
              <div className="flex flex-col items-center mt-6 mb-8">
                {/* Avatar */}
                {user.showProfileImageOnWelcome && (
                  <div className="relative mb-6">
                    <div className="w-32 h-32 xl:w-40 xl:h-40 bg-gradient-to-br from-[#00313A] to-[#025059] rounded-full flex items-center justify-center shadow-xl border-4 border-white/20 overflow-hidden">
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
                        <User className="w-16 h-16 xl:w-20 xl:h-20 text-white" />
                      )}
                      {getDisplayImage() && (
                        <User className="w-16 h-16 xl:w-20 xl:h-20 text-white hidden absolute inset-0 m-auto" />
                      )}
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                      <Star className="w-4 h-4 text-[#00B512]" />
                    </div>
                  </div>
                )}

                {/* User Details */}
                <div className="text-center w-full">
                  <h1 className="text-3xl xl:text-4xl font-bold text-[#00313A] mb-3 leading-tight">
                    <b>{user.name}</b>
                    <span className="inline-block ml-3 text-2xl xl:text-3xl">💸</span>
                  </h1>

                  {user.showStatusMessageOnWelcome && user.statusMessage && (
                    <div className="bg-gradient-to-r from-[#00B512]/10 to-[#1fd331]/10 rounded-xl px-6 py-3 mb-4 border border-[#00B512]/20 max-w-md mx-auto">
                      <p className="text-[#00313A] text-sm font-medium italic">
                        "{user.statusMessage}"
                      </p>
                    </div>
                  )}

                  {user.showPhoneOnWelcome && user.phone && (
                    <p className="text-[#00313A]/80 font-medium text-sm mb-4">
                      <b>Tel: </b>+{user.phone}
                    </p>
                  )}

                  <div className="flex items-center justify-center gap-3 mb-6">
                    <Sparkles className="w-5 h-5 text-[#00B512] animate-pulse" />
                    <span className="text-lg font-semibold text-[#00313A]">
                      {user.profileType === 'organization' ? 'Pay' : 'Send Money'}
                    </span>
                    <Sparkles className="w-5 h-5 text-[#1fd331] animate-pulse delay-300" />
                  </div>
                </div>

                {/* Additional Profile Information */}
                <div className="w-full mt-6 space-y-6">
                  {/* Profile Type and Category Badges */}
                  <div className="flex justify-center gap-3 animate-fade-in">
                    {/* Profile Type Badge */}
                    {user.profileType && user.showProfileTypeOnWelcome && (
                      <div className={`px-6 py-3 rounded-full text-sm font-bold shadow-lg transform hover:scale-105 transition-all duration-300 ${user.profileType === 'organization'
                        ? 'bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white shadow-purple-500/25 hover:shadow-purple-500/40'
                        : 'bg-gradient-to-r from-[#00B512] via-[#1fd331] to-[#00B512] text-white shadow-[#00B512]/25 hover:shadow-[#00B512]/40'
                        }`}>
                        <span className="flex items-center gap-2">
                          {user.profileType === 'organization' ? '🏢' : '👤'}
                          {user.profileType === 'organization' ? 'Organization Account' : 'Individual Account'}
                        </span>
                      </div>
                    )}

                    {/* Category Badge for Organizations */}
                    {user.profileType === 'organization' && user.categoryName && user.showCategoryOnWelcome && (
                      <div className="px-6 py-3 rounded-full text-sm font-bold shadow-lg transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white shadow-blue-500/25 hover:shadow-blue-500/40">
                        <span className="flex items-center gap-2">
                          🏷️
                          {user.categoryName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex justify-center gap-4 w-full">
                      {isLoggedIn ? (
                        // For logged-in users, direct navigation (only for individual accounts)
                        user.profileType !== 'organization' ? (
                          <CustomButton
                            variant="default"
                            className="px-6 py-3 rounded-xl font-bold shadow-lg bg-gradient-to-r from-[#00B512] to-[#1fd331] text-white hover:shadow-xl transition-all duration-300 hover:scale-105"
                            onClick={handleSendMoney}
                          >
                            Send Money
                          </CustomButton>
                        ) : (
                          <CustomButton
                            variant="default"
                            className="px-6 py-3 rounded-xl font-bold shadow-lg bg-gradient-to-r from-[#00B512] to-[#1fd331] text-white hover:shadow-xl transition-all duration-300 hover:scale-105"
                            onClick={handleSendMoney}
                          >
                            Pay
                          </CustomButton>
                        )
                      ) : (
                        // For non-logged in users, show modal
                        <Dialog>
                          <DialogTrigger asChild>
                            <CustomButton variant="default" className="px-6 py-3 rounded-xl font-bold shadow-lg bg-gradient-to-r from-[#00B512] to-[#1fd331] text-white">
                              {user.profileType === 'organization' ? 'Pay' : 'Send Money'}
                            </CustomButton>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{user.profileType === 'organization' ? 'Pay' : 'Send Money'}</DialogTitle>
                            </DialogHeader>
                            <form className="space-y-6" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                                  <span>Amount ($)</span>
                                  <Sparkles className="w-4 h-4 text-[#00B512] animate-pulse" />
                                </label>
                                <CustomInput
                                  type="number"
                                  placeholder="Enter amount"
                                  value={amount}
                                  onChange={e => setAmount(e.target.value)}
                                  className="h-12 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] text-lg"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                                  <span>Message</span>
                                  <MessageSquare className="w-4 h-4 text-[#00B512] animate-pulse" />
                                </label>
                                <Textarea
                                  placeholder="Enter a message (optional)"
                                  className="rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] text-lg"
                                  rows={3}
                                />
                              </div>
                              <DialogFooter>
                                <CustomButton
                                  type="submit"
                                  variant="default"
                                  className="w-full h-12 bg-gradient-to-r from-[#00B512] to-[#1fd331] border-none rounded-xl font-bold text-white shadow-lg hover:shadow-xl text-lg"
                                  disabled={!amount}
                                >
                                  <b>Next</b>
                                </CustomButton>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}
                      {isLoggedIn && user.profileType !== 'organization' && (
                        <CustomButton
                          variant="outline"
                          className="px-6 py-3 border-2 border-[#00B512] text-[#00B512] rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#00B512] hover:text-white"
                          onClick={handleAddFriend}
                        >
                          <span className="flex items-center justify-center gap-3">
                            <Plus className="w-5 h-5" />
                            <b>Add Friend</b>
                          </span>
                        </CustomButton>
                      )}
                      {!isLoggedIn && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <CustomButton variant="outline" className="px-6 py-3 rounded-xl font-bold shadow-lg border-[#00B512] text-[#00B512]">
                              Contact
                            </CustomButton>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Contact {user.name}</DialogTitle>
                            </DialogHeader>
                            <form className="space-y-6" onSubmit={e => { e.preventDefault(); handleContactSubmit(); }}>
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                                  <span>Your Name</span>
                                  <User className="w-4 h-4 text-[#00B512] animate-pulse" />
                                </label>
                                <CustomInput
                                  placeholder="Enter your name"
                                  value={contactForm.name}
                                  onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                                  className="h-12 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] text-lg"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                                  <span>Email</span>
                                  <Mail className="w-4 h-4 text-[#1fd331] animate-pulse delay-150" />
                                </label>
                                <CustomInput
                                  type="email"
                                  placeholder="Enter your email"
                                  value={contactForm.email}
                                  onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                                  className="h-12 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] text-lg"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                                  <span>Message</span>
                                  <MessageSquare className="w-4 h-4 text-[#00B512] animate-pulse" />
                                </label>
                                <Textarea
                                  placeholder="Enter your message"
                                  value={contactForm.message}
                                  onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                                  className="rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] text-lg"
                                  rows={4}
                                />
                              </div>
                              <DialogFooter>
                                <CustomButton
                                  type="submit"
                                  variant="default"
                                  className="w-full h-12 bg-gradient-to-r from-[#00B512] to-[#1fd331] border-none rounded-xl font-bold text-white shadow-lg hover:shadow-xl text-lg"
                                  disabled={!contactForm.name || !contactForm.email || !contactForm.message}
                                >
                                  <b>Send Message</b>
                                </CustomButton>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                    {isLoggedIn ? (
                      <div className="w-full max-w-xs flex flex-col items-center gap-3 bg-gradient-to-br from-[#f0fff4] via-[#e6f9f0] to-[#f6fff9] rounded-2xl shadow-lg p-5 mt-2 border border-[#00B512]/10">
                        <div className="text-center mb-2">
                          <span className="block text-lg font-bold text-[#00B512] drop-shadow-sm">Welcome back!</span>
                          <span className="block text-sm text-[#00313A]/70 mt-1">You're all set to send money and connect 🎉</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full max-w-xs flex flex-col items-center gap-3 bg-gradient-to-br from-[#f0fff4] via-[#e6f9f0] to-[#f6fff9] rounded-2xl shadow-lg p-5 mt-2 border border-[#00B512]/10">
                        <div className="text-center mb-2">
                          <span className="block text-lg font-bold text-[#00B512] drop-shadow-sm">Join us now or sign in!</span>
                          <span className="block text-sm text-[#00313A]/70 mt-1">Enjoy secure, fast, and fun money transfers 🚀</span>
                        </div>
                        <div className="flex gap-3 w-full">
                          <CustomButton
                            variant="outline"
                            className="flex-1 h-12 border-2 border-[#00B512] text-[#00B512] rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#00B512] hover:text-white"
                            onClick={handleLoginClick}
                          >
                            <b>Login</b>
                          </CustomButton>
                          <CustomButton
                            variant="default"
                            className="flex-1 h-12 bg-[#00B512] border-2 border-[#00B512] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#1fd331]"
                            onClick={handleSignupClick}
                          >
                            <b>Sign Up</b>
                          </CustomButton>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Location Information */}
                  {(user.province || user.district || user.sector || user.cell) && user.showLocationOnWelcome && (
                    <div className="bg-gradient-to-br from-white via-[#f8fffa] to-[#f0fff4] rounded-2xl p-6 border-2 border-[#00B512]/10 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-fade-in">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-md animate-pulse">
                          <span className="text-white text-lg">📍</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#00313A]">Location Information</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {user.province && (
                          <div className="bg-white/60 rounded-xl p-3 border border-[#00B512]/10 hover:bg-white/80 transition-all duration-200">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[#00B512] text-sm">🏛️</span>
                              <span className="text-[#00B512] font-semibold text-sm">Province</span>
                            </div>
                            <span className="text-[#00313A] font-medium">{user.province}</span>
                          </div>
                        )}
                        {user.district && (
                          <div className="bg-white/60 rounded-xl p-3 border border-[#00B512]/10 hover:bg-white/80 transition-all duration-200">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[#00B512] text-sm">🏘️</span>
                              <span className="text-[#00B512] font-semibold text-sm">District</span>
                            </div>
                            <span className="text-[#00313A] font-medium">{user.district}</span>
                          </div>
                        )}
                        {user.sector && (
                          <div className="bg-white/60 rounded-xl p-3 border border-[#00B512]/10 hover:bg-white/80 transition-all duration-200">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[#00B512] text-sm">🏠</span>
                              <span className="text-[#00B512] font-semibold text-sm">Sector</span>
                            </div>
                            <span className="text-[#00313A] font-medium">{user.sector}</span>
                          </div>
                        )}
                        {user.cell && (
                          <div className="bg-white/60 rounded-xl p-3 border border-[#00B512]/10 hover:bg-white/80 transition-all duration-200">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[#00B512] text-sm">🏡</span>
                              <span className="text-[#00B512] font-semibold text-sm">Cell</span>
                            </div>
                            <span className="text-[#00313A] font-medium">{user.cell}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TIN Number */}
                  {user.tinNumber && user.showTinOnWelcome && (
                    <div className="bg-gradient-to-br from-white via-[#f8fffa] to-[#f0fff4] rounded-2xl p-6 border-2 border-[#00B512]/10 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-fade-in">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-md animate-pulse">
                          <span className="text-white text-lg">🏛️</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#00313A]">Tax Information</h3>
                      </div>
                      <div className="bg-white/60 rounded-xl p-4 border border-[#00B512]/10 hover:bg-white/80 transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <span className="text-[#00B512] font-bold text-lg">TIN</span>
                          <span className="text-[#00313A] font-mono font-bold text-lg bg-gradient-to-r from-[#00B512] to-[#1fd331] bg-clip-text text-transparent">
                            {user.tinNumber}
                          </span>
                        </div>
                        <p className="text-[#00313A]/70 text-sm mt-2">Tax Identification Number</p>
                      </div>
                    </div>
                  )}

                  {/* Organization Logo */}
                  {user.logo && user.showLogoOnWelcome && (
                    <div className="bg-gradient-to-br from-white via-[#f8fffa] to-[#f0fff4] rounded-2xl p-6 border-2 border-[#00B512]/10 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-fade-in">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-md animate-pulse">
                          <span className="text-white text-lg">🏢</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#00313A]">Organization Logo</h3>
                      </div>
                      <div className="flex justify-center">
                        <div className="bg-white/80 rounded-2xl p-4 border-2 border-[#00B512]/20 shadow-lg hover:shadow-xl transition-all duration-200">
                          <img
                            src={getDisplayLogo()}
                            alt="Organization Logo"
                            className="w-20 h-20 object-contain rounded-xl hover:scale-110 transition-transform duration-200"
                            onError={(e) => {
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
                        <div className="grid grid-cols-1 gap-4">
                          {actions.map((action) => (
                            <button
                              key={action.id}
                              onClick={() => handleActionClick(action)}
                              className="bg-white/80 hover:bg-white rounded-xl p-5 border-2 border-[#00B512]/10 hover:border-[#00B512]/30 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] text-left group"
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
                          ))}
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
                      // For non-logged in users, show modal
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
                                <Sparkles className="w-4 h-4 text-[#00B512] animate-pulse" />
                              </label>
                              <CustomInput
                                type="number"
                                placeholder="Enter amount"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="h-12 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] text-lg"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                                <span>Message</span>
                                <MessageSquare className="w-4 h-4 text-[#00B512] animate-pulse" />
                              </label>
                              <Textarea
                                placeholder="Enter a message (optional)"
                                className="rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] text-lg"
                                rows={3}
                              />
                            </div>
                            <DialogFooter>
                              <CustomButton
                                type="submit"
                                variant="default"
                                className="w-full h-12 bg-gradient-to-r from-[#00B512] to-[#1fd331] border-none rounded-xl font-bold text-white shadow-lg hover:shadow-xl text-lg"
                                disabled={!amount}
                              >
                                <b>Next</b>
                              </CustomButton>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}

                    {isLoggedIn && user.profileType !== 'organization' && (
                      <CustomButton
                        variant="outline"
                        className="w-full h-12 border-2 border-[#00B512] text-[#00B512] rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#00B512] hover:text-white"
                        onClick={handleAddFriend}
                      >
                        <span className="flex items-center justify-center gap-3">
                          <Plus className="w-5 h-5" />
                          <b>Add Friend</b>
                        </span>
                      </CustomButton>
                    )}

                    {!isLoggedIn && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <CustomButton variant="outline" className="w-full h-12 border-2 border-[#00B512] text-[#00B512] rounded-xl font-bold shadow-lg">
                            Contact
                          </CustomButton>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Contact {user.name}</DialogTitle>
                          </DialogHeader>
                          <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleContactSubmit(); }}>
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                                <span>Your Name</span>
                                <User className="w-4 h-4 text-[#00B512] animate-pulse" />
                              </label>
                              <CustomInput
                                placeholder="Enter your name"
                                value={contactForm.name}
                                onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                                className="h-12 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] text-lg"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                                <span>Email</span>
                                <Mail className="w-4 h-4 text-[#1fd331] animate-pulse delay-150" />
                              </label>
                              <CustomInput
                                type="email"
                                placeholder="Enter your email"
                                value={contactForm.email}
                                onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                                className="h-12 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] text-lg"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                                <span>Message</span>
                                <MessageSquare className="w-4 h-4 text-[#00B512] animate-pulse" />
                              </label>
                              <Textarea
                                placeholder="Enter your message"
                                value={contactForm.message}
                                onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                                className="rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] text-lg"
                                rows={4}
                              />
                            </div>
                            <DialogFooter>
                              <CustomButton
                                type="submit"
                                variant="default"
                                className="w-full h-12 bg-gradient-to-r from-[#00B512] to-[#1fd331] border-none rounded-xl font-bold text-white shadow-lg hover:shadow-xl text-lg"
                                disabled={!contactForm.name || !contactForm.email || !contactForm.message}
                              >
                                <b>Send Message</b>
                              </CustomButton>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  {/* Mobile Social Media Icons */}
                  <div className="flex justify-center gap-3 mt-4">
                    <button
                      onClick={() => handleSocialMediaClick('Instagram')}
                      className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 transform"
                    >
                      <Instagram className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => handleSocialMediaClick('Facebook')}
                      className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 transform"
                    >
                      <Facebook className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => handleSocialMediaClick('Twitter')}
                      className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 transform"
                    >
                      <Twitter className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  {/* Mobile Login and Signup Buttons with Sweet Message */}
                  {!isLoggedIn && (
                    <div className="w-full flex flex-col items-center gap-3 bg-gradient-to-br from-[#f0fff4] via-[#e6f9f0] to-[#f6fff9] rounded-2xl shadow-lg p-4 mt-2 border border-[#00B512]/10">
                      <div className="text-center mb-2">
                        <span className="block text-base font-bold text-[#00B512] drop-shadow-sm">Join us now or sign in!</span>
                        <span className="block text-xs text-[#00313A]/70 mt-1">Enjoy secure, fast, and fun money transfers 🚀</span>
                      </div>
                      <div className="flex gap-3 w-full">
                        <CustomButton
                          variant="outline"
                          className="flex-1 h-10 border-2 border-[#00B512] text-[#00B512] rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#00B512] hover:text-white"
                          onClick={handleLoginClick}
                        >
                          <b>Login</b>
                        </CustomButton>
                        <CustomButton
                          variant="default"
                          className="flex-1 h-10 bg-[#00B512] border-2 border-[#00B512] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#1fd331]"
                          onClick={handleSignupClick}
                        >
                          <b>Sign Up</b>
                        </CustomButton>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location Information */}
                {(user.province || user.district || user.sector || user.cell) && user.showLocationOnWelcome && (
                  <div className="bg-gradient-to-br from-white via-[#f8fffa] to-[#f0fff4] rounded-xl p-4 border-2 border-[#00B512]/10 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-sm animate-pulse">
                        <span className="text-white text-sm">📍</span>
                      </div>
                      <h3 className="text-sm font-bold text-[#00313A]">Location</h3>
                    </div>
                    <div className="space-y-2">
                      {user.province && (
                        <div className="bg-white/60 rounded-lg p-2 border border-[#00B512]/10 hover:bg-white/80 transition-all duration-200">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-[#00B512] text-xs">🏛️</span>
                            <span className="text-[#00B512] font-semibold text-xs">Province</span>
                          </div>
                          <span className="text-[#00313A] font-medium text-xs">{user.province}</span>
                        </div>
                      )}
                      {user.district && (
                        <div className="bg-white/60 rounded-lg p-2 border border-[#00B512]/10 hover:bg-white/80 transition-all duration-200">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-[#00B512] text-xs">🏘️</span>
                            <span className="text-[#00B512] font-semibold text-xs">District</span>
                          </div>
                          <span className="text-[#00313A] font-medium text-xs">{user.district}</span>
                        </div>
                      )}
                      {user.sector && (
                        <div className="bg-white/60 rounded-lg p-2 border border-[#00B512]/10 hover:bg-white/80 transition-all duration-200">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-[#00B512] text-xs">🏠</span>
                            <span className="text-[#00B512] font-semibold text-xs">Sector</span>
                          </div>
                          <span className="text-[#00313A] font-medium text-xs">{user.sector}</span>
                        </div>
                      )}
                      {user.cell && (
                        <div className="bg-white/60 rounded-lg p-2 border border-[#00B512]/10 hover:bg-white/80 transition-all duration-200">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-[#00B512] text-xs">🏡</span>
                            <span className="text-[#00B512] font-semibold text-xs">Cell</span>
                          </div>
                          <span className="text-[#00313A] font-medium text-xs">{user.cell}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TIN Number */}
                {user.tinNumber && user.showTinOnWelcome && (
                  <div className="bg-gradient-to-br from-white via-[#f8fffa] to-[#f0fff4] rounded-xl p-4 border-2 border-[#00B512]/10 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-sm animate-pulse">
                        <span className="text-white text-sm">🏛️</span>
                      </div>
                      <h3 className="text-sm font-bold text-[#00313A]">Tax Info</h3>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 border border-[#00B512]/10 hover:bg-white/80 transition-all duration-200">
                      <div className="flex items-center gap-2">
                        <span className="text-[#00B512] font-bold text-sm">TIN</span>
                        <span className="text-[#00313A] font-mono font-bold text-sm bg-gradient-to-r from-[#00B512] to-[#1fd331] bg-clip-text text-transparent">
                          {user.tinNumber}
                        </span>
                      </div>
                      <p className="text-[#00313A]/70 text-xs mt-1">Tax ID Number</p>
                    </div>
                  </div>
                )}

                {/* Organization Logo */}
                {user.logo && user.showLogoOnWelcome && (
                  <div className="bg-gradient-to-br from-white via-[#f8fffa] to-[#f0fff4] rounded-xl p-4 border-2 border-[#00B512]/10 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-sm animate-pulse">
                        <span className="text-white text-sm">🏢</span>
                      </div>
                      <h3 className="text-sm font-bold text-[#00313A]">Logo</h3>
                    </div>
                    <div className="flex justify-center">
                      <div className="bg-white/80 rounded-xl p-3 border-2 border-[#00B512]/20 shadow-md hover:shadow-lg transition-all duration-200">
                        <img
                          src={getDisplayLogo()}
                          alt="Organization Logo"
                          className="w-14 h-14 object-contain rounded-lg hover:scale-110 transition-transform duration-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Organization Actions Section - Mobile */}
                {user.profileType === 'organization' && (
                  <div className="bg-gradient-to-br from-white via-[#f8fffa] to-[#f0fff4] rounded-xl p-4 border-2 border-[#00B512]/10 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-sm animate-pulse">
                        <Ticket className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-sm font-bold text-[#00313A]">Available Actions</h3>
                    </div>

                    {actionsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-[#00B512] animate-spin" />
                      </div>
                    ) : actions.length === 0 ? (
                      <div className="text-center py-6">
                        <Ticket className="w-10 h-10 text-[#00B512]/30 mx-auto mb-2" />
                        <p className="text-xs text-[#00313A]/60 font-medium">No actions available</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {actions.map((action) => (
                          <button
                            key={action.id}
                            onClick={() => handleActionClick(action)}
                            className="w-full bg-white/80 hover:bg-white rounded-lg p-3 border-2 border-[#00B512]/10 hover:border-[#00B512]/30 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01] text-left group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-8 h-8 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                                    <Ticket className="w-4 h-4 text-white" />
                                  </div>
                                  <h4 className="text-sm font-bold text-[#00313A] group-hover:text-[#00B512] transition-colors truncate">
                                    {action.name}
                                  </h4>
                                </div>
                                
                                {action.shortDescription && (
                                  <p className="text-xs text-[#00313A]/70 mb-2 line-clamp-2">
                                    {action.shortDescription}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-2 text-xs text-[#00313A]/60">
                                  {action.availability.startsAt && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-[#00B512]" />
                                      <span className="truncate">{formatDate(action.availability.startsAt)}</span>
                                    </div>
                                  )}
                                  {action.pricing.mode && (
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="w-3 h-3 text-[#00B512]" />
                                      <span className="capitalize text-xs">{action.pricing.mode}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#00B512] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Decorative divider */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-[#00B512]/30 to-transparent mb-6"></div>

              {/* Debug Info */}
              {error && (
                <div className="bg-gray-50 rounded-2xl px-4 py-2 mb-6 shadow-inner">
                  <p className="text-xs text-gray-400 text-center">
                    Profile ID: {userId.substring(0, 8)}...
                  </p>
                </div>
              )}



              {/* Mobile Footer - Only for logged in users */}
              {isHydrated && isLoggedIn && (
                <div className="mt-6 text-center space-y-2">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Star className="w-3 h-3 text-[#00B512] animate-pulse" />
                    <Star className="w-3 h-3 text-[#1fd331] animate-pulse delay-150" />
                    <Star className="w-3 h-3 text-[#00B512] animate-pulse delay-300" />
                  </div>
                  <p className="text-xs text-[#00313A] font-medium">
                    QiewCode Made with <Heart className="w-3 h-3 text-[#00B512] inline mx-1 animate-pulse" />for you
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isHydrated && isLoggedIn && (
          <div className="lg:hidden">
            <Navigation />
          </div>
        )}
      </div>

      {/* Sub-Actions Modal */}
      <Dialog open={isSubActionsModalOpen} onOpenChange={setIsSubActionsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#00313A] flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-lg flex items-center justify-center shadow-md">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              {selectedAction?.name || 'Action Details'}
            </DialogTitle>
          </DialogHeader>

          {selectedAction && (
            <div className="space-y-6">
              {/* Action Details */}
              <div className="bg-gradient-to-br from-[#f0fff4] via-[#e6f9f0] to-[#f6fff9] rounded-xl p-5 border-2 border-[#00B512]/10">
                {selectedAction.description && (
                  <p className="text-sm text-[#00313A]/80 mb-4 leading-relaxed">
                    {selectedAction.description}
                  </p>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  {selectedAction.availability.startsAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#00B512]" />
                      <div>
                        <p className="text-xs text-[#00313A]/60 font-semibold">Start Date</p>
                        <p className="text-sm text-[#00313A] font-medium">{formatDate(selectedAction.availability.startsAt)}</p>
                      </div>
                    </div>
                  )}
                  {selectedAction.availability.endsAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#00B512]" />
                      <div>
                        <p className="text-xs text-[#00313A]/60 font-semibold">End Date</p>
                        <p className="text-sm text-[#00313A] font-medium">{formatDate(selectedAction.availability.endsAt)}</p>
                      </div>
                    </div>
                  )}
                  {selectedAction.pricing.mode && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-[#00B512]" />
                      <div>
                        <p className="text-xs text-[#00313A]/60 font-semibold">Pricing Mode</p>
                        <p className="text-sm text-[#00313A] font-medium capitalize">{selectedAction.pricing.mode}</p>
                      </div>
                    </div>
                  )}
                  {selectedAction.currency && (
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-[#00B512]" />
                      <div>
                        <p className="text-xs text-[#00313A]/60 font-semibold">Currency</p>
                        <p className="text-sm text-[#00313A] font-medium">{selectedAction.currency}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sub-Actions List */}
              <div>
                <h3 className="text-lg font-bold text-[#00313A] mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#00B512] animate-pulse" />
                  Available Options
                </h3>

                {subActionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-[#00B512] animate-spin" />
                  </div>
                ) : subActions.length === 0 ? (
                  <div className="text-center py-8 bg-gradient-to-br from-[#f0fff4] via-[#e6f9f0] to-[#f6fff9] rounded-xl border-2 border-[#00B512]/10">
                    <Ticket className="w-12 h-12 text-[#00B512]/30 mx-auto mb-3" />
                    <p className="text-[#00313A]/60 font-medium">No options available for this action</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subActions
                      .filter(subAction => subAction.isActive)
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((subAction) => (
                        <div
                          key={subAction.id}
                          className="bg-white rounded-xl p-5 border-2 border-[#00B512]/10 hover:border-[#00B512]/30 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-lg flex items-center justify-center shadow-sm">
                                  <Star className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="text-base font-bold text-[#00313A]">
                                    {subAction.name}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-lg font-bold text-[#00B512]">
                                      {formatPrice(subAction.price, selectedAction.currency)}
                                    </span>
                                    {subAction.stock !== null && (
                                      <span className="text-xs text-[#00313A]/60 bg-[#00B512]/10 px-2 py-1 rounded-full">
                                        {subAction.stock} available
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {subAction.description && (
                                <p className="text-sm text-[#00313A]/70 mb-3 ml-[52px]">
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

                              {/* Purchase Form */}
                              <div className="mt-4 ml-[52px] pt-4 border-t border-[#00B512]/10">
                                <div className="space-y-4">
                                  {/* Quantity Input */}
                                  <div className="space-y-2">
                                    <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                                      <span>Quantity</span>
                                      {(() => {
                                        const userQuota = selectedAction.availability.userQuota;
                                        const availableStock = subAction.stock !== null ? subAction.stock : null;
                                        
                                        if (userQuota && availableStock !== null) {
                                          const maxAllowed = Math.min(userQuota, availableStock);
                                          return (
                                            <span className="text-xs text-[#00313A]/60 font-normal">
                                              (Max: {maxAllowed} {userQuota !== availableStock ? `(Quota: ${userQuota}, Stock: ${availableStock})` : ''})
                                            </span>
                                          );
                                        } else if (userQuota) {
                                          return (
                                            <span className="text-xs text-[#00313A]/60 font-normal">
                                              (Max: {userQuota})
                                            </span>
                                          );
                                        } else if (availableStock !== null) {
                                          return (
                                            <span className="text-xs text-[#00313A]/60 font-normal">
                                              (Max: {availableStock} available)
                                            </span>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </label>
                                    <div className="flex items-center gap-3">
                                      <CustomInput
                                        type="number"
                                        min="1"
                                        max={(() => {
                                          const userQuota = selectedAction.availability.userQuota;
                                          const availableStock = subAction.stock !== null ? subAction.stock : null;
                                          
                                          if (userQuota && availableStock !== null) {
                                            return Math.min(userQuota, availableStock);
                                          }
                                          return userQuota || availableStock || undefined;
                                        })()}
                                        value={purchaseData[subAction.id]?.quantity || ''}
                                        onChange={(e) => {
                                          const value = parseInt(e.target.value);
                                          const userQuota = selectedAction.availability.userQuota;
                                          const availableStock = subAction.stock !== null ? subAction.stock : null;
                                          
                                          let maxValue: number | null = null;
                                          if (userQuota && availableStock !== null) {
                                            maxValue = Math.min(userQuota, availableStock);
                                          } else {
                                            maxValue = userQuota || availableStock || null;
                                          }
                                          
                                          if (!isNaN(value) && value >= 0) {
                                            if (maxValue !== null && value > maxValue) {
                                              updatePurchaseQuantity(subAction.id, maxValue);
                                            } else {
                                              updatePurchaseQuantity(subAction.id, value);
                                            }
                                          } else if (e.target.value === '') {
                                            updatePurchaseQuantity(subAction.id, 0);
                                          }
                                        }}
                                        className="w-24 h-10 rounded-lg border-2 border-[#00313A]/10 focus:border-[#00B512] text-center font-semibold"
                                        placeholder="0"
                                      />
                                      <span className="text-sm text-[#00313A]/60">
                                        x {formatPrice(subAction.price, selectedAction.currency)} = {
                                          purchaseData[subAction.id]?.quantity 
                                            ? formatPrice((parseFloat(subAction.price) * purchaseData[subAction.id].quantity).toString(), selectedAction.currency)
                                            : formatPrice('0', selectedAction.currency)
                                        }
                                      </span>
                                    </div>
                                  </div>

                                  {/* Buyer Data Form */}
                                  {purchaseData[subAction.id]?.quantity && purchaseData[subAction.id].quantity > 0 && (
                                    <div className="space-y-3 bg-gradient-to-br from-[#f0fff4] via-[#e6f9f0] to-[#f6fff9] rounded-lg p-4 border border-[#00B512]/10">
                                      <p className="text-xs font-semibold text-[#00B512] mb-2">Buyer Information</p>
                                      
                                      <div className="space-y-2">
                                        <div>
                                          <label className="text-xs font-semibold text-[#00313A] mb-1 block">Full Name *</label>
                                          <CustomInput
                                            type="text"
                                            value={purchaseData[subAction.id]?.buyerData?.fullName || ''}
                                            onChange={(e) => updateBuyerData(subAction.id, 'fullName', e.target.value)}
                                            className="h-9 rounded-lg border-2 border-[#00313A]/10 focus:border-[#00B512] text-sm"
                                            placeholder="Enter full name"
                                          />
                                        </div>
                                        
                                        <div>
                                          <label className="text-xs font-semibold text-[#00313A] mb-1 block">Email *</label>
                                          <CustomInput
                                            type="email"
                                            value={purchaseData[subAction.id]?.buyerData?.email || ''}
                                            onChange={(e) => updateBuyerData(subAction.id, 'email', e.target.value)}
                                            className="h-9 rounded-lg border-2 border-[#00313A]/10 focus:border-[#00B512] text-sm"
                                            placeholder="Enter email address"
                                          />
                                        </div>
                                        
                                        <div>
                                          <label className="text-xs font-semibold text-[#00313A] mb-1 block">Phone *</label>
                                          <CustomInput
                                            type="tel"
                                            value={purchaseData[subAction.id]?.buyerData?.phone || ''}
                                            onChange={(e) => updateBuyerData(subAction.id, 'phone', e.target.value)}
                                            className="h-9 rounded-lg border-2 border-[#00313A]/10 focus:border-[#00B512] text-sm"
                                            placeholder="Enter phone number"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Error Message */}
                                  {purchaseError[subAction.id] && (
                                    <div className="bg-red-50 border-2 border-red-200 text-red-800 px-3 py-2 rounded-lg text-xs">
                                      {purchaseError[subAction.id]}
                                    </div>
                                  )}

                                  {/* Purchase Button */}
                                  <CustomButton
                                    onClick={() => handlePurchase(subAction)}
                                    disabled={!purchaseData[subAction.id]?.quantity || purchaseData[subAction.id].quantity <= 0 || purchasing[subAction.id]}
                                    className="w-full h-11 bg-gradient-to-r from-[#00B512] to-[#1fd331] text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                  >
                                    {purchasing[subAction.id] ? (
                                      <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                      </span>
                                    ) : (
                                      <span className="flex items-center justify-center gap-2">
                                        <CreditCard className="w-4 h-4" />
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
              variant="outline"
              onClick={() => setIsSubActionsModalOpen(false)}
              className="border-2 border-[#00B512] text-[#00B512] rounded-xl font-bold hover:bg-[#00B512] hover:text-white transition-all duration-300"
            >
              Close
            </CustomButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
      
    </>
  );
};

export default WelcomeProfilePage;
