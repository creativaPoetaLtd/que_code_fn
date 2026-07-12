"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPublicContribution, getCampaignGroup, joinCampaignGroup } from "@/helpers/api";
import { getValidToken } from "@/utils/tokenUtils";
import { PublicContributionCard, PublicContributionData } from "./PublicContributionCard";
import { Loader2, AlertCircle, LogIn, Users, Globe, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  contributionId: string;
}

interface LinkedGroupData {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  privacyType: string;
  isOpen: boolean;
  isUserMember: boolean;
  memberStatus: string | null;
  allowContributorJoin: boolean;
}

export default function PublicContributionPage({ contributionId }: Props) {
  const router = useRouter();
  const [data, setData] = useState<PublicContributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkedGroup, setLinkedGroup] = useState<LinkedGroupData | null>(null);
  const [joiningGroup, setJoiningGroup] = useState(false);
  const isAuthenticated = typeof window !== "undefined" ? !!getValidToken() : false;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getPublicContribution(contributionId);
        const contribution = res?.data?.data ?? null;
        if (!cancelled) setData(contribution);

        if (contribution?.linkedGroupId) {
          try {
            const groupRes = await getCampaignGroup(contributionId);
            if (!cancelled) setLinkedGroup(groupRes?.data?.data ?? null);
          } catch {
            // group fetch failure is non-fatal
          }
        }
      } catch (err: any) {
        if (cancelled) return;
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          router.push(`/auth/login?returnUrl=${encodeURIComponent(`/contribute/${contributionId}`)}`);
        } else {
          setError(err?.response?.data?.message || "Could not load this contribution campaign.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [contributionId, router]);

  const handleJoinGroup = async () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?returnUrl=${encodeURIComponent(`/contribute/${contributionId}`)}`);
      return;
    }
    setJoiningGroup(true);
    try {
      const res = await joinCampaignGroup(contributionId);
      const status = res?.data?.data?.status;
      toast({ description: res?.data?.message || "Done!" });
      setLinkedGroup((prev) =>
        prev
          ? {
              ...prev,
              isUserMember: status === "active",
              memberStatus: status,
              memberCount: status === "active" ? prev.memberCount + 1 : prev.memberCount,
            }
          : prev
      );
    } catch (err: any) {
      toast({ variant: "destructive", description: err?.response?.data?.message || "Failed to join group" });
    } finally {
      setJoiningGroup(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-darkBg-main">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green dark:text-brand-gold" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-darkBg-main px-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-xs">
          {error ?? "This contribution campaign could not be found."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-darkBg-main flex flex-col items-center justify-start py-12 px-4">
      {/* branding strip */}
      <div className="mb-8 text-center">
        <p className="text-2xl font-bold text-brand-green dark:text-brand-gold tracking-tight">que</p>
        <p className="text-xs text-gray-400 mt-0.5">Contribution Campaign</p>
      </div>

      {/* login nudge for unauthenticated visitors */}
      {!isAuthenticated && (
        <div className="w-full max-w-sm mb-4 flex items-center justify-between gap-3 bg-white dark:bg-darkBg-card border border-emerald-100 dark:border-darkBorder-light rounded-2xl px-4 py-3 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Log in to contribute to this campaign.
          </p>
          <button
            onClick={() => router.push(`/auth/login?returnUrl=${encodeURIComponent(`/contribute/${contributionId}`)}`)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green dark:text-brand-gold hover:underline"
          >
            <LogIn size={13} />
            Login
          </button>
        </div>
      )}

      <PublicContributionCard
        data={data}
        isAuthenticated={isAuthenticated}
        onUpdated={(patch) => setData((prev) => (prev ? { ...prev, ...patch } : prev))}
      />

      {/* community group section */}
      {linkedGroup && (
        <div className="w-full max-w-sm mt-4 bg-white dark:bg-darkBg-card border border-gray-100 dark:border-darkBorder-light rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="bg-brand-green/10 dark:bg-brand-gold/10 p-1.5 rounded-full">
              <Users size={14} className="text-brand-green dark:text-brand-gold" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Community Group
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{linkedGroup.name}</p>
            {linkedGroup.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{linkedGroup.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1">
              <Users size={11} />
              {linkedGroup.memberCount} {linkedGroup.memberCount === 1 ? "member" : "members"}
            </span>
            <span className="inline-flex items-center gap-1">
              {linkedGroup.isOpen ? <Globe size={11} /> : <Lock size={11} />}
              {linkedGroup.isOpen ? "Open group" : "Invite only"}
            </span>
          </div>

          {linkedGroup.isUserMember ? (
            <button
              onClick={() => router.push(`/groups/${linkedGroup.id}`)}
              className="w-full h-8 rounded-lg text-xs font-semibold text-brand-green dark:text-brand-gold border border-brand-green/30 dark:border-brand-gold/30 hover:bg-brand-green/5 dark:hover:bg-brand-gold/5 transition-colors"
            >
              Go to Group
            </button>
          ) : linkedGroup.memberStatus === "pending" ? (
            <div className="h-8 flex items-center justify-center rounded-lg text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light">
              Join request pending…
            </div>
          ) : (
            <button
              onClick={handleJoinGroup}
              disabled={joiningGroup}
              className="w-full h-8 rounded-lg text-xs font-semibold bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {joiningGroup ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" /> Joining…
                </span>
              ) : linkedGroup.isOpen ? (
                "Join Community"
              ) : (
                "Request to Join"
              )}
            </button>
          )}
        </div>
      )}

      <p className="mt-8 text-xs text-gray-400 dark:text-gray-600 text-center">
        Payments are secured by the Que platform.
      </p>
    </div>
  );
}
