"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Loader2, Search, Users, DollarSign, QrCode } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/shared/BackButton";
import Input from "@/components/ui/Input-ant";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useSidebar } from "@/context/SidebarContext";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useGetContactsEnhancedQuery } from "@/states/contactSlice";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import baseUrl from "@/helpers/baseUrl";
import RequestQRModal from "@/components/payments/RequestQRModal";

interface RecipientOption {
  id: string;
  name: string;
  avatar: string;
}

function RequestMoneyPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isExpanded } = useSidebar();
  const { getToken } = useAuthToken();
  const token = getToken();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [splitEqually, setSplitEqually] = useState(true);
  const [allowEditAmount, setAllowEditAmount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [qrRequestId, setQrRequestId] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  const prefilledRecipient = useMemo(() => {
    const id = searchParams.get("recipientId");
    if (!id) return null;
    return {
      id,
      name: searchParams.get("recipientName") || "Selected recipient",
      avatar: searchParams.get("recipientAvatar") || "",
    } as RecipientOption;
  }, [searchParams]);

  const { data: contactsData, isLoading: isLoadingContacts } = useGetContactsEnhancedQuery(
    { token: token || "", status: "active" },
    { skip: !token }
  );

  const recipients = useMemo(() => {
    const fromContacts: RecipientOption[] =
      contactsData?.contacts?.map((c) => ({
        id: c.otherUser.id,
        name: `${c.otherUser.firstName} ${c.otherUser.lastName}`.trim(),
        avatar: c.otherUser.profile?.profileImage || "",
      })) || [];

    if (!prefilledRecipient) return fromContacts;
    if (fromContacts.some((r) => r.id === prefilledRecipient.id)) return fromContacts;
    return [prefilledRecipient, ...fromContacts];
  }, [contactsData, prefilledRecipient]);

  useEffect(() => {
    if (prefilledRecipient?.id) {
      setSelectedRecipients((prev) => (prev.includes(prefilledRecipient.id) ? prev : [prefilledRecipient.id]));
    }
  }, [prefilledRecipient]);

  const filteredRecipients = recipients.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const amountPerPerson =
    splitEqually && selectedRecipients.length > 0 && amount
      ? (Number(amount) / selectedRecipients.length).toLocaleString()
      : "0";

  const toggleRecipient = (recipientId: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(recipientId) ? prev.filter((id) => id !== recipientId) : [...prev, recipientId]
    );
  };

  const handleSubmit = async () => {
    if (!amount || selectedRecipients.length === 0) {
      toast({
        title: "Error",
        description: "Please enter an amount and select at least one recipient",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const authToken = getToken();
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const amountVal = parseFloat(amount);
      const finalAmount = splitEqually && selectedRecipients.length > 1
        ? amountVal / selectedRecipients.length
        : amountVal;

      const responses = await Promise.all(
        selectedRecipients.map((recipientId) =>
          axios.post(
            `${baseUrl}/transactions/request`,
            {
              recipientId,
              amount: finalAmount,
              note,
              allowEditAmount,
              currency: "RWF",
            },
            { headers }
          )
        )
      );

      // Capture the first request ID so user can share its QR
      const firstId = responses[0]?.data?.data?.id ?? responses[0]?.data?.id ?? null;
      if (firstId && selectedRecipients.length === 1) {
        setQrRequestId(firstId);
      }

      toast({
        title: "Money requested",
        description: `Successfully sent request to ${selectedRecipients.length} recipient(s).`,
      });

      if (firstId && selectedRecipients.length === 1) {
        // Stay on page so user can open QR modal
      } else {
        router.push("/home/requests");
      }
    } catch (error: any) {
      toast({
        title: "Request failed",
        description: error.response?.data?.message || "There was an error sending the request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-transparent">
      <Navigation />
      <main
        className={cn(
          "flex-1 transition-all duration-300 pb-24 lg:pb-8",
          isExpanded ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <Header />
        </div>

        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <BackButton className="mb-4" />
            <Card className="p-4 sm:p-6 bg-white dark:bg-darkBg-card border-gray-100 dark:border-darkBorder-light">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-brand-green/10 dark:bg-brand-gold/10 p-2 rounded-full">
                  <DollarSign size={20} className="text-brand-green dark:text-brand-gold" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Request Money</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Create and send a payment request</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">RWF</span>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      className="pl-12 dark:bg-darkBg-interactive dark:border-darkBorder-light dark:text-white"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Users size={16} className="mr-2 text-brand-green dark:text-brand-gold" />
                        <span>Select Recipients</span>
                      </div>
                      {selectedRecipients.length > 0 && (
                        <span className="text-xs text-brand-green dark:text-brand-gold font-bold">
                          {selectedRecipients.length} selected
                        </span>
                      )}
                    </div>
                  </label>

                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search contacts..."
                      className="pl-9 h-9 text-sm dark:bg-darkBg-interactive dark:border-darkBorder-light"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-1 max-h-64 overflow-y-auto border border-gray-100 dark:border-darkBorder-light rounded-xl p-2 bg-gray-50/50 dark:bg-darkBg-overlay/30">
                    {isLoadingContacts ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin text-brand-green" size={20} />
                      </div>
                    ) : filteredRecipients.length > 0 ? (
                      filteredRecipients.map((recipient) => (
                        <div key={recipient.id} className="flex items-center space-x-2 p-1 hover:bg-white dark:hover:bg-darkBg-interactive rounded-lg transition-colors">
                          <Checkbox
                            id={`recipient-${recipient.id}`}
                            checked={selectedRecipients.includes(recipient.id)}
                            onCheckedChange={() => toggleRecipient(recipient.id)}
                            disabled={isSubmitting || prefilledRecipient?.id === recipient.id}
                            className="dark:border-darkBorder-light data-[state=checked]:bg-brand-green dark:data-[state=checked]:bg-brand-gold"
                          />
                          <label htmlFor={`recipient-${recipient.id}`} className="flex items-center flex-1 cursor-pointer py-1">
                            <Avatar className="mr-3 h-8 w-8 border border-gray-100 dark:border-darkBorder-light">
                              <AvatarImage src={recipient.avatar} alt={recipient.name} />
                              <AvatarFallback className="bg-brand-green/10 dark:bg-brand-gold/10 text-brand-green dark:text-brand-gold text-xs">
                                {(recipient.name || "P").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{recipient.name}</span>
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs text-gray-500">No contacts found</div>
                    )}
                  </div>
                </div>

                {selectedRecipients.length > 1 && (
                  <div className="flex items-center p-2 bg-gray-50 dark:bg-darkBg-interactive rounded-lg">
                    <Checkbox
                      id="split-equally"
                      checked={splitEqually}
                      onCheckedChange={(checked) => setSplitEqually(checked as boolean)}
                      disabled={isSubmitting}
                    />
                    <label htmlFor="split-equally" className="ml-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                      Split equally: <span className="font-bold text-brand-green dark:text-brand-gold">RWF {amountPerPerson}</span> each
                    </label>
                  </div>
                )}

                <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                  <Checkbox
                    id="allow-edit"
                    checked={allowEditAmount}
                    onCheckedChange={(checked) => setAllowEditAmount(checked as boolean)}
                    disabled={isSubmitting}
                    className="border-blue-300 dark:border-blue-700 data-[state=checked]:bg-blue-600"
                  />
                  <div className="ml-3">
                    <label htmlFor="allow-edit" className="text-sm font-medium text-blue-900 dark:text-blue-100 cursor-pointer">
                      Allow recipients to edit amount
                    </label>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400">
                      If unchecked, recipients must pay the exact amount you requested.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (Optional)</label>
                  <Input
                    placeholder="What's this request for?"
                    className="dark:bg-darkBg-interactive dark:border-darkBorder-light dark:text-white"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                {qrRequestId ? (
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-100 dark:border-green-500/20 text-center">
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">Request sent successfully!</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Share a QR code so the recipient can pay instantly</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => router.push("/home/requests")}
                        className="flex-1 dark:border-darkBorder-light dark:text-gray-300 dark:hover:bg-darkBg-interactive"
                      >
                        View Requests
                      </Button>
                      <Button
                        onClick={() => setShowQRModal(true)}
                        className="flex-1 bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main"
                      >
                        <QrCode size={16} className="mr-2" />
                        Share QR Code
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
                    <Button
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isSubmitting}
                      className="dark:border-darkBorder-light dark:text-gray-300 dark:hover:bg-darkBg-interactive"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!amount || selectedRecipients.length === 0 || isSubmitting}
                      className="bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main min-w-[140px]"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        "Request Money"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {qrRequestId && (
        <RequestQRModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          requestId={qrRequestId}
        />
      )}
    </div>
  );
}

export default function RequestMoneyPage() {
  return <Suspense><RequestMoneyPageInner /></Suspense>;
}
