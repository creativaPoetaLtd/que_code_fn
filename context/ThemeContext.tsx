"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Routes that should always be light theme (auth pages)
const LIGHT_THEME_ROUTES = [
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/otp",
  "/auth/verify",
  "/",
];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Check if current route should always be light
  const isAuthRoute = LIGHT_THEME_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + "/")
  );

  useEffect(() => {
    setMounted(true);
    
    // Auth routes always use light theme
    if (isAuthRoute) {
      setTheme("light");
      document.documentElement.classList.remove("dark");
      return;
    }

    // For authenticated pages, check saved preference
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      // Default to dark for authenticated pages
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, [isAuthRoute]);

  const toggleTheme = () => {
    // Don't allow theme toggle on auth routes
    if (isAuthRoute) return;

    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return a default context instead of throwing
    return {
      theme: "light" as Theme,
      toggleTheme: () => {},
    };
  }
  return context;
};
