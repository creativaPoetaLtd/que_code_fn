import type { Metadata } from "next";
import LandingPage from "@/components/landing_page/LandingPage";
import MarketingPageShell from "@/components/landing_page/MarketingPageShell";

export const metadata: Metadata = {
    title: "QiewCode - Finance With Security And Flexibility",
    description: "Finance with security and flexibility platform",
};

export default function MarketingPage() {
    return (
        <MarketingPageShell>
            <LandingPage />
        </MarketingPageShell>
    );
}
