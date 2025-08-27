"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const VerifyRedirectContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const otp = searchParams.get("otp");

  useEffect(() => {
    if (token && otp) {
      // ✅ Redirect with BOTH token and otp
      router.replace(`/auth/verify?token=${token}&otp=${otp}`);
    } else {
      // If no token, redirect to login
      router.replace("/auth/login");
    }
  }, [token, otp, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00B512] mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};

const VerifyRedirectPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00B512] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyRedirectContent />
    </Suspense>
  );
};

export default VerifyRedirectPage;
