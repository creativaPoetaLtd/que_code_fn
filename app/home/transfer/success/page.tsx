"use client";

import React, { useState, useEffect } from "react";
import TransferSuccess from "@/components/TransferSuccess";
import { useRouter } from "next/navigation";

interface TransferData {
  amount: string;
  recipient: {
    name: string;
    id: string;
    avatar: string;
  };
}

const SuccessPage = () => {
  const router = useRouter();
  const [transferResult, setTransferResult] = useState<any>(null);

  useEffect(() => {
    // Get transfer result from session storage
    const storedResult = sessionStorage.getItem('transferResult');
    if (storedResult) {
      try {
        setTransferResult(JSON.parse(storedResult));
      } catch (error) {
        console.error('Error parsing transfer result:', error);
        router.push('/home');
      }
    } else {
      // If no data, redirect to home
      router.push('/home');
    }
  }, [router]);

  // Show loading while getting data
  if (!transferResult) {
    return (
      <div className="min-h-screen bg-[#00313A] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <TransferSuccess
      amount={transferResult.transaction.amount}
      recipient={{
        name: transferResult.transaction.description,
        id: transferResult.transaction.receiverId,
        avatar: '', // Optionally fetch avatar if available
      }}
      transactionId={transferResult.transaction.transactionId}
    />
  );
};

export default SuccessPage;
