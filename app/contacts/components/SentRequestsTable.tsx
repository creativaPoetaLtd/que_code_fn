import { useState } from "react";
import { ContactInvitation } from "@/states/contactSlice";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface SentRequestsTableProps {
    requests: ContactInvitation[];
    isLoading: boolean;
}

export function SentRequestsTable({ requests, isLoading }: SentRequestsTableProps) {

    if (isLoading) {
        return (
            <div className="p-8 text-center text-gray-500">
                Loading sent requests...
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500">
                <div className="mb-4">
                    <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                        <span className="text-xl">Outbox</span>
                    </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No sent requests</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">You have no sent contact requests.</p>
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
                            Sent
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
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
                                            profileImage={request.invitee?.profile?.profileImage}
                                            firstName={request.invitee?.firstName ?? ''}
                                            lastName={request.invitee?.lastName ?? ''}
                                        />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {request.invitee?.firstName} {request.invitee?.lastName}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{request.invitee?.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {request.invitedAt ? formatDistanceToNow(new Date(request.invitedAt), { addSuffix: true }) : 'Recently'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                <Badge variant={
                                    request.status === 'pending' ? 'outline' :
                                        request.status === 'accepted' ? 'default' :
                                            request.status === 'declined' ? 'destructive' :
                                                'secondary'
                                } className={request.status === 'pending' ? 'bg-yellow-100/50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-0' : ''}>
                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                </Badge>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
