import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
// @ts-ignore: allow importing global css without type declarations
import "antd/dist/reset.css";
// @ts-ignore: allow importing global css without type declarations
import "./globals.css";
import ClientProvider from "@/components/ClientProvider";
import { Toaster } from "@/components/ui/toaster";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";

const poppins = localFont({
  src: [
    {
      path: "../public/fonts/Poppins-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Poppins-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-poppins",
});
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "QiewCode - Chat & Payment App",
  description: "Chat with friends, send money, and manage groups - all in one place",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QiewCode",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "QiewCode",
    title: "QiewCode - Chat & Payment App",
    description: "Chat with friends, send money, and manage groups - all in one place",
  },
  twitter: {
    card: "summary",
    title: "QiewCode - Chat & Payment App",
    description: "Chat with friends, send money, and manage groups - all in one place",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#00B512",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png?v=20260421" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico?v=20260421" />
        <link rel="apple-touch-icon" href="/icon-192x192.png?v=20260421" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="QiewCode" />
        
      </head>
      <body
        className={`${poppins.className} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientProvider>{children}</ClientProvider>
        <Toaster />
        <PWAInstallPrompt />
        <PushNotificationPrompt />
      </body>
    </html>
  );
}
