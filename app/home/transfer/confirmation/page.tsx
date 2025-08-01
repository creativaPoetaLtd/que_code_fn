"use client";

import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { ArrowLeft, CheckCircle, Shield, Clock, CreditCard, Smartphone } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getCurrentUserId, transferMoney, getWalletBalance } from "@/helpers/api";

interface Recipient {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  isOnline: boolean;
}

const ConfirmationPage = () => {
  const router = useRouter();
  const [amount, setAmount] = useState("5000");
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);

  useEffect(() => {
    // Get transfer data from session storage
    const transferData = sessionStorage.getItem('transferData');
    const transferAmount = sessionStorage.getItem('transferAmount');
    
    if (transferData && transferAmount) {
      const data = JSON.parse(transferData);
      setAmount(transferAmount);
      setRecipient(data.recipient);
    } else {
      router.push('/home/transfer');
    }
    // Fetch balance
    const fetchBalance = async () => {
      setBalanceLoading(true);
      setBalanceError(null);
      try {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('User not found');
        const data = await getWalletBalance(userId);
        setCurrentBalance(Number(data.balance));
      } catch (err: any) {
        setBalanceError('Could not fetch balance');
      } finally {
        setBalanceLoading(false);
      }
    };
    fetchBalance();
  }, [router]);

  const transferAmount = parseFloat(amount);
  const remainingBalance = currentBalance ? currentBalance - transferAmount : 0;

  const handleConfirm = async () => {
    setIsLoading(true);
    setTransferError(null);
    try {
      const senderId = getCurrentUserId();
      if (!senderId || !recipient) throw new Error('User or recipient not found');
      const result = await transferMoney({
        senderId,
        receiverId: recipient.id,
        amount: Number(amount),
        description: 'Payment',
      });
      // Store transfer result for success page
      sessionStorage.setItem('transferResult', JSON.stringify(result));
      router.push('/home/transfer/success');
    } catch (err: any) {
      setTransferError(err?.response?.data?.message || 'Transfer failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-4 flex items-center lg:ml-20">
        <button onClick={() => router.back()} className="mr-3 p-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Review Transfer</h1>
      </div>

      {/* Main Content */}
      <div className="lg:ml-20 p-6 max-w-2xl mx-auto">
        {/* Success Indicator */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Send</h2>
          <p className="text-gray-500">Please review the details before confirming</p>
        </div>

        {/* Transfer Details Card */}
        <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-100">
          {/* Recipient Info */}
          <div className="flex items-center space-x-4 pb-6 border-b border-gray-100">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                <Image
                  src={recipient?.avatar || "/Images/Profile.png"}
                  alt={recipient?.name || "Recipient"}
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
              {recipient?.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{recipient?.name || "John Doe"}</h3>
              <p className="text-gray-500 flex items-center space-x-1">
                <Smartphone className="w-4 h-4" />
                <span>{recipient?.phone || "+250 788 123 456"}</span>
              </p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
          </div>

          {/* Transaction Details */}
          <div className="pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Transaction Summary</h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Transfer Amount</span>
                <span className="font-bold text-2xl text-gray-900">
                  RWF {parseFloat(amount).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Transaction Fee</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              
              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-bold text-xl text-gray-900">
                    RWF {parseFloat(amount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Info */}
        <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Account Balance</span>
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Current Balance</span>
              <span className="font-medium text-gray-900">RWF {currentBalance?.toLocaleString() || "Loading..."}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">After Transfer</span>
              <span className="font-medium text-gray-900">RWF {remainingBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        {/* <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center space-x-2 text-green-700">
            <Shield className="w-5 h-5" />
            <span className="font-medium">Secure Transfer</span>
          </div>
          <p className="text-sm text-green-600 mt-2">
            This transaction is protected by end-to-end encryption and will be processed instantly.
          </p>
        </div> */}

        {/* Confirm Button */}
        {transferError && <div className="text-red-500 text-center mb-4">{transferError}</div>}
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition text-lg flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing Transfer...</span>
            </>
          ) : (
            <span>Confirm Transfer</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ConfirmationPage;
