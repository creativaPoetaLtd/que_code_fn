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
  title: "QueCode - Chat & Payment App",
  description: "Chat with friends, send money, and manage groups - all in one place",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QueCode",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "QueCode",
    title: "QueCode - Chat & Payment App",
    description: "Chat with friends, send money, and manage groups - all in one place",
  },
  twitter: {
    card: "summary",
    title: "QueCode - Chat & Payment App",
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="QueCode" />
        
        {/* PushAlert Unified Code */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `(function(d, t) {
              var g = d.createElement(t),
              s = d.getElementsByTagName(t)[0];
              g.src = "https://cdn.pushalert.co/unified_0fe68d0326f325e63c546b3d13037915.js";
              s.parentNode.insertBefore(g, s);
            }(document, "script"));`,
          }}
        />
        {/* End PushAlert Unified Code */}
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
