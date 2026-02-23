"use client";

import React from "react";
import { Send, Star } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";

interface Contact {
    id: string;
    name: string;
    phone: string;
    avatar: string | null;
    isFavorite?: boolean;
    tags?: string[];
}

interface ContactListItemProps {
    contact: Contact;
    onSelect: (contact: Contact) => void;
}

const ContactListItem = ({ contact, onSelect }: ContactListItemProps) => {
    const nameParts = contact.name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    return (
        <button
            onClick={() => onSelect(contact)}
            className="w-full bg-white dark:bg-darkBg-card p-4 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-darkBorder-light group flex items-start gap-4"
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                <UserAvatar
                    profileImage={contact.avatar}
                    firstName={firstName}
                    lastName={lastName}
                    className="w-12 h-12"
                    userType="user"
                />
                {contact.isFavorite && (
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-darkBg-card rounded-full p-0.5 shadow-sm border border-gray-100 dark:border-darkBorder-light">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    </div>
                )}
            </div>

            {/* Name and Phone */}
            <div className="flex-1 text-left min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-green dark:group-hover:text-brand-gold transition-colors truncate">
                        {contact.name}
                    </h4>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-2">
                    {contact.phone}
                </p>

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {contact.tags.map((tag) => (
                            <Badge
                                key={tag}
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 h-5 bg-gray-100 dark:bg-darkBg-secondary text-gray-600 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-darkBg-hover transition-colors"
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Send Icon */}
            <div className="w-10 h-10 bg-gray-50 dark:bg-darkBg-main rounded-xl flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-brand-gold/10 transition-colors flex-shrink-0 self-center">
                <Send className="w-5 h-5 text-gray-400 group-hover:text-brand-green dark:group-hover:text-brand-gold" />
            </div>
        </button>
    );
};

export default ContactListItem;
export type { Contact };
