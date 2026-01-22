"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthToken } from "@/hooks/use-auth-token";
import { socketService } from "@/services/socketService";
import { apiSlice } from "@/states/apiSlice";
import { useDispatch } from "react-redux";

const LogoutPage = () => {
  const router = useRouter();
  const { removeToken } = useAuthToken();
  const dispatch = useDispatch();

  useEffect(() => {
    const performLogout = () => {
      try {
        // 1. Clear authentication tokens
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
      } catch (error) {
        console.error('Error during logout:', error);
      }

      // 6. Immediate redirect using window.location for guaranteed navigation
      window.location.href = "/";
    };

    performLogout();
  }, []); // Empty deps - only run once on mount

  return null;
};

export default LogoutPage; 