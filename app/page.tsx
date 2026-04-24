import type { Metadata } from "next";
import AppEntryRedirect from "@/components/AppEntryRedirect";

export const metadata: Metadata = {
  title: "QiewCode",
  description: "Finance with security and flexibility platform",
};

export default function Home() {
  return <AppEntryRedirect />;
}
