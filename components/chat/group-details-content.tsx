"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useGetGroupByIdQuery, useGetGroupMembersQuery } from "@/states/groupSlice";
import { socketService } from "@/services/socketService";
import GroupProgressBar from "./group-progress-bar";
import DeadlineCounter from "./deadline-counter";
import GroupMembersList from "./group-members-list";
import { Check, Copy, Download, Info, Loader2, QrCode, Users, Target, ExternalLink, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Group } from "@/types/group.types";
import { getCurrentUserId } from "@/utils/tokenUtils";
import { getContributionByGroup } from "@/helpers/api";

interface GroupDetailsContentProps {
    groupId: string | null;
    token: string;
    isActive?: boolean;
    className?: string;
    membersMaxHeight?: string;
    headerAction?: ReactNode;
    renderActions?: (group: Group) => ReactNode;
    onJoinRequests?: () => void;
}

export default function GroupDetailsContent({
    groupId,
    token,
    isActive = true,
    className,
    membersMaxHeight = "max-h-48",
    headerAction,
    renderActions,
    onJoinRequests,
}: GroupDetailsContentProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [copiedLink, setCopiedLink] = useState(false);
    const [linkedCampaign, setLinkedCampaign] = useState<{ id: string; title: string; status: string; collectedAmount: number; goalAmount: number | null } | null>(null);

    const { data: groupData, isLoading: isLoadingGroup, refetch: refetchGroup } = useGetGroupByIdQuery(
        { groupId: groupId!, token },
        { skip: !groupId || !token }
    );

    const { data: membersData, isLoading: isLoadingMembers } = useGetGroupMembersQuery(
        { groupId: groupId!, token },
        { skip: !groupId || !token }
    );

    const group = groupData?.data;
    const members = membersData?.data?.members || [];
    const isLoading = isLoadingGroup || isLoadingMembers;

    useEffect(() => {
        if (!groupId || !isActive) return;

        const handleProgressUpdate = (data: any) => {
            if (data.groupId === groupId) {
                toast({
                    title: "New Donation Received!",
                    description: `${data.donorName} donated ${new Intl.NumberFormat("en-RW", {
                        style: "currency",
                        currency: "RWF",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    }).format(data.donationAmount)}. Progress: ${data.progress.toFixed(1)}%`,
                });
                refetchGroup();
            }
        };

        socketService.onFundraisingProgress(handleProgressUpdate);
        return () => { socketService.offFundraisingProgress(handleProgressUpdate); };
    }, [groupId, isActive, refetchGroup, toast]);

    useEffect(() => {
        if (!groupId) return;
        getContributionByGroup(groupId)
            .then((res) => setLinkedCampaign(res?.data?.data ?? null))
            .catch(() => setLinkedCampaign(null));
    }, [groupId]);

    const handleCopyLink = async () => {
        if (group?.accessLink) {
            try {
                await navigator.clipboard.writeText(group.accessLink);
                setCopiedLink(true);
                toast({ title: "Link copied!", description: "Group access link copied to clipboard" });
                setTimeout(() => setCopiedLink(false), 2000);
            } catch {
                toast({ title: "Failed to copy", description: "Could not copy link to clipboard", variant: "destructive" });
            }
        }
    };

    const handleDownloadQR = () => {
        if (group?.qrCode) {
            const link = document.createElement("a");
            link.href = group.qrCode;
            link.download = `${group.name.replace(/[^a-zA-Z0-9]/g, "_")}_QRCode.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({ title: "QR Code downloaded!", description: "QR code has been saved to your device" });
        }
    };

    return (
        <div className={cn("space-y-4 pt-4", className)}>
            {!groupId ? (
                <div className="text-center py-12">
                    <Users size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-lg font-medium mb-2 text-gray-900 dark:text-white">No group selected</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Select a group to view details</p>
                </div>
            ) : isLoading ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500" />
                </div>
            ) : group ? (
                <>
                    {/* Top row: avatar + info + optional header action */}
                    <div className="flex items-start gap-3">
                        {group.profilePictureUrl || group.picture ? (
                            <Avatar className="h-14 w-14 shrink-0">
                                <AvatarImage src={group.profilePictureUrl || group.picture} alt={group.name} />
                                <AvatarFallback className="bg-darkBg-sidebar text-white dark:bg-darkBg-interactive">
                                    {(group.name || "G").charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <div className="bg-[#00313A] dark:bg-darkBg-interactive h-14 w-14 shrink-0 rounded-full flex items-center justify-center text-white">
                                <Users size={28} />
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="text-lg font-semibold truncate text-gray-900 dark:text-white leading-tight">
                                    {group.name}
                                </h3>
                                {headerAction && (
                                    <div className="flex-shrink-0">{headerAction}</div>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge variant="outline" className="bg-gray-100 dark:bg-darkBg-interactive text-gray-700 dark:text-gray-300 border-gray-200 dark:border-darkBorder-light text-xs">
                                    {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-xs",
                                        group.privacyType === "require_approval"
                                            ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
                                            : "bg-gray-100 dark:bg-darkBg-interactive text-gray-700 dark:text-gray-300 border-gray-200 dark:border-darkBorder-light"
                                    )}
                                >
                                    {group.privacyType === "private"
                                        ? "Private"
                                        : group.privacyType === "require_approval"
                                            ? "Approval Required"
                                            : "Public"}
                                </Badge>
                                {group.userRole && (
                                    <Badge variant="outline" className="bg-gray-100 dark:bg-darkBg-interactive text-gray-600 dark:text-gray-400 border-gray-200 dark:border-darkBorder-light text-xs">
                                        {group.userRole.charAt(0).toUpperCase() + group.userRole.slice(1)}
                                    </Badge>
                                )}
                            </div>
                            {group.ownerName && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Owner: {group.ownerName}</p>
                            )}
                        </div>
                    </div>

                    {group.description && (
                        <div className="bg-gray-50 dark:bg-darkBg-interactive rounded-lg p-3">
                            <h4 className="font-semibold text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">About</h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{group.description}</p>
                        </div>
                    )}

                    {/* Campaign banner — shown when this group is linked to a public campaign */}
                    {linkedCampaign && (
                        <div className="bg-brand-green/5 dark:bg-brand-gold/5 border border-brand-green/20 dark:border-brand-gold/20 rounded-lg p-3">
                            <div className="flex items-start gap-2.5">
                                <div className="bg-brand-green/10 dark:bg-brand-gold/10 p-1.5 rounded-full shrink-0">
                                    <Target size={13} className="text-brand-green dark:text-brand-gold" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                                        Linked Campaign
                                    </p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                        {linkedCampaign.title}
                                    </p>
                                    {linkedCampaign.goalAmount && (
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                            {new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", minimumFractionDigits: 0 }).format(Number(linkedCampaign.collectedAmount))}
                                            {" / "}
                                            {new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", minimumFractionDigits: 0 }).format(Number(linkedCampaign.goalAmount))} goal
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => router.push(`/contribute/${linkedCampaign.id}`)}
                                    className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-brand-green dark:text-brand-gold hover:underline"
                                >
                                    View <ExternalLink size={10} />
                                </button>
                            </div>
                        </div>
                    )}

                    {group.hasFundraising && group.fundraisingTarget && (
                        <div className="space-y-2 bg-gray-50 dark:bg-darkBg-interactive rounded-lg p-3 border border-gray-200 dark:border-darkBorder-light">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Fundraising Progress</h4>
                                {group.walletBalance !== undefined && (
                                    <span className="text-xs font-medium text-brand-green dark:text-brand-gold">
                                        {new Intl.NumberFormat("en-RW", {
                                            style: "currency",
                                            currency: "RWF",
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                        }).format(group.walletBalance)}
                                    </span>
                                )}
                            </div>
                            <GroupProgressBar
                                currentAmount={group.walletBalance ?? group.fundraisingCurrentAmount}
                                targetAmount={group.fundraisingTarget}
                            />
                            {group.expirationDate && <DeadlineCounter expirationDate={group.expirationDate} />}
                        </div>
                    )}

                    {group.hasAdditionalInfo && group.additionalInfoPrompt && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <Info size={14} className="text-orange-500 dark:text-orange-400 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <h4 className="font-semibold text-xs text-orange-800 dark:text-orange-300 mb-1">Additional Information</h4>
                                    <p className="text-xs text-orange-700 dark:text-orange-300/80 leading-relaxed">
                                        {group.additionalInfoPrompt}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {(group.qrCode || group.accessLink) && (
                        <div className="bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light rounded-lg p-3">
                            <h4 className="font-semibold text-xs mb-3 flex items-center text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                <QrCode size={14} className="mr-1.5" />
                                Share Group
                            </h4>

                            <div className="space-y-3">
                                {group.qrCode && (
                                    <div className="space-y-2">
                                        <div className="flex justify-center">
                                            <div className="bg-white dark:bg-white p-2 rounded-lg border border-gray-200 dark:border-transparent shadow-sm">
                                                <img
                                                    src={group.qrCode}
                                                    alt="Group QR Code"
                                                    className="w-32 h-32 sm:w-36 sm:h-36"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleDownloadQR}
                                            variant="outline"
                                            size="sm"
                                            className="w-full h-8 text-xs dark:border-darkBorder-light dark:text-gray-300 dark:hover:bg-darkBg-card"
                                        >
                                            <Download size={12} className="mr-1.5" />
                                            Download QR Code
                                        </Button>
                                    </div>
                                )}

                                {group.accessLink && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block">Access Link</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-white dark:bg-darkBg-card border border-gray-200 dark:border-darkBorder-light rounded px-2.5 py-2 text-xs text-gray-700 dark:text-gray-300 truncate min-w-0">
                                                {group.accessLink}
                                            </div>
                                            <Button
                                                onClick={handleCopyLink}
                                                variant="outline"
                                                size="sm"
                                                className="shrink-0 h-9 w-9 p-0 dark:border-darkBorder-light dark:text-gray-300 dark:hover:bg-darkBg-card"
                                                title="Copy link"
                                            >
                                                {copiedLink ? (
                                                    <Check size={14} className="text-brand-green dark:text-brand-gold" />
                                                ) : (
                                                    <Copy size={14} />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <Separator className="my-2 dark:bg-darkBorder-light" />

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-sm flex items-center text-gray-800 dark:text-gray-200">
                                <Users size={14} className="mr-1.5" />
                                Members ({members.length})
                            </h4>
                        </div>
                        <GroupMembersList
                            members={members}
                            isLoading={isLoadingMembers}
                            maxHeight={membersMaxHeight}
                        />
                    </div>

                    <Separator className="my-2 dark:bg-darkBorder-light" />

                    <Button
                        variant="outline"
                        className="w-full justify-between text-sm text-gray-700 dark:text-gray-300 border-gray-200 dark:border-darkBorder-light hover:bg-gray-50 dark:hover:bg-darkBg-interactive"
                        onClick={() => {
                            const userId = getCurrentUserId();
                            router.push(`/action/${userId}?tab=contributions&group=${groupId}`);
                        }}
                    >
                        <span className="flex items-center gap-2">
                            <Target size={15} className="text-brand-green dark:text-brand-gold" />
                            View Contributions
                        </span>
                        <Target size={13} className="text-gray-400 rotate-0" />
                    </Button>

                    {renderActions && renderActions(group)}

                    {/* Join requests — visible to owners/admins of require_approval groups */}
                    {onJoinRequests &&
                        (group.userRole === "owner" || group.userRole === "admin") &&
                        group.privacyType === "require_approval" && (
                            <button
                                type="button"
                                onClick={onJoinRequests}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-200 dark:border-darkBorder-light hover:bg-gray-50 dark:hover:bg-darkBg-interactive transition-colors text-sm text-gray-700 dark:text-gray-300"
                            >
                                <span className="flex items-center gap-2">
                                    <ClipboardList size={15} className="text-brand-green dark:text-brand-gold" />
                                    Join Requests
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">Review →</span>
                            </button>
                        )
                    }

                    <div className="text-xs text-gray-400 dark:text-gray-500 text-center space-y-0.5 pt-2 border-t border-gray-100 dark:border-darkBorder-light">
                        <p>
                            Created{" "}
                            {new Date(group.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                            })}
                        </p>
                        {group.maxMembers && <p>Max capacity: {group.maxMembers} members</p>}
                    </div>
                </>
            ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">Group not found</div>
            )}
        </div>
    );
}
