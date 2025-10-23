"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, Check, Shield, AlertCircle, Eye, EyeOff } from "lucide-react";
import Navigation from "@/components/Navigation";
import { getUserBalance, transferMoney, getTransactionCategories, getOrganizationBalance, getUserWallet, getWalletRestrictions, getEntityBalance, getCurrentUserInfo, checkUserPinStatus } from "@/helpers/api";
import baseUrl from "@/helpers/baseUrl";
import { useAuthToken } from "@/hooks/use-auth-token";
import { getUserIdFromToken, isTokenExpired } from "@/utils/jwtUtils";
import { PinSetupModal } from "@/components/PinSetupModal";
import { PinResetModal } from "@/components/PinResetModal";

interface Recipient {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  isOnline: boolean;
  type?: 'user' | 'organization';
}

const AmountPage = () => {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [step, setStep] = useState(1);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [transferInProgress, setTransferInProgress] = useState(false);
  const [applyConstraints, setApplyConstraints] = useState(false);
  const [userRestrictions, setUserRestrictions] = useState<any[]>([]);
  const [restrictionsLoading, setRestrictionsLoading] = useState(false);
  const [organizationCategory, setOrganizationCategory] = useState<any>(null);
  const [organizationCategoryLoading, setOrganizationCategoryLoading] = useState(false);
  const { getToken } = useAuthToken();
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [showPinResetModal, setShowPinResetModal] = useState(false);
  const [checkingPinStatus, setCheckingPinStatus] = useState(true);

  const handlePinSetupSuccess = async () => {
    // After PIN setup, close modal and user can continue
    setShowPinSetupModal(false);
  };

  const handlePinResetSuccess = () => {
    // After PIN reset, close modal and allow user to try again
    setShowPinResetModal(false);
    setError("");
  };

  const quickAmounts = [500, 1000, 2500, 5000, 10000, 25000];

  // Function to fetch organization category
  const fetchOrganizationCategory = async () => {
    if (recipient?.type !== 'organization') return;
    
    setOrganizationCategoryLoading(true);
    try {
      const response = await fetch(`${baseUrl}/organizations/${recipient.id}/category`);
      if (response.ok) {
        const data = await response.json();
        setOrganizationCategory(data);
      }
    } catch (err) {
      console.error('Error fetching organization category:', err);
    } finally {
      setOrganizationCategoryLoading(false);
    }
  };

  // Function to fetch user restrictions
  const fetchUserRestrictions = async () => {
    if (recipient?.type !== 'organization') return;
    
    setRestrictionsLoading(true);
    try {
      const token = getToken();
      let currentUserId: string | null | undefined;
      if (token && !isTokenExpired(token)) {
        currentUserId = getUserIdFromToken(token);
      }
      if (!currentUserId) return;

      const walletResponse = await getUserWallet(currentUserId);
      console.log('Wallet response:', walletResponse);
      if (walletResponse.success) {
        console.log('Wallet data:', walletResponse.data);
        console.log('Wallet ID:', walletResponse.data.walletId);
        const restrictionsResponse = await getWalletRestrictions(walletResponse.data.walletId);
        if (restrictionsResponse.success) {
          setUserRestrictions(restrictionsResponse.data);
        }
      }
    } catch (err) {
      console.error('Error fetching user restrictions:', err);
    } finally {
      setRestrictionsLoading(false);
    }
  };

  useEffect(() => {
    // Get recipient from session storage
    const storedRecipient = sessionStorage.getItem('selectedRecipient');
    if (storedRecipient) {
      setRecipient(JSON.parse(storedRecipient));
    } else {
      // If no recipient, redirect back
      router.push('/home/transfer');
      return;
    }

    // Check PIN status and fetch balance
    const checkPinAndBalance = async () => {
      setBalanceLoading(true);
      setCheckingPinStatus(true);
      setBalanceError(null);
      
      try {
        const token = getToken();
        let userId: string | null | undefined;
        if (token && !isTokenExpired(token)) {
          userId = getUserIdFromToken(token);
        }
        if (!userId) throw new Error('User not found');

        // Check PIN status first
        try {
          const pinStatus = await checkUserPinStatus();
          if (!pinStatus.success || !pinStatus.data.hasPinSet) {
            setShowPinSetupModal(true);
          }
        } catch (pinError) {
          console.error('PIN status check failed:', pinError);
          // Continue to balance check even if PIN check fails
        }

        // Fetch balance
        let response;
        try {
          response = await getEntityBalance(userId, 'user');
        } catch (userError) {
          console.log('User balance failed, trying organization:', userError);
          // If user fails, try as organization
          response = await getEntityBalance(userId, 'organization');
        }
        
        if (response.success && response.data) {
          setCurrentBalance(Number(response.data.balance));
        } else {
          setBalanceError('Invalid balance data received');
        }
      } catch (err: any) {
        setBalanceError('Could not fetch balance');
      } finally {
        setBalanceLoading(false);
        setCheckingPinStatus(false);
      }
    };
    
    checkPinAndBalance();
  }, [router, getToken]);

  // Load transaction categories
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await getTransactionCategories();
        if (response.success) {
          setCategories(response.data);
          
          // For organizations, automatically select organization category and disable constraints
           if (recipient?.type === 'organization' && organizationCategory) {
             const orgCategory = response.data.find((cat: any) => cat.id === organizationCategory.id);
            if (orgCategory) {
              setSelectedCategory(orgCategory);
            }
            setApplyConstraints(false); // Organizations don't use constraints
           } else if (recipient?.type !== 'organization') {
            // For individual users, use 'Other' as default
            const defaultCategory = response.data.find((cat: any) => cat.name === 'Other');
            if (defaultCategory) {
              setSelectedCategory(defaultCategory);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, [recipient?.type]);

  // Fetch organization category and user restrictions when recipient changes
  useEffect(() => {
    if (recipient?.type === 'organization') {
      fetchOrganizationCategory();
      fetchUserRestrictions();
    }
  }, [recipient]);

  // Set organization category when it's loaded
  useEffect(() => {
    if (recipient?.type === 'organization' && organizationCategory && categories.length > 0) {
      const orgCategory = categories.find((cat: any) => cat.id === organizationCategory.id);
      if (orgCategory) {
        setSelectedCategory(orgCategory);
      }
    }
  }, [organizationCategory, categories, recipient]);

  const handleAmountSelect = (value: number) => {
    setAmount(value.toString());
    setError("");
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    setAmount(numericValue);
    setError("");
  };

  const handleContinue = () => {
    const numAmount = parseFloat(amount);

    if (!amount) {
      setError("Please enter an amount");
      return;
    }

    if (numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (currentBalance !== null && numAmount > currentBalance) {
      setError("Insufficient balance");
      return;
    }

    if (numAmount < 100) {
      setError("Minimum transfer amount is RWF 100");
      return;
    }


    setStep(2);
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (transferInProgress || loading) {
      console.log('Transfer already in progress, ignoring duplicate request');
      return;
    }

    if (pin.length !== 4) {
      setError("Please enter your 4-digit PIN");
      return;
    }

    if (!recipient) {
      setError("Recipient not found");
      return;
    }

    if (!selectedCategory) {
      setError("Please select a transaction category");
      return;
    }

    // Validate constraints requirements for individual user transfers
    if (recipient.type !== 'organization' && applyConstraints && !selectedCategory) {
      setError("Please select a category when applying spending constraints");
      return;
    }

    // Note: For organization transfers, allow backend to enforce unrestricted vs restricted balance rules.
    // We still show informational UI above, but do not block submission here.



    setTransferInProgress(true);
    setLoading(true);
    setError("");
    
    try {
      // Get current user info to determine sender type
      const currentUserInfo = getCurrentUserInfo();
      console.log('Current user info:', currentUserInfo);
      console.log('Account type detected:', currentUserInfo.accountType);
      console.log('User ID:', currentUserInfo.userId);
      console.log('Organization ID:', currentUserInfo.organizationId);
      
      if (!currentUserInfo.userId && !currentUserInfo.organizationId) {
        console.error('No user ID or organization ID found in token');
        throw new Error("User not found");
      }
      
      // Determine sender parameters based on account type
      let senderUserId: string | undefined;
      let senderOrganizationId: string | undefined;
      
      if (currentUserInfo.accountType === 'organization') {
        senderOrganizationId = currentUserInfo.organizationId || undefined;
      } else {
        senderUserId = currentUserInfo.userId || undefined;
      }
      
      // Determine receiver parameters based on recipient type
      let receiverUserId: string | undefined;
      let receiverOrganizationId: string | undefined;
      
      if (recipient.type === 'organization') {
        receiverOrganizationId = recipient.id;
      } else {
        receiverUserId = recipient.id;
      }
      
      console.log('Initiating transfer with data:', {
        senderUserId,
        senderOrganizationId,
        receiverUserId,
        receiverOrganizationId,
        amount: Number(amount),
        categoryId: selectedCategory?.id,
        accountType: currentUserInfo.accountType
      });
      
      // Additional debugging for wallet issue
      console.log('Transfer parameters being sent:', {
        senderUserId: senderUserId || 'undefined',
        senderOrganizationId: senderOrganizationId || 'undefined',
        receiverUserId: receiverUserId || 'undefined',
        receiverOrganizationId: receiverOrganizationId || 'undefined'
      });
      
      const result = await transferMoney({
        senderUserId,
        senderOrganizationId,
        receiverUserId,
        receiverOrganizationId,
        amount: Number(amount),
        description: "Payment",
        categoryId: selectedCategory?.id,
        applyConstraints: applyConstraints,
        pin
      });
      
      console.log('Transfer successful:', result);
      
      sessionStorage.setItem('transferResult', JSON.stringify(result));
      
      setTransferInProgress(false);
      setLoading(false);
      
      router.push("/home/transfer/success");
    } catch (err: any) {
      console.error('Transfer failed:', err);
      
      // Check if PIN setup is required
      if (err?.response?.data?.requiresPinSetup) {
        setShowPinSetupModal(true);
        setTransferInProgress(false);
        setLoading(false);
        return;
      }
      
      // Check if PIN is locked
      if (err?.response?.data?.message?.includes('locked') || err?.response?.data?.lockedUntil) {
        setShowPinResetModal(true);
        setTransferInProgress(false);
        setLoading(false);
        return;
      }
      
      // Handle PIN attempt errors with more specific feedback
      const errorMessage = err?.response?.data?.message || err?.message || 'Transfer failed';
      if (errorMessage.includes('PIN') && errorMessage.includes('attempt')) {
        setError(`${errorMessage} You can reset your PIN if you've forgotten it.`);
      } else {
        setError(errorMessage);
      }
      
      setTransferInProgress(false);
      setLoading(false);
    }
  };

  if (!recipient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-4 flex items-center lg:ml-20">
        <button 
          onClick={() => step === 1 ? router.back() : setStep(1)} 
          className="mr-3 p-2 hover:bg-gray-100 rounded-full transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">
          {step === 1 ? "Enter Amount" : "Confirm Transfer"}
        </h1>
      </div>

      {/* Main Content */}
      <div className="lg:ml-20 p-6 max-w-2xl mx-auto">
        {checkingPinStatus ? (
          /* Loading State */
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Setting up transfer...</h2>
            <p className="text-gray-500">Checking security settings</p>
          </div>
        ) : step === 1 ? (
          // Step 1: Amount Entry
          <>
            {/* Recipient Card */}
            <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                    <Image
                      src={recipient.avatar}
                      alt={recipient.name}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                  {recipient.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{recipient.name}</h3>
                  <p className="text-gray-500">{recipient.phone}</p>
                </div>
                <div className="bg-green-100 p-2 rounded-full">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            {/* Balance Display */}
            <div className="bg-gradient-to-r from-[#00313A] to-[#00252e] rounded-3xl p-6 mb-6 text-white">
              <p className="text-sm opacity-80 mb-1">Available Balance</p>
              <h2 className="text-2xl font-bold">{balanceLoading ? 'Loading...' : balanceError ? balanceError : `RWF ${currentBalance?.toLocaleString()}`}</h2>
            </div>

            {/* Amount Input */}
            <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                How much would you like to send?
              </label>
              
              <div className="relative mb-6">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0"
                  className="w-full text-4xl font-bold text-center py-4 border-0 focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-300"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-2xl font-medium text-gray-400">RWF</span>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => handleAmountSelect(quickAmount)}
                    disabled={quickAmount > (currentBalance || 0)}
                    className={`py-3 px-4 rounded-xl font-medium transition ${
                      amount === quickAmount.toString()
                        ? 'bg-green-600 text-white'
                        : (quickAmount > (currentBalance || 0))
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {quickAmount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

             {/* Category Selection - Only show for individual users, not organizations */}
             {recipient.type !== 'organization' && (
               <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-100">
                 <label className="block text-sm font-medium text-gray-700 mb-4">
                   Select Category
                 </label>
                 
                 {categoriesLoading ? (
                   <div className="text-center py-4">Loading categories...</div>
                 ) : (
                   <div className="grid grid-cols-2 gap-3">
                     {categories.map((category) => (
                       <button
                         key={category.id}
                         onClick={() => setSelectedCategory(category)}
                         className={`py-3 px-4 rounded-xl font-medium transition text-left ${
                           selectedCategory?.id === category.id
                             ? 'bg-green-600 text-white'
                             : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                         }`}
                       >
                         {category.name}
                       </button>
                     ))}
                   </div>
                 )}
               </div>
             )}

             {/* Apply Constraints Toggle - Only show for individual users, not organizations */}
             {recipient.type !== 'organization' && (
               <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-100">
                 <div className="flex items-center justify-between">
                   <div className="flex-1">
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Apply Spending Constraints
                     </label>
                     <p className="text-xs text-gray-500">
                       When enabled, the recipient will only be able to spend this money on the selected category
                     </p>
                   </div>
                   <button
                     onClick={() => setApplyConstraints(!applyConstraints)}
                     className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                       applyConstraints ? 'bg-green-600' : 'bg-gray-200'
                     }`}
                   >
                     <span
                       className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                         applyConstraints ? 'translate-x-6' : 'translate-x-1'
                       }`}
                     />
                   </button>
                 </div>
                 
                 {/* Constraints Warning */}
                 {applyConstraints && (
                   <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                     <div className="flex items-start space-x-3">
                       <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                       <div>
                         <p className="text-sm font-medium text-amber-800">
                           Spending Constraints Active
                         </p>
                         <p className="text-xs text-amber-700 mt-1">
                           The recipient will only be able to spend this money on the selected category. 
                           {!selectedCategory && " Please select a category above."}
                         </p>
                       </div>
                     </div>
                   </div>
                 )}
               </div>
             )}

            {/* Organization Transfer Information */}
            {recipient.type === 'organization' && (
              <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 mb-6">
                <div className="flex items-start space-x-3">
                  <Shield className="w-6 h-6 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-800 mb-2">Organization Transfer</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      When you send money to an organization, the money becomes unrestricted and can be spent on any category by the organization.
                    </p>
                    
                    {/* Organization Category */}
                    {organizationCategoryLoading ? (
                      <div className="bg-white border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-600">Loading organization category...</p>
                      </div>
                    ) : organizationCategory ? (
                      <div className="bg-white border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-600 font-medium">Organization Category:</p>
                        <p className="text-sm text-blue-800 font-medium">{organizationCategory.name}</p>
                        <p className="text-xs text-blue-600">{organizationCategory.description}</p>
                      </div>
                    ) : null}
                    
                    {/* User Restrictions */}
                    {userRestrictions.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                        <p className="text-xs text-amber-700">
                          <strong>Mixed Funds:</strong> You have both restricted and unrestricted funds. Only unrestricted funds can be sent to organizations.
                        </p>
                        <div className="mt-2">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-green-100 text-green-800 p-2 rounded">
                              <p className="font-medium">Unrestricted</p>
                              <p>{((currentBalance || 0) - userRestrictions.reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0)).toLocaleString()} RWF</p>
                            </div>
                            <div className="bg-amber-100 text-amber-800 p-2 rounded">
                              <p className="font-medium">Restricted</p>
                              <p>{userRestrictions.reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0).toLocaleString()} RWF</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-amber-600 font-medium">Your restricted categories:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {userRestrictions.map((restriction, index) => (
                                <span key={index} className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">
                                  {restriction.categoryName}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition text-lg"
            >
              Continue
            </button>
          </>
        ) : (
          // Step 2: PIN Entry
          <>
            {/* Summary Card */}
            <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-100">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Your Transfer</h3>
                <p className="text-gray-500">Enter your PIN to authorize this transaction</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">To:</span>
                  <span className="font-medium text-gray-900">{recipient.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-xl text-green-600">RWF {parseFloat(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Fee:</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
              </div>

              <form onSubmit={handleConfirm}>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Enter your 4-digit PIN
                </label>
                
                <div className="relative">
                  <input
                    type={showPin ? "text" : "password"}
                    value={pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setPin(value);
                      setError("");
                    }}
                    placeholder="••••"
                    className={`w-full text-2xl font-bold text-center py-4 border rounded-xl focus:ring-2 transition ${
                      pin.length === 0 ? 'border-gray-200 focus:ring-green-500 focus:border-green-500' :
                      pin.length < 4 ? 'border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500' :
                      'border-green-500 focus:ring-green-500 focus:border-green-500'
                    }`}
                    maxLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* PIN validation feedback */}
                <div className="mt-2 text-center">
                  {pin.length > 0 && pin.length < 4 && (
                    <p className="text-sm text-yellow-600">Enter {4 - pin.length} more digit{4 - pin.length !== 1 ? 's' : ''}</p>
                  )}
                  {pin.length === 4 && (
                    <p className="text-sm text-green-600 flex items-center justify-center">
                      <Check className="w-4 h-4 mr-1" />
                      PIN ready
                    </p>
                  )}
                </div>

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
                    <div className="flex items-center space-x-2 text-red-700">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{error}</span>
                    </div>
                  </div>
                )}

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setShowPinResetModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Forgot PIN?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={pin.length !== 4 || loading || transferInProgress}
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition text-lg"
                >
                  {loading || transferInProgress ? 'Processing...' : 'Confirm Transfer'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      <PinSetupModal
        open={showPinSetupModal}
        onOpenChange={setShowPinSetupModal}
        onSuccess={handlePinSetupSuccess}
      />
      <PinResetModal
        open={showPinResetModal}
        onOpenChange={setShowPinResetModal}
        onSuccess={handlePinResetSuccess}
      />
    </div>
  );
};

export default AmountPage;
