import { useState } from "react";
import { Contact, useToggleContactFavoriteMutation } from "@/states/contactSlice";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, DollarSign, MessageCircle, MoreHorizontal, Send, Star } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useToast } from "@/hooks/use-toast";
import { ManageTagsDialog } from "./ManageTagsDialog";
import { useRouter } from "next/navigation";
import { createOrGetPreferredDmChat } from "@/services/secureChatService";

interface ContactsTableProps {
    contacts: Contact[];
    isLoading: boolean;
    onSelect: (contact: Contact) => void;
}

export function ContactsTable({ contacts, isLoading, onSelect }: ContactsTableProps) {
    const router = useRouter();
    const authHook = useAuthToken();
    const token = authHook.getToken();
    const { toast } = useToast();
    const [toggleFavorite] = useToggleContactFavoriteMutation();
    const [managingTagsContactId, setManagingTagsContactId] = useState<string | null>(null);

    const managingTagsContact = contacts.find(c => c.id === managingTagsContactId) || null;

    const handleOpenProfile = (e: React.MouseEvent, userId: string) => {
        e.stopPropagation();
        router.push(`/profile/${userId}`);
    };

    const handleToggleFavorite = async (contact: Contact, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await toggleFavorite({ contactId: contact.id, token: token || "" }).unwrap();
            toast({
                title: "Success",
                description: contact.isFavorite ? "Removed from favorites" : "Added to favorites",
            });
        } catch (error) {
            console.error("Failed to toggle favorite", error);
            toast({
                title: "Error",
                description: "Failed to update favorite status",
                variant: "destructive",
            });
        }
    };

    const handleSendMessage = async (contact: Contact) => {
        if (!token) {
            toast({
                title: "Authentication required",
                description: "Please log in again to open a conversation.",
                variant: "destructive",
            });
            return;
        }

        try {
            const result = await createOrGetPreferredDmChat({
                token,
                participantId: contact.otherUser.id,
            });

            sessionStorage.setItem("pendingChatId", result.chatId);
            router.push("/chat");

            toast({
                title: "Secure Chat Ready",
                description: `Opening a secure conversation with ${contact.otherUser.firstName} ${contact.otherUser.lastName}.`,
            });
        } catch (error: any) {
            toast({
                title: "Unable to open chat",
                description: error?.data?.message || error?.message || "Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleQuickMessage = (contact: Contact, e: React.MouseEvent) => {
        e.stopPropagation();
        void handleSendMessage(contact);
    };

    const handleQuickSend = (contact: Contact, e: React.MouseEvent) => {
        e.stopPropagation();
        const recipient = {
            id: contact.otherUser.id,
            name: `${contact.otherUser.firstName} ${contact.otherUser.lastName}`,
            phone: contact.otherUser.phone,
            avatar: contact.otherUser.profile?.profileImage || "",
            type: "user",
        };
        sessionStorage.setItem("selectedRecipient", JSON.stringify(recipient));
        router.push("/home/transfer/amount");
    };

    const handleQuickRequest = (contact: Contact, e: React.MouseEvent) => {
        e.stopPropagation();
        const recipientId = encodeURIComponent(contact.otherUser.id);
        const recipientName = encodeURIComponent(`${contact.otherUser.firstName} ${contact.otherUser.lastName}`.trim());
        const recipientAvatar = encodeURIComponent(contact.otherUser.profile?.profileImage || "");
        router.push(`/home/request?recipientId=${recipientId}&recipientName=${recipientName}&recipientAvatar=${recipientAvatar}`);
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Loading contacts...
            </div>
        );
    }

    if (contacts.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                <div className="mb-4">
                    <div className="h-12 w-12 bg-gray-100 dark:bg-darkBg-interactive rounded-full flex items-center justify-center mx-auto text-gray-400 dark:text-gray-500">
                        <span className="text-xl">?</span>
                    </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No contacts found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding a new contact.</p>
            </div>
        );
    }

    return (
        <>
            <div className="hidden md:block w-full overflow-x-hidden">
                <table className="w-full divide-y divide-gray-200 dark:divide-darkBorder-light">
                    <thead className="bg-gray-50 dark:bg-darkBg-card border-b border-gray-200 dark:border-darkBorder-light">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Contact
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-darkBg-card divide-y divide-gray-200 dark:divide-darkBorder-light">
                        {contacts.map((contact) => {
                            const tagPreview = contact.tags?.slice(0, 2) || [];
                            const remainingTags = (contact.tags?.length || 0) - tagPreview.length;
                            const secondaryText = contact.otherUser.email || contact.otherUser.phone || "";

                            return (
                                <tr
                                    key={contact.id}
                                    onClick={() => onSelect(contact)}
                                    className="hover:bg-gray-50 dark:hover:bg-darkBg-interactive transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-between gap-6">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="flex-shrink-0 h-11 w-11">
                                                    <UserAvatar
                                                        profileImage={contact.otherUser.profile?.profileImage}
                                                        firstName={contact.otherUser.firstName}
                                                        lastName={contact.otherUser.lastName}
                                                        userId={contact.otherUser.id}
                                                        className="h-11 w-11"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
                                                        <span className="truncate">
                                                            {contact.otherUser.firstName} {contact.otherUser.lastName}
                                                        </span>
                                                        {contact.isFavorite && (
                                                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                                        )}
                                                    </div>
                                                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                        {secondaryText && <span className="truncate">{secondaryText}</span>}
                                                        {secondaryText && (
                                                            <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                        )}
                                                        <span className="whitespace-nowrap">
                                                            Friends since {format(new Date(contact.createdAt), "MMM d, yyyy")}
                                                        </span>
                                                    </div>
                                                    {(tagPreview.length > 0 || remainingTags > 0) && (
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {tagPreview.map((tag) => (
                                                                <Badge
                                                                    key={tag}
                                                                    variant="secondary"
                                                                    className="text-[10px] bg-gray-100 dark:bg-darkBg-interactive text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-darkBg-hover border border-transparent dark:border-darkBorder-light/60"
                                                                >
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                            {remainingTags > 0 && (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="text-[10px] bg-gray-100 dark:bg-darkBg-interactive text-gray-600 dark:text-gray-200 border border-transparent dark:border-darkBorder-light/60"
                                                                >
                                                                    +{remainingTags}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div
                                                className="flex items-center flex-wrap gap-1"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                    onClick={(e) => handleQuickMessage(contact, e)}
                                                    title="Message"
                                                >
                                                    <MessageCircle className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                    onClick={(e) => handleQuickSend(contact, e)}
                                                    title="Send"
                                                >
                                                    <Send className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                    onClick={(e) => handleQuickRequest(contact, e)}
                                                    title="Request"
                                                >
                                                    <DollarSign className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelect(contact);
                                                    }}
                                                    title="Details"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                            title="More"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={(e) => handleOpenProfile(e, contact.otherUser.id)}>
                                                            View Profile
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => void handleSendMessage(contact)}>
                                                            Send Message
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => setManagingTagsContactId(contact.id)}>
                                                            Edit Tags
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={(e) => handleToggleFavorite(contact, e as any)}>
                                                            {contact.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600 dark:text-red-400">Block Contact</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="md:hidden space-y-3 p-3">
                {contacts.map((contact) => (
                    <div
                        key={contact.id}
                        onClick={() => onSelect(contact)}
                        className="rounded-lg border border-gray-200 dark:border-darkBorder-light p-4 bg-white dark:bg-darkBg-card"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <UserAvatar
                                    profileImage={contact.otherUser.profile?.profileImage}
                                    firstName={contact.otherUser.firstName}
                                    lastName={contact.otherUser.lastName}
                                    userId={contact.otherUser.id}
                                />
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate flex flex-wrap items-center gap-2">
                                        <span>
                                            {contact.otherUser.firstName} {contact.otherUser.lastName}
                                        </span>
                                        {contact.isFavorite && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                                        {contact.tags && contact.tags.length > 0 && (
                                            <span className="flex flex-wrap gap-1">
                                                {contact.tags.map(tag => (
                                                    <Badge key={tag} variant="secondary" className="text-xs bg-gray-100 dark:bg-darkBg-interactive text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-darkBg-hover border border-transparent dark:border-darkBorder-light/60">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        Friends since {format(new Date(contact.createdAt), 'MMM d, yyyy')}
                                    </div>
                                </div>
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={(e) => handleOpenProfile(e, contact.otherUser.id)}>
                                            View Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => void handleSendMessage(contact)}>
                                            Send Message
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>Send Money</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => setManagingTagsContactId(contact.id)}>
                                            Edit Tags
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={(e) => handleToggleFavorite(contact, e as any)}>
                                            {contact.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600 dark:text-red-400">Block Contact</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 flex-1 rounded-full text-xs border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-darkBorder-light/60 dark:text-gray-200 dark:hover:bg-darkBg-interactive"
                                    onClick={(e) => handleQuickMessage(contact, e)}
                                >
                                    <MessageCircle className="h-3.5 w-3.5 mr-1" />
                                    Message
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 flex-1 rounded-full text-xs border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-darkBorder-light/60 dark:text-gray-200 dark:hover:bg-darkBg-interactive"
                                    onClick={(e) => handleQuickSend(contact, e)}
                                >
                                    <Send className="h-3.5 w-3.5 mr-1" />
                                    Send
                                </Button>
                            </div>
                        </div>

                        <div className="mt-3 flex items-center justify-end text-xs text-gray-400 dark:text-gray-500">
                            Tap for details
                            <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </div>

                    </div>
                ))}
            </div>

            {managingTagsContact && (
                <ManageTagsDialog
                    contact={managingTagsContact}
                    open={!!managingTagsContact}
                    onOpenChange={(open) => !open && setManagingTagsContactId(null)}
                />
            )}
        </>
    );
}
