"use client";

import { useMemo } from "react";
import { useUserInfo } from "./use-user-info";

export const useAccent = () => {
    const { accountType } = useUserInfo();
    const isOrg = accountType === "organization";

    return useMemo(
        () =>
            isOrg
                ? {
                      isOrg: true,
                      // dark-only (welcome-page style)
                      dot: "bg-blue-400",
                      ring: "border-blue-400",
                      ringGlow: "shadow-[0_0_0_4px_rgba(96,165,250,0.15)]",
                      text: "text-blue-400",
                      editBtn: "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/40 text-blue-400",
                      solid: "bg-blue-500 hover:bg-blue-600",
                      iconBtn: "bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25",
                      iconColor: "text-blue-400",
                      active: "bg-blue-400",
                      bgPage: "bg-[#080d1a]",
                      bgCard: "bg-[#0d1527]",
                      // light + dark adaptive
                      darkBgPage: "dark:bg-[#080d1a]",
                      darkBgCard: "dark:bg-[#0d1527]",
                      tabActive: "dark:data-[state=active]:bg-blue-600",
                      spinner: "border-blue-500",
                      solidDark: "bg-blue-600 hover:bg-blue-700",
                      lightIconBg: "bg-blue-100 dark:bg-blue-500/10",
                      lightIconColor: "text-blue-600 dark:text-blue-400",
                  }
                : {
                      isOrg: false,
                      // dark-only (welcome-page style)
                      dot: "bg-emerald-400",
                      ring: "border-emerald-400",
                      ringGlow: "shadow-[0_0_0_4px_rgba(52,211,153,0.15)]",
                      text: "text-emerald-400",
                      editBtn: "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-400",
                      solid: "bg-emerald-500 hover:bg-emerald-600",
                      iconBtn: "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25",
                      iconColor: "text-emerald-400",
                      active: "bg-emerald-400",
                      bgPage: "bg-[#060d08]",
                      bgCard: "bg-[#0b1610]",
                      // light + dark adaptive
                      darkBgPage: "dark:bg-[#060d08]",
                      darkBgCard: "dark:bg-[#0b1610]",
                      tabActive: "dark:data-[state=active]:bg-emerald-600",
                      spinner: "border-emerald-500",
                      solidDark: "bg-emerald-600 hover:bg-emerald-700",
                      lightIconBg: "bg-emerald-100 dark:bg-emerald-500/10",
                      lightIconColor: "text-emerald-600 dark:text-emerald-400",
                  },
        [isOrg]
    );
};

export type Accent = ReturnType<typeof useAccent>;
