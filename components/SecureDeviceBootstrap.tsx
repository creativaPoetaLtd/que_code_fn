"use client";

import { useEffect } from "react";
import { ensureRegisteredSecureDevice } from "@/services/e2eeDeviceService";
import {
  getCurrentUserInfo,
  getStoredUserInfo,
  getValidToken,
  refreshAccessToken,
} from "@/utils/tokenUtils";

const runBootstrap = async () => {
  const authUser = getStoredUserInfo();
  const tokenUserInfo = getCurrentUserInfo();
  const resolvedUserId =
    tokenUserInfo.accountType === "user" ? tokenUserInfo.userId : authUser?.id || null;
  const resolvedAccountType =
    tokenUserInfo.accountType !== "unknown"
      ? tokenUserInfo.accountType
      : authUser?.accountType || null;

  if (!resolvedUserId || resolvedAccountType !== "user") {
    return;
  }

  const token = getValidToken() || (await refreshAccessToken());
  if (!token) {
    return;
  }

  await ensureRegisteredSecureDevice({
    token,
    userId: resolvedUserId,
  });
};

export default function SecureDeviceBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    void runBootstrap();

    const onResume = () => {
      void runBootstrap();
    };
    const onTokenChanged = () => {
      void runBootstrap();
    };
    const onVisibilityChange = () => {
      if (!document.hidden) {
        void runBootstrap();
      }
    };

    window.addEventListener("online", onResume);
    window.addEventListener("focus", onResume);
    window.addEventListener("authTokenChanged", onTokenChanged as EventListener);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("online", onResume);
      window.removeEventListener("focus", onResume);
      window.removeEventListener("authTokenChanged", onTokenChanged as EventListener);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
