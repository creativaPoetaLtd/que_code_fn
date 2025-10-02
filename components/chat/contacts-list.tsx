"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, MessageCircle, Loader2 } from "lucide-react";
import Input from "../ui/Input-ant";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useGetContactsQuery } from "@/states/contactSlice";

interface ContactsListProps {
  onStartChat: (contact: any) => void;
  className?: string;
}

interface Contact {
  id: string;
  contactUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: string;
  createdAt: string;
}

export default function ContactsList({
  onStartChat,
  className = "",
}: ContactsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { getToken } = useAuthToken();
  const authToken = getToken();

  // Fetch contacts using Redux query
  const {
    data: contactsData,
    isLoading,
    error,
    refetch,
  } = useGetContactsQuery(authToken!, {
    skip: !authToken,
  });

  const contacts = contactsData?.data || [];

  // Filter contacts based on search term
  const filteredContacts = contacts.filter((contact: Contact) => {
    const fullName =
      `${contact.contactUser.firstName} ${contact.contactUser.lastName}`.toLowerCase();
    const email = contact.contactUser.email.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase())
    );
  });

  const handleStartChat = (contact: Contact) => {
    onStartChat(contact);
  };

  if (!authToken) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-40 text-gray-500 ${className}`}
      >
        <p className="text-sm">Please log in to view your contacts</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-40 ${className}`}
      >
        <Loader2 className="h-6 w-6 animate-spin text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Loading contacts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-40 text-gray-500 ${className}`}
      >
        <p className="text-sm mb-2">Failed to load contacts</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="text-xs"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <Input
            placeholder="Search contacts..."
            className="rounded-full bg-gray-100 border-0 py-1.5 pl-9 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {contacts.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {filteredContacts.length} of {contacts.length} contacts
          </p>
        )}
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            {searchTerm ? (
              <>
                <Search className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm">No contacts found for "{searchTerm}"</p>
                <p className="text-xs text-gray-400">
                  Try a different search term
                </p>
              </>
            ) : (
              <>
                <MessageCircle className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm">No contacts yet</p>
                <p className="text-xs text-gray-400">
                  Start by adding your first contact
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredContacts.map((contact: Contact) => (
              <div
                key={contact.id}
                className="p-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                        {contact.contactUser.firstName?.[0]}
                        {contact.contactUser.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {contact.contactUser.firstName}{" "}
                        {contact.contactUser.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {contact.contactUser.email}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Connected{" "}
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleStartChat(contact)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 h-8 px-3 text-xs bg-[#00B512] hover:bg-primary-700"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Message
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with contact count */}
      {contacts.length > 0 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Total: {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
