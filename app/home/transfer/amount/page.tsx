"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, Check, Shield, AlertCircle, Eye, EyeOff } from "lucide-react";
import Navigation from "@/components/Navigation";
import { getWalletBalance, getCurrentUserId, transferMoney } from "@/helpers/api";

interface Recipient {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  isOnline: boolean;
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

  const quickAmounts = [500, 1000, 2500, 5000, 10000, 25000];

  useEffect(() => {
    // Get recipient from session storage
    const storedRecipient = sessionStorage.getItem('selectedRecipient');
    if (storedRecipient) {
      setRecipient(JSON.parse(storedRecipient));
    } else {
      // If no recipient, redirect back
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

    if (pin.length !== 4) {
      setError("Please enter your 4-digit PIN");
      return;
    }

    if (!recipient) {
      setError("Recipient not found");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const senderId = getCurrentUserId();
      if (!senderId) throw new Error("User not found");
      const result = await transferMoney({
        senderId,
        receiverId: recipient.id,
        amount: Number(amount),
        description: "Payment",
      });
      // Optionally store result for success page
      sessionStorage.setItem('transferResult', JSON.stringify(result));
      router.push("/home/transfer/success");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Transfer failed');
    } finally {
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
        {step === 1 ? (
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
              <h2 className="text-2xl font-bold">RWF {balanceLoading ? 'Loading...' : balanceError ? balanceError : `RWF ${currentBalance?.toLocaleString()}`}</h2>
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
                    className="w-full text-2xl font-bold text-center py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
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

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
                    <div className="flex items-center space-x-2 text-red-700">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{error}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={pin.length !== 4 || loading}
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition text-lg"
                >
                  {loading ? 'Processing...' : 'Confirm Transfer'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AmountPage;
