"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { notification } from "antd";
import { ClipLoader } from "react-spinners";
import axios from "axios";
import baseUrl from "@/helpers/baseUrl";
import ImageSection from "../ImageSection";

const VerifyPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const otp = searchParams.get("otp");

  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<
    "success" | "error" | "expired" | null
  >(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const hasVerified = useRef(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    // Decode JWT to extract email
    const getEmailFromToken = (jwtToken: string | null): string | null => {
      if (!jwtToken) return null;
      try {
        const payload = JSON.parse(atob(jwtToken.split(".")[1]));
        return payload.email || null;
      } catch {
        return null;
      }
    };

    setUserEmail(getEmailFromToken(token));

    const verifyEmail = async () => {
      if (!token || !otp) {
        setVerificationStatus("error");
        setIsVerifying(false);
        notification.error({
          message: "Verification Failed",
          description: "Verification token and OTP are required.",
          placement: "topRight",
        });
        return;
      }

      try {
        const response = await axios.get(
          `${baseUrl}/users/verify?token=${token}&otp=${otp}`
        );
        if (response.status === 200) {
          setVerificationStatus("success");
          notification.success({
            message: "Email Verified Successfully",
            description:
              "Your email has been verified. You can now log in to your account.",
            placement: "topRight",
          });
          setTimeout(() => {
            router.replace("/auth/login");
          }, 3000);
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          "Verification failed. Please try again.";
        if (errorMessage.toLowerCase().includes("already verified")) {
          setVerificationStatus("success");
          notification.success({
            message: "Email Already Verified",
            description:
              "Your email was already verified. You can now log in to your account.",
            placement: "topRight",
          });
          setTimeout(() => {
            router.replace("/auth/login");
          }, 3000);
        } else if (errorMessage.toLowerCase().includes("expired")) {
          setVerificationStatus("expired");
          notification.error({
            message: "Verification Link Expired",
            description: errorMessage,
            placement: "topRight",
          });
        } else {
          setVerificationStatus("error");
          notification.error({
            message: "Verification Failed",
            description: errorMessage,
            placement: "topRight",
          });
        }
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token, otp]);

  const renderContent = () => {
    if (isVerifying) {
      return (
        <div className="flex flex-col items-center justify-center">
          <ClipLoader color="#00B512" size={50} />
          <p className="mt-4 text-lg text-gray-600">Verifying your email...</p>
        </div>
      );
    }

    if (verificationStatus === "success") {
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            Email Verified!
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Your email has been successfully verified. You will be redirected to
            the login page shortly.
          </p>
          <button
            onClick={() => router.replace("/auth/login")}
            className="px-6 py-2 bg-[#00B512] text-white rounded-md hover:bg-[#009510] transition-colors"
          >
            Go to Login
          </button>
        </div>
      );
    }

    if (verificationStatus === "expired") {
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Verification Link Expired
          </h2>
          <p className="text-gray-600 text-center mb-6">
            The verification link has expired. You can resend a new verification
            link to your email.
          </p>
          {resendSuccess && <div className="mb-2 text-green-600">{resendSuccess}</div>}
          {resendError && <div className="mb-2 text-red-600">{resendError}</div>}
          <button
            disabled={resendLoading}
            onClick={async () => {
              setResendLoading(true);
              setResendSuccess(null);
              setResendError(null);
              try {
                if (!userEmail) throw new Error("Email not found in token");
                const response = await axios.post(
                  `${baseUrl}/users/resend-verification`,
                  { email: userEmail }
                );
                setResendSuccess(
                  response.data?.message ||
                    "Verification email resent successfully"
                );
                notification.success({
                  message: "Verification Email Sent",
                  description: response.data?.message || "",
                  placement: "topRight",
                });
              } catch (err: any) {
                setResendError(
                  err.response?.data?.message ||
                    err.message ||
                    "Failed to resend verification email"
                );
                notification.error({
                  message: "Resend Failed",
                  description: err.response?.data?.message || err.message,
                  placement: "topRight",
                });
              } finally {
                setResendLoading(false);
              }
            }}
            className="px-6 py-2 bg-[#00B512] text-white rounded-md hover:bg-[#009510] transition-colors"
          >
            {resendLoading ? "Resending..." : "Resend Verification Link"}
          </button>
        </div>
      );
    }

    if (verificationStatus === "error") {
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Verification Failed
          </h2>
          <p className="text-gray-600 text-center mb-6">
            The verification link is invalid. Please check your email for a new
            verification link or sign up again.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => router.replace("/auth/login")}
              className="px-6 py-2 bg-[#00B512] text-white rounded-md hover:bg-[#009510] transition-colors"
            >
              Go to Login
            </button>
            <button
              onClick={() => router.replace("/auth/signup")}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Sign Up Again
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex h-screen">
      <div className="flex flex-col justify-center lg:w-1/2 w-full md:px-32 px-4">
        {renderContent()}
      </div>
      <ImageSection url="/Images/art1.png" />
    </div>
  );
};

const VerifyPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <ClipLoader color="#00B512" size={50} />
            <p className="mt-4 text-lg text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyPageContent />
    </Suspense>
  );
};

export default VerifyPage;
