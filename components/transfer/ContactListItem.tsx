"use client";

import React from "react";
import { Send, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Contact {
    id: string;
    name: string;
    phone: string;
    avatar: string;
}

interface ContactListItemProps {
    contact: Contact;
    onSelect: (contact: Contact) => void;
}

const ContactListItem = ({ contact, onSelect }: ContactListItemProps) => {
    return (
        <button
            onClick={() => onSelect(contact)}
            className="w-full bg-white dark:bg-darkBg-card p-4 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-darkBorder-light group flex items-center gap-4"
        >
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm flex-shrink-0">
                <Avatar className="w-full h-full">
                    <AvatarImage src={contact.avatar} alt={contact.name} />
                    <AvatarFallback className="bg-gray-100 dark:bg-darkBg-main">
                        <User className="w-6 h-6 text-gray-400" />
                    </AvatarFallback>
                </Avatar>
            </div>

            {/* Name and Phone */}
            <div className="flex-1 text-left min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-green dark:group-hover:text-brand-gold transition-colors truncate">
                    {contact.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {contact.phone}
                </p>
            </div>

            {/* Send Icon */}
            <div className="w-10 h-10 bg-gray-50 dark:bg-darkBg-main rounded-xl flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-brand-gold/10 transition-colors flex-shrink-0">
                <Send className="w-5 h-5 text-gray-400 group-hover:text-brand-green dark:group-hover:text-brand-gold" />
            </div>
        </button>
    );
};

export default ContactListItem;
export type { Contact };
