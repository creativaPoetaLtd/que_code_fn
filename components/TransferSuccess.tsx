"use client";

import React, { useEffect } from "react";
import { CheckCircle, Share2, Home, ReceiptText } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface TransferSuccessProps {
  amount: string;
  recipient: {
    name: string;
    id: string;
    avatar?: string;
  };
  transactionId?: string;
}

const TransferSuccess: React.FC<TransferSuccessProps> = ({
  amount,
  recipient,
  transactionId = "TXN" + Date.now()
}) => {
  const router = useRouter();

  useEffect(() => {
    // Clear any stored transfer data
    sessionStorage.removeItem('transferAmount');
  }, []);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Payment Confirmation',
        text: `Successfully sent RWF ${amount} to ${recipient.name}`,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(
        `Successfully sent RWF ${amount} to ${recipient.name}. Transaction ID: ${transactionId}`
      );
      alert('Transaction details copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-[#00313A] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Success Animation */}
      <div className="relative mb-8">
        <div className="w-32 h-32 bg-green-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
          <CheckCircle className="w-16 h-16 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full animate-bounce"></div>
      </div>

      {/* Success Message */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Transfer Successful!</h1>
        <p className="text-gray-300 text-lg">
          RWF {parseFloat(amount).toLocaleString()} sent successfully
        </p>
      </div>

      {/* Recipient Info */}
      <div className="bg-[#00252e] rounded-2xl p-6 mb-8 w-full max-w-md">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white/10">
            <Image
              src={recipient.avatar || "/Images/Profile.png"}
              alt={recipient.name}
              width={64}
              height={64}
              className="object-cover rounded-full"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{recipient.name}</h3>
            <p className="text-gray-400 text-sm">User ID: #{recipient.id}</p>
          </div>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="bg-[#00252e] rounded-2xl p-6 mb-8 w-full max-w-md">
        <h4 className="font-medium mb-4 flex items-center space-x-2">
          <ReceiptText className="w-4 h-4" />
          <span>Transaction Details</span>
        </h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Transaction ID</span>
            <span className="font-mono">{transactionId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Date & Time</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status</span>
            <span className="text-green-400 font-medium">Completed</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 w-full max-w-md">
        <button
          onClick={handleShare}
          className="flex-1 bg-[#00252e] hover:bg-gray-700 text-white py-3 rounded-xl transition flex items-center justify-center space-x-2"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
        
        <button
          onClick={() => router.push("/home")}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition flex items-center justify-center space-x-2"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
    </div>
  );
};

export default TransferSuccess;
