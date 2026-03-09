
"use client";

import React, { useState } from "react";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useGetContactsEnhancedQuery } from "@/states/contactSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { FavoritesRow } from "./components/FavoritesRow";
import { ContactsTable } from "./components/ContactsTable";
import { PendingRequestsTable } from "./components/PendingRequestsTable";
import { SentRequestsTable } from "./components/SentRequestsTable";
import { ContactDetailsPanel } from "./components/ContactDetailsPanel";
import { Contact, useGetPendingInvitationsUnifiedQuery, useGetSentInvitationsUnifiedQuery } from "@/states/contactSlice";
import AddContactModal from "@/components/chat/add-contact-modal";
import Navigation from '@/components/Navigation';
import { Header } from '@/components/Header';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';
import { useEffect } from "react";

export default function ContactsPage() {
    const authHook = useAuthToken();
    const token = authHook.getToken();
    const { isExpanded } = useSidebar();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isAddContactOpen, setIsAddContactOpen] = useState(false);

    const [activeTab, setActiveTab] = useState<'contacts' | 'pending' | 'sent'>('contacts');

    const { data: contactsData, isLoading, refetch } = useGetContactsEnhancedQuery(
        { token: token || "", status: "active" },
        { skip: !token }
    );

    const { data: pendingData, isLoading: isLoadingPending } = useGetPendingInvitationsUnifiedQuery(
        { token: token || "", page: 1, limit: 50 },
        { skip: !token }
    );

    const { data: sentData, isLoading: isLoadingSent } = useGetSentInvitationsUnifiedQuery(
        { token: token || "", page: 1, limit: 50 },
        { skip: !token }
    );

    const contacts = contactsData?.contacts || [];
    const pendingRequests = pendingData?.invitations || [];
    const sentRequests = sentData?.invitations || [];

    useEffect(() => {
        if (selectedContact) {
            const updatedContact = contacts.find(c => c.id === selectedContact.id);
            if (updatedContact && updatedContact !== selectedContact) {
                setSelectedContact(updatedContact);
            }
        }
    }, [contacts, selectedContact]);

    // Filter contacts based on search query
    const filteredContacts = contacts.filter((contact) => {
        const fullName = `${contact.otherUser.firstName} ${contact.otherUser.lastName}`.toLowerCase();
        const email = contact.otherUser.email.toLowerCase();
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) || email.includes(query);
    });

    const favorites = contacts.filter((c) => c.isFavorite);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-transparent">
            {/* Desktop Sidebar */}
            <Navigation />

            {/* Main Content */}
            <main className={cn(
                "flex-1 flex flex-col transition-all duration-300",
                isExpanded ? "lg:ml-64" : "lg:ml-20"
            )}>
                <div className="flex-1 flex flex-col h-screen overflow-hidden">
                    {/* Common Header */}
                    <div className="px-4 sm:px-6 lg:px-8 py-4">
                        <Header />
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-8 pb-4">
                        {/* Page Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your network and relationships</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative w-64 hidden sm:block">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search contacts..."
                                        className="pl-9 bg-white dark:bg-darkBg-card border-gray-200 dark:border-darkBorder-light focus:bg-white transition-colors"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button
                                    onClick={() => setIsAddContactOpen(true)}
                                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Add Contact</span>
                                </Button>
                            </div>
                        </div>

                        {/* Mobile Search - Visible only on small screens */}
                        <div className="relative w-full mb-4 sm:hidden">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search contacts..."
                                className="pl-9 bg-white dark:bg-darkBg-card border-gray-200 dark:border-darkBorder-light focus:bg-white transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Tabs Navigation */}
                        <div className="flex border-b border-gray-200 dark:border-darkBorder-light mb-6 overflow-x-auto scrollbar-hide">
                            <button
                                onClick={() => setActiveTab('contacts')}
                                className={cn(
                                    "px-4 py-3 text-sm font-medium transition-all relative whitespace-nowrap",
                                    activeTab === 'contacts'
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                )}
                            >
                                All Contacts ({filteredContacts.length})
                                {activeTab === 'contacts' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={cn(
                                    "px-4 py-3 text-sm font-medium transition-all relative whitespace-nowrap flex items-center gap-2",
                                    activeTab === 'pending'
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                )}
                            >
                                Pending Requests
                                {pendingRequests.length > 0 && (
                                    <span className="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 py-0.5 px-2 rounded-full text-xs">
                                        {pendingRequests.length}
                                    </span>
                                )}
                                {activeTab === 'pending' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('sent')}
                                className={cn(
                                    "px-4 py-3 text-sm font-medium transition-all relative whitespace-nowrap",
                                    activeTab === 'sent'
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                )}
                            >
                                Sent Requests ({sentRequests.length})
                                {activeTab === 'sent' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                                )}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                            {activeTab === 'contacts' && (
                                <>
                                    {/* Favorites Section */}
                                    {favorites.length > 0 && (
                                        <section>
                                            <div className="flex items-center justify-between mb-4">
                                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Favorites</h2>
                                            </div>
                                            <FavoritesRow favorites={favorites} onSelect={setSelectedContact} />
                                        </section>
                                    )}

                                    {/* All Contacts Section */}
                                    <section>
                                        <div className="bg-white dark:bg-darkBg-card rounded-xl shadow-sm border border-gray-200 dark:border-darkBorder-light overflow-hidden">
                                            <ContactsTable
                                                contacts={filteredContacts}
                                                isLoading={isLoading}
                                                onSelect={setSelectedContact}
                                            />
                                        </div>
                                    </section>
                                </>
                            )}

                            {activeTab === 'pending' && (
                                <section>
                                    <div className="bg-white dark:bg-darkBg-card rounded-xl shadow-sm border border-gray-200 dark:border-darkBorder-light overflow-hidden">
                                        <PendingRequestsTable
                                            requests={pendingRequests}
                                            isLoading={isLoadingPending}
                                        />
                                    </div>
                                </section>
                            )}

                            {activeTab === 'sent' && (
                                <section>
                                    <div className="bg-white dark:bg-darkBg-card rounded-xl shadow-sm border border-gray-200 dark:border-darkBorder-light overflow-hidden">
                                        <SentRequestsTable
                                            requests={sentRequests}
                                            isLoading={isLoadingSent}
                                        />
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Navigation for small devices */}
            <div className="lg:hidden">
                <Navigation />
            </div>

            {/* Details Panel */}
            <ContactDetailsPanel
                contact={selectedContact}
                isOpen={!!selectedContact}
                onClose={() => setSelectedContact(null)}
            />

            {/* Add Contact Modal */}
            <AddContactModal
                isOpen={isAddContactOpen}
                onClose={() => setIsAddContactOpen(false)}
            />
        </div>
    );
}
