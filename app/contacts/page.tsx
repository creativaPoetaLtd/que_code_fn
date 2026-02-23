
"use client";

import React, { useState } from "react";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useGetContactsEnhancedQuery } from "@/states/contactSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { FavoritesRow } from "./components/FavoritesRow";
import { ContactsTable } from "./components/ContactsTable";
import { ContactDetailsPanel } from "./components/ContactDetailsPanel";
import { Contact } from "@/states/contactSlice";
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

    const { data: contactsData, isLoading, refetch } = useGetContactsEnhancedQuery(
        { token: token || "", status: "active" },
        { skip: !token }
    );

    const contacts = contactsData?.contacts || [];

    // Update selectedContact if contacts list changes (e.g. after mutation)
    useEffect(() => {
        if (selectedContact) {
            const updatedContact = contacts.find(c => c.id === selectedContact.id);
            // Only update if the object reference is different but ID matches
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

                        <div className="flex-1 overflow-y-auto space-y-8 pr-2">
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
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Contacts ({filteredContacts.length})</h2>
                                </div>
                                <div className="bg-white dark:bg-darkBg-card rounded-xl shadow-sm border border-gray-200 dark:border-darkBorder-light overflow-hidden">
                                    <ContactsTable
                                        contacts={filteredContacts}
                                        isLoading={isLoading}
                                        onSelect={setSelectedContact}
                                    />
                                </div>
                            </section>
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
