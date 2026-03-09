"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useGetAcceptedContactsQuery, useSendContactInvitationByPublicIdMutation } from "@/states/contactSlice";
import { useLazyGetUserProfileForTransferQuery } from "@/states/userSlice";
import { getEntityBalance, getRecentSends } from "@/helpers/api";
import { useQRScanner } from "@/context/QRScannerContext";
import AddContactModal from "@/components/chat/add-contact-modal";
import { extractPublicIdFromLink, validatePublicId } from "@/utils/profile-link";
import { toast } from "@/hooks/use-toast";

import BalanceCard from "./BalanceCard";
import ActionButtonsRow from "./ActionButtonsRow";
import ContactTabs, { TabType } from "./ContactTabs";
import ContactListItem, { Contact } from "./ContactListItem";
import RecentSendItem, { RecentSend } from "./RecentSendItem";
import ScanOptionsModal from "./ScanOptionsModal";
import LinkInputModal from "./LinkInputModal";

const TransferPageLayout = () => {
    const router = useRouter();
    const { getToken } = useAuthToken();
    const { openScanner } = useQRScanner();
    const [sendInvitationByPublicId, { isLoading: isInviting }] = useSendContactInvitationByPublicIdMutation();
    const [getUserProfile, { isLoading: isLookingUpUser }] = useLazyGetUserProfileForTransferQuery();
    const [searchQuery, setSearchQuery] = useState("");
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isAddContactOpen, setIsAddContactOpen] = useState(false);
    const [scannedUserInfo, setScannedUserInfo] = useState<any>(null);
    const [showScanOptions, setShowScanOptions] = useState(false);
    const [isExistingContact, setIsExistingContact] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("all");
    const [isLinkInputOpen, setIsLinkInputOpen] = useState(false);

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
                avatar: contact.otherUser.profile?.profileImage || null,
                isFavorite: contact.isFavorite,
                tags: contact.tags || [],
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
        openScanner(handleScanComplete, "Scan QR Code for Transfer");
    };

    const handleScanComplete = async (result: string) => {
        const publicId = extractPublicIdFromLink(result);

        if (!publicId || !validatePublicId(publicId)) {
            toast({
                title: "Invalid QR Code",
                description: "The scanned QR code does not contain a valid profile link",
                variant: "destructive",
            });
            return;
        }

        if (userId && publicId === userId) {
            toast({
                title: "Your QR Code",
                description: "This is your own QR code",
            });
            return;
        }

        // Check if user is already in contacts
        const existingContact = contacts.find(contact => contact.id === publicId);

        if (existingContact) {
            setIsExistingContact(true);
            const userInfo = {
                id: existingContact.id,
                name: existingContact.name,
                avatar: existingContact.avatar,
                isOrganization: false,
            };
            setScannedUserInfo(userInfo);
            setShowScanOptions(true);
            return;
        }

        setIsExistingContact(false);
        await handleNewUserScanned(publicId, result, 'qr');
    };

    const handleNewUserScanned = async (publicId: string, profileLink: string, source: 'qr' | 'link' = 'qr') => {
        const token = getToken();
        if (!token) {
            toast({
                title: "Authentication Error",
                description: "Please log in to continue",
                variant: "destructive",
            });
            return;
        }

        try {
            // Look up user profile information
            const result = await getUserProfile({
                userId: publicId,
                token,
            }).unwrap();

            const userInfo = {
                id: publicId,
                name: result.name,
                profileLink,
                type: result.type,
                avatar: result.avatar,
                isOrganization: result.isOrganization,
            };

            setScannedUserInfo(userInfo);
            setShowScanOptions(true);

        } catch (error: any) {
            // User not found
            const isQRSource = source === 'qr';
            toast({
                title: "User Not Found",
                description: isQRSource
                    ? "The scanned QR code does not belong to a valid user"
                    : "The profile link does not belong to a valid user",
                variant: "destructive",
            });
        }
    };

    const handleAddContactAndTransfer = async () => {
        if (!scannedUserInfo) return;

        const token = getToken();
        if (!token) return;

        try {
            await sendInvitationByPublicId({
                publicId: scannedUserInfo.id,
                token,
            }).unwrap();

            toast({
                title: "Invitation Sent",
                description: `Contact invitation sent to ${scannedUserInfo.name}`,
            });

            // Navigate to amount page for direct transfer
            const recipientData = {
                id: scannedUserInfo.id,
                name: scannedUserInfo.name,
                phone: '',
                avatar: scannedUserInfo.avatar || '/Images/Profile.png',
                isOnline: false,
                type: scannedUserInfo.type || 'user',
            };

            sessionStorage.setItem('selectedRecipient', JSON.stringify(recipientData));
            setShowScanOptions(false);
            setScannedUserInfo(null);
            setIsExistingContact(false);
            router.push('/home/transfer/amount');

        } catch (error: any) {
            toast({
                title: "Invitation Failed",
                description: error?.data?.message || "Failed to send invitation",
                variant: "destructive",
            });
        }
    };

    const handleDirectTransfer = () => {
        if (!scannedUserInfo) return;

        // Navigate directly to amount page without adding as contact
        const recipientData = {
            id: scannedUserInfo.id,
            name: scannedUserInfo.name,
            phone: '',
            avatar: scannedUserInfo.avatar || '/Images/Profile.png',
            isOnline: false,
            type: scannedUserInfo.type || 'user',
        };

        sessionStorage.setItem('selectedRecipient', JSON.stringify(recipientData));
        setShowScanOptions(false);
        setScannedUserInfo(null);
        setIsExistingContact(false);
        router.push('/home/transfer/amount');
    };

    const handleUseLink = () => {
        setIsLinkInputOpen(true);
    };

    const handleLinkSubmit = async (link: string) => {
        // Extract public ID from the link
        const publicId = extractPublicIdFromLink(link);

        if (!publicId || !validatePublicId(publicId)) {
            throw new Error("Invalid profile link. Please check and try again.");
        }

        if (userId && publicId === userId) {
            throw new Error("This is your own profile link");
        }

        const existingContact = contacts.find(contact => contact.id === publicId);

        if (existingContact) {
            setIsExistingContact(true);
            const userInfo = {
                id: existingContact.id,
                name: existingContact.name,
                avatar: existingContact.avatar,
                isOrganization: false,
            };
            setScannedUserInfo(userInfo);
            setIsLinkInputOpen(false);
            setShowScanOptions(true);
            return;
        }

        setIsExistingContact(false);
        setIsLinkInputOpen(false);
        await handleNewUserScanned(publicId, link, 'link');
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.push(`/home/${userId}`)}
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

            {/* Link Input Modal */}
            <LinkInputModal
                isOpen={isLinkInputOpen}
                onClose={() => setIsLinkInputOpen(false)}
                onSubmit={handleLinkSubmit}
                isLoading={isLookingUpUser}
            />

            {/* Scan Options Modal */}
            <ScanOptionsModal
                isOpen={showScanOptions}
                onClose={() => {
                    setShowScanOptions(false);
                    setScannedUserInfo(null);
                    setIsExistingContact(false);
                }}
                scannedUser={scannedUserInfo}
                onAddContactAndTransfer={handleAddContactAndTransfer}
                onDirectTransfer={handleDirectTransfer}
                isInviting={isInviting}
                isLookingUpUser={isLookingUpUser}
                isExistingContact={isExistingContact}
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
