import { useState } from "react";
import { Contact, useToggleContactFavoriteMutation } from "@/states/contactSlice";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Star } from "lucide-react";
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
                title: result.usedSecure ? "Secure Chat Ready" : "Chat Ready",
                description: result.usedSecure
                    ? `Opening a secure conversation with ${contact.otherUser.firstName} ${contact.otherUser.lastName}.`
                    : `Opening your conversation with ${contact.otherUser.firstName} ${contact.otherUser.lastName}.`,
            });
        } catch (error: any) {
            toast({
                title: "Unable to open chat",
                description: error?.data?.message || error?.message || "Please try again.",
                variant: "destructive",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center text-gray-500">
                Loading contacts...
            </div>
        );
    }

    if (contacts.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500">
                <div className="mb-4">
                    <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
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
                                Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Tags
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-darkBg-card divide-y divide-gray-200 dark:divide-darkBorder-light">
                        {contacts.map((contact) => (
                            <tr
                                key={contact.id}
                                onClick={() => onSelect(contact)}
                                className="hover:bg-gray-50 dark:hover:bg-darkBg-interactive transition-colors cursor-pointer group"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                                <UserAvatar
                                                    profileImage={contact.otherUser.profile?.profileImage}
                                                    firstName={contact.otherUser.firstName}
                                                    lastName={contact.otherUser.lastName}
                                                    userId={contact.otherUser.id}
                                                />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                {contact.otherUser.firstName} {contact.otherUser.lastName}
                                                {contact.isFavorite && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Friends since {format(new Date(contact.createdAt), 'MMM d, yyyy')}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-wrap gap-1">
                                        {contact.tags && contact.tags.length > 0 ? (
                                            contact.tags.map(tag => (
                                                <Badge key={tag} variant="secondary" className="text-xs bg-gray-100 dark:bg-darkBg-secondary text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-darkBg-hover">
                                                    {tag}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">No tags</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${contact.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                        {contact.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
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
                                </td>
                            </tr>
                        ))}
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
                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate flex items-center gap-2">
                                        {contact.otherUser.firstName} {contact.otherUser.lastName}
                                        {contact.isFavorite && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
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

                        <div className="mt-3 flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                                {contact.tags && contact.tags.length > 0 ? (
                                    contact.tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="text-xs bg-gray-100 dark:bg-darkBg-secondary text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-darkBg-hover">
                                            {tag}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-400 italic">No tags</span>
                                )}
                            </div>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${contact.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                {contact.status}
                            </span>
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
