"use client";
import { useEffect } from "react";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useDispatch } from "react-redux";
import { performClientLogout } from "@/utils/logout";

const LogoutPage = () => {
  const { getToken, removeToken } = useAuthToken();
  const dispatch = useDispatch();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await performClientLogout({
          token: getToken(),
          removeToken,
          dispatch,
        });

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error during logout:', error);
      } finally {
        window.location.replace("/");
      }
    };

    performLogout();
  }, [getToken, removeToken, dispatch]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-darkBg-main">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
        <p className="text-[#00313A] dark:text-white font-medium">Logging out...</p>
      </div>
    </div>
  );
};

export default LogoutPage; 
