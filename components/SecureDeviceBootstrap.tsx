"use client";

import { useEffect } from "react";
import { ensureRegisteredSecureDevice } from "@/services/e2eeDeviceService";
import {
  getStoredUserInfo,
  getValidToken,
  refreshAccessToken,
} from "@/utils/tokenUtils";

const runBootstrap = async () => {
  const authUser = getStoredUserInfo();
  if (!authUser?.id || authUser.accountType !== "user") {
    return;
  }

  const token = getValidToken() || (await refreshAccessToken());
  if (!token) {
    return;
  }

  await ensureRegisteredSecureDevice({
    token,
    userId: authUser.id,
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
