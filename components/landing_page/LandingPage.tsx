import Navbar from "@/components/landing_page/NavBar";
import HeroSection from "@/components/landing_page/HeroSection";
import AboutUs from "@/components/landing_page/AboutUs";
import FeaturePage from "@/components/landing_page/FeaturePage";
import TrustSecurityPage from "@/components/landing_page/TrustSecurityPage";
import Testimonials from "@/components/landing_page/Testimonial";
import Other from "@/components/landing_page/Other";
import Footer from "@/components/landing_page/Footer";

export default function LandingPage() {
    return (
        <div className="w-full">
            <Navbar />
            <HeroSection />
            <AboutUs />
            <FeaturePage />
            <TrustSecurityPage />
            <Testimonials />
            <Other />
            <Footer />
        </div>
    );
}
