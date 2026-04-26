
"use client";

import React, { Suspense, useState } from "react";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useGetContactsEnhancedQuery } from "@/states/contactSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, MoreHorizontal } from "lucide-react";
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
import { BackButton } from "@/components/shared/BackButton";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function ContactsPageInner() {
    const authHook = useAuthToken();
    const token = authHook.getToken();
    const { isExpanded } = useSidebar();
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isAddContactOpen, setIsAddContactOpen] = useState(false);

    const [activeTab, setActiveTab] = useState<'normal' | 'companies' | 'persons' | 'pending' | 'sent'>('normal');

    const { data: contactsData, isLoading, refetch } = useGetContactsEnhancedQuery(
        { token: token || "", status: "active" },
        { skip: !token }
    );

    const { data: pendingData, isLoading: isLoadingPending } = useGetPendingInvitationsUnifiedQuery(
        { token: token || "", page: 1, limit: 50 },
        { skip: !token }
    );

    const { data: sentData, isLoading: isLoadingSent } = useGetSentInvitationsUnifiedQuery(
        { token: token || "", page: 1, limit: 50, status: 'pending' },
        { skip: !token }
    );

    const contacts = contactsData?.contacts || [];
    const incomingRequests = pendingData?.invitations || [];
    const outgoingPendingRequests = sentData?.invitations || [];

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'pending' || tab === 'sent' || tab === 'normal' || tab === 'companies' || tab === 'persons') {
            setActiveTab(tab);
        }
    }, [searchParams]);

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

    const isCompanyContact = (contact: Contact) => {
        if (contact.otherUser.contactType) {
            return contact.otherUser.contactType === 'company';
        }

        const searchable = [
            ...(contact.tags || []),
            contact.otherUser.firstName,
            contact.otherUser.lastName,
            contact.otherUser.email,
        ].join(' ').toLowerCase();

        return /company|business|organization|org|ltd|inc|llc/.test(searchable);
    };

    const companyContacts = filteredContacts.filter(isCompanyContact);
    const personContacts = filteredContacts.filter((contact) => !isCompanyContact(contact));

    const activeContacts = activeTab === 'companies'
        ? companyContacts
        : activeTab === 'persons'
            ? personContacts
            : filteredContacts;

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
                                <BackButton className="mb-4" />
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your network and relationships</p>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className={cn(
                                    "flex items-center transition-all duration-300 overflow-hidden",
                                    isSearchExpanded ? "w-44 sm:w-64" : "w-10"
                                )}>
                                    {isSearchExpanded ? (
                                        <div className="relative w-full">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                autoFocus
                                                placeholder="Search contacts..."
                                                className="pl-9 pr-8 bg-white dark:bg-darkBg-card border-gray-200 dark:border-darkBorder-light focus:bg-white transition-colors"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onBlur={() => {
                                                    if (!searchQuery.trim()) setIsSearchExpanded(false);
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchQuery("");
                                                    setIsSearchExpanded(false);
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                aria-label="Close search"
                                            >
                                                <MoreHorizontal className="h-4 w-4 rotate-90" />
                                            </button>
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setIsSearchExpanded(true)}
                                            className="bg-white dark:bg-darkBg-card border-gray-200 dark:border-darkBorder-light"
                                            aria-label="Open search"
                                        >
                                            <Search className="h-4 w-4 text-gray-500" />
                                        </Button>
                                    )}
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

                        {/* Tabs Navigation */}
                        <div className="flex border-b border-gray-200 dark:border-darkBorder-light mb-6 overflow-x-auto scrollbar-hide">
                            <button
                                onClick={() => setActiveTab('normal')}
                                className={cn(
                                    "px-4 py-3 text-sm font-medium transition-all relative whitespace-nowrap",
                                    activeTab === 'normal'
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                )}
                            >
                                All ({filteredContacts.length})
                                {activeTab === 'normal' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('companies')}
                                className={cn(
                                    "px-4 py-3 text-sm font-medium transition-all relative whitespace-nowrap",
                                    activeTab === 'companies'
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                )}
                            >
                                Businesses ({companyContacts.length})
                                {activeTab === 'companies' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('persons')}
                                className={cn(
                                    "px-4 py-3 text-sm font-medium transition-all relative whitespace-nowrap",
                                    activeTab === 'persons'
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                )}
                            >
                                People ({personContacts.length})
                                {activeTab === 'persons' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                                )}
                            </button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className={cn(
                                            "px-4 py-3 text-sm font-medium transition-all relative whitespace-nowrap flex items-center gap-1",
                                            (activeTab === 'pending' || activeTab === 'sent')
                                                ? "text-blue-600 dark:text-blue-400"
                                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                        )}
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                        Requests
                                        {(activeTab === 'pending' || activeTab === 'sent') && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                                        )}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48">
                                    <DropdownMenuItem onClick={() => setActiveTab('pending')}>
                                        Sent ({outgoingPendingRequests.length})
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setActiveTab('sent')}>
                                        Received ({incomingRequests.length})
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                            {(activeTab === 'normal' || activeTab === 'companies' || activeTab === 'persons') && (
                                <>
                                    {/* Favorites Section */}
                                    {activeTab === 'normal' && favorites.length > 0 && (
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
                                                contacts={activeContacts}
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
                                        <SentRequestsTable
                                            requests={outgoingPendingRequests}
                                            isLoading={isLoadingSent}
                                        />
                                    </div>
                                </section>
                            )}

                            {activeTab === 'sent' && (
                                <section>
                                    <div className="bg-white dark:bg-darkBg-card rounded-xl shadow-sm border border-gray-200 dark:border-darkBorder-light overflow-hidden">
                                        <PendingRequestsTable
                                            requests={incomingRequests}
                                            isLoading={isLoadingPending}
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

export default function ContactsPage() {
    return <Suspense><ContactsPageInner /></Suspense>;
}
