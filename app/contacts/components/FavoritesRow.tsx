
import React from "react";
import { Contact } from "@/states/contactSlice";
import { UserAvatar } from "@/components/UserAvatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface FavoritesRowProps {
    favorites: Contact[];
    onSelect: (contact: Contact) => void;
}

export function FavoritesRow({ favorites, onSelect }: FavoritesRowProps) {
    return (
        <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex w-max space-x-4">
                {favorites.map((contact) => (
                    <button
                        key={contact.id}
                        onClick={() => onSelect(contact)}
                        className="group flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-white dark:hover:bg-darkBg-card hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/40"
                    >
                        <div className="relative">
                            <UserAvatar
                                profileImage={contact.otherUser.profile?.profileImage}
                                firstName={contact.otherUser.firstName}
                                lastName={contact.otherUser.lastName}
                                className="h-14 w-14 ring-2 ring-white dark:ring-darkBg-card shadow-sm group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 rounded-full ring-2 ring-white dark:ring-darkBg-card" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[80px] truncate">
                            {contact.otherUser.firstName}
                        </span>
                    </button>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}
