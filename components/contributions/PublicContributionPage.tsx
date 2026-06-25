"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPublicContribution } from "@/helpers/api";
import { getValidToken } from "@/utils/tokenUtils";
import { PublicContributionCard, PublicContributionData } from "./PublicContributionCard";
import { Loader2, AlertCircle, LogIn } from "lucide-react";

interface Props {
  contributionId: string;
}

export default function PublicContributionPage({ contributionId }: Props) {
  const router = useRouter();
  const [data, setData] = useState<PublicContributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = typeof window !== "undefined" ? !!getValidToken() : false;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getPublicContribution(contributionId);
        if (!cancelled) setData(res?.data?.data ?? null);
      } catch (err: any) {
        if (cancelled) return;
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          // Shouldn't happen now that the endpoint is public, but guard anyway
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

      <p className="mt-8 text-xs text-gray-400 dark:text-gray-600 text-center">
        Payments are secured by the Que platform.
      </p>
    </div>
  );
}
