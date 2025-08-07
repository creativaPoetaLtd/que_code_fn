"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthToken } from "@/hooks/use-auth-token";

const LogoutPage = () => {
  const router = useRouter();
  const { removeToken } = useAuthToken();
  useEffect(() => {
    removeToken();
    router.replace("/");
  }, [router, removeToken]);
  return null;
};

export default LogoutPage; 