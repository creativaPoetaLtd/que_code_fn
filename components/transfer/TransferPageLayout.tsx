"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useGetAcceptedContactsQuery } from "@/states/contactSlice";
import { getEntityBalance, getRecentSends } from "@/helpers/api";
import AddContactModal from "@/components/chat/add-contact-modal";

import BalanceCard from "./BalanceCard";
import ActionButtonsRow from "./ActionButtonsRow";
import ContactTabs, { TabType } from "./ContactTabs";
import ContactListItem, { Contact } from "./ContactListItem";
import RecentSendItem, { RecentSend } from "./RecentSendItem";

const TransferPageLayout = () => {
    const router = useRouter();
    const { getToken } = useAuthToken();
    const [searchQuery, setSearchQuery] = useState("");
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isAddContactOpen, setIsAddContactOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("all");

    // Balance state
    const [userId, setUserId] = useState<string>("");
    const [balance, setBalance] = useState<number | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(true);

    // Recent sends state
    const [recentSends, setRecentSends] = useState<RecentSend[]>([]);
    const [recentSendsLoading, setRecentSendsLoading] = useState(true);

    // Extract userId from token
    useEffect(() => {
        const authToken = getToken();
        if (authToken) {
            try {
                const base64Url = authToken.split(".")[1];
                const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                const payload = JSON.parse(atob(base64));
                const id = payload?.userId || payload?.id || payload?.sub;
                if (id) setUserId(id);
            } catch (e) {
                console.error("Invalid token");
            }
        }
    }, [getToken]);

    // Fetch balance
    useEffect(() => {
        if (!userId) return;
        const fetchBalance = async () => {
            setBalanceLoading(true);
            try {
                let response;
                try {
                    response = await getEntityBalance(userId, 'user');
                } catch (userError) {
                    response = await getEntityBalance(userId, 'organization');
                }

                if (response.success && response.data) {
                    setBalance(Number(response.data.balance));
                }
            } catch (err) {
                console.error("Could not fetch balance");
            } finally {
                setBalanceLoading(false);
            }
        };
        fetchBalance();
    }, [userId]);

    // Use RTK Query for contacts
    const token = getToken();
    const { data: contactsData, isLoading: isContactsLoading } = useGetAcceptedContactsQuery(token || '', {
        skip: !token,
    });

    // Handle contacts data from RTK Query
    useEffect(() => {
        if (contactsData && contactsData.contacts) {
            const mappedContacts = contactsData.contacts.map((contact: any) => ({
                id: contact.otherUser.id,
                name: `${contact.otherUser.firstName} ${contact.otherUser.lastName}`,
                phone: contact.otherUser.phone || '',
                avatar: contact.otherUser.profileImage || "/Images/Profile.png",
            }));
            setContacts(mappedContacts);
        }
    }, [contactsData]);

    // Fetch recent sends
    useEffect(() => {
        const fetchRecentSends = async () => {
            setRecentSendsLoading(true);
            try {
                const response = await getRecentSends(10);
                if (response.success && response.data) {
                    setRecentSends(response.data);
                }
            } catch (err) {
                console.error("Could not fetch recent sends", err);
            } finally {
                setRecentSendsLoading(false);
            }
        };
        fetchRecentSends();
    }, []);

    const handleContactSelect = (contact: Contact) => {
        // Store contact info and navigate to amount page
        sessionStorage.setItem('selectedRecipient', JSON.stringify({
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
            avatar: contact.avatar,
            type: 'user'
        }));
        router.push("/home/transfer/amount");
    };

    const handleRecentSendSelect = (recipient: RecentSend) => {
        // Store recent send recipient info and navigate to amount page
        sessionStorage.setItem('selectedRecipient', JSON.stringify({
            id: recipient.receiverId,
            name: recipient.receiverName,
            phone: recipient.receiverPhone || '',
            email: recipient.receiverEmail || '',
            type: recipient.receiverType
        }));
        router.push("/home/transfer/amount");
    };

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone.includes(searchQuery)
    );

    // Filter recent sends based on search query
    const filteredRecentSends = recentSends.filter(recipient =>
        recipient.receiverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (recipient.receiverPhone?.includes(searchQuery) ?? false) ||
        (recipient.receiverEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );

    const handleScanQR = () => {
        // TODO: Implement QR scanning
        console.log("Scan QR");
    };

    const handleUseLink = () => {
        // TODO: Implement link input
        console.log("Use link");
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-darkBg-interactive rounded-full transition text-gray-700 dark:text-gray-300"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Send Money</h1>
            </div>

            {/* Balance Card */}
            <BalanceCard
                balance={balance}
                isLoading={balanceLoading}
                percentageChange={12.5}
            />

            {/* Action Buttons Row */}
            <ActionButtonsRow
                onScanQR={handleScanQR}
                onUseLink={handleUseLink}
                onAddContact={() => setIsAddContactOpen(true)}
            />

            {/* Add Contact Modal */}
            <AddContactModal
                isOpen={isAddContactOpen}
                onClose={() => setIsAddContactOpen(false)}
            />

            {/* Contact Selection Card */}
            <div className="bg-white dark:bg-darkBg-card rounded-2xl shadow-sm border border-gray-100 dark:border-darkBorder-light overflow-hidden">
                {/* Tabs */}
                <div className="px-4 pt-4">
                    <ContactTabs activeTab={activeTab} onTabChange={setActiveTab} />
                </div>

                {/* Search */}
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search"
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-darkBg-main rounded-xl border border-gray-200 dark:border-darkBorder-light focus:border-brand-green dark:focus:border-brand-gold focus:ring-2 focus:ring-green-100 dark:focus:ring-brand-gold/10 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Contacts/Recent Sends List */}
                <div className="px-4 pb-4 space-y-3 max-h-[400px] overflow-y-auto">
                    {activeTab === "recent" ? (
                        // Recent Sends Tab
                        recentSendsLoading ? (
                            <div className="py-10 text-center text-gray-500">Loading recent recipients...</div>
                        ) : filteredRecentSends.length > 0 ? (
                            filteredRecentSends.map((recipient) => (
                                <RecentSendItem
                                    key={recipient.receiverId}
                                    recipient={recipient}
                                    onSelect={handleRecentSendSelect}
                                />
                            ))
                        ) : (
                            <div className="py-10 text-center text-gray-500">
                                <p>No recent sends found.</p>
                                <p className="text-sm mt-1">Start sending money to see your recent recipients here.</p>
                            </div>
                        )
                    ) : (
                        // All Contacts Tab
                        isContactsLoading ? (
                            <div className="py-10 text-center text-gray-500">Loading contacts...</div>
                        ) : filteredContacts.length > 0 ? (
                            filteredContacts.map((contact) => (
                                <ContactListItem
                                    key={contact.id}
                                    contact={contact}
                                    onSelect={handleContactSelect}
                                />
                            ))
                        ) : (
                            <div className="py-10 text-center text-gray-500">
                                <p>No contacts found.</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Spacer for mobile bottom nav */}
            <div className="h-24 lg:hidden" />
        </div>
    );
};

export default TransferPageLayout;
