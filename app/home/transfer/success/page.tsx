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
  const [transferData, setTransferData] = useState<TransferData | null>(null);

  useEffect(() => {
    // Get transfer data from session storage
    const storedData = sessionStorage.getItem('transferData');
    if (storedData) {
      try {
        setTransferData(JSON.parse(storedData));
      } catch (error) {
        console.error('Error parsing transfer data:', error);
        router.push('/home');
      }
    } else {
      // If no data, redirect to home
      router.push('/home');
    }
  }, [router]);

  // Show loading while getting data
  if (!transferData) {
    return (
      <div className="min-h-screen bg-[#00313A] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <TransferSuccess
      amount={transferData.amount}
      recipient={transferData.recipient}
      transactionId={"TXN" + Date.now()}
    />
  );
};

export default SuccessPage;
