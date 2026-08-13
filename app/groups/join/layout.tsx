import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Join a QiewCode Group",
  description: "Open this secure invitation link to request access to a QiewCode group.",
  openGraph: {
    type: "website",
    siteName: "QiewCode",
    title: "Join a QiewCode Group",
    description: "Open this secure invitation link to request access to a QiewCode group.",
  },
  twitter: {
    card: "summary",
    title: "Join a QiewCode Group",
    description: "Open this secure invitation link to request access to a QiewCode group.",
  },
};

export default function GroupJoinLayout({ children }: { children: ReactNode }) {
  return children;
}