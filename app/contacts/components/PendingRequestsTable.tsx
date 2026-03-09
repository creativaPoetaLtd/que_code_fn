import { useState } from "react";
import { ContactInvitation, useRespondToInvitationEnhancedMutation } from "@/states/contactSlice";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X } from "lucide-react";

interface PendingRequestsTableProps {
    requests: ContactInvitation[];
    isLoading: boolean;
}

export function PendingRequestsTable({ requests, isLoading }: PendingRequestsTableProps) {
    const authHook = useAuthToken();
    const token = authHook.getToken();
    const { toast } = useToast();
    const [respondToContact] = useRespondToInvitationEnhancedMutation();
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleRespond = async (invitationId: string, action: 'accept' | 'decline') => {
        setProcessingId(invitationId);
        try {
            await respondToContact({
                invitationId,
                action,
                token: token!
            }).unwrap();

            toast({
                title: "Success",
                description: `Contact request ${action === 'accept' ? 'accepted' : 'declined'} successfully`,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.data?.message || `Failed to ${action} contact request`,
                variant: "destructive",
            });
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center text-gray-500">
                Loading pending requests...
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500">
                <div className="mb-4">
                    <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                        <span className="text-xl">Inbox</span>
                    </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No pending requests</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">You have no pending contact requests to respond to.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto scrollbar-hide">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-darkBorder-light">
                <thead className="bg-gray-50 dark:bg-darkBg-card border-b border-gray-200 dark:border-darkBorder-light">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            User
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Received
                        </th>
                        <th scope="col" className="relative px-6 py-3 text-right">
                            <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-darkBg-card divide-y divide-gray-200 dark:divide-darkBorder-light">
                    {requests.map((request) => (
                        <tr
                            key={request.id}
                            className="hover:bg-gray-50 dark:hover:bg-darkBg-interactive transition-colors"
                        >
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                        <UserAvatar
                                            profileImage={request.inviter?.profile?.profileImage}
                                            firstName={request.inviter?.firstName ?? ''}
                                            lastName={request.inviter?.lastName ?? ''}
                                        />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {request.inviter?.firstName} {request.inviter?.lastName}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{request.inviter?.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {request.invitedAt ? formatDistanceToNow(new Date(request.invitedAt), { addSuffix: true }) : 'Recently'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => handleRespond(request.id, 'accept')}
                                        disabled={processingId === request.id}
                                        className="h-8 text-xs px-3"
                                    >
                                        {processingId === request.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                        ) : (
                                            <Check className="h-3 w-3 mr-1" />
                                        )}
                                        Accept
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRespond(request.id, 'decline')}
                                        disabled={processingId === request.id}
                                        className="h-8 text-xs px-3 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-darkBg-card"
                                    >
                                        {processingId === request.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                        ) : (
                                            <X className="h-3 w-3 mr-1" />
                                        )}
                                        Decline
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
