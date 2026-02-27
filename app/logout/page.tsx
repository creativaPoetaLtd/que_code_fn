"use client";
import { useEffect } from "react";
import { useAuthToken } from "@/hooks/use-auth-token";
import { socketService } from "@/services/socketService";
import { apiSlice } from "@/states/apiSlice";
import { useDispatch } from "react-redux";

const LogoutPage = () => {
  const { removeToken } = useAuthToken();
  const dispatch = useDispatch();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // 1. Clear authentication tokens first
        removeToken();

        // 2. Force disconnect socket (this will also clear chat state)
        socketService.forceDisconnect();

        // 3. Clear Redux RTK Query cache
        dispatch(apiSlice.util.resetApiState());

        // 4. Clear sessionStorage (transfer data, etc.)
        sessionStorage.clear();

        // 5. Clear specific localStorage items while preserving theme and sidebar preferences
        const preservedItems = {
          theme: localStorage.getItem('theme'),
          sidebarExpanded: localStorage.getItem('sidebarExpanded'),
        };

        // Clear all localStorage
        localStorage.clear();

        // Restore preserved items
        if (preservedItems.theme) {
          localStorage.setItem('theme', preservedItems.theme);
        }
        if (preservedItems.sidebarExpanded) {
          localStorage.setItem('sidebarExpanded', preservedItems.sidebarExpanded);
        }

        // Small delay to ensure state is cleared
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error during logout:', error);
      } finally {
        // 6. Always redirect to home page, even if there's an error
        window.location.replace("/");
      }
    };

    performLogout();
  }, [removeToken, dispatch]);

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