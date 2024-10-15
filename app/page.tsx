// pages/index.tsx
import Head from 'next/head';
import Navbar from '@/components/landing_page/NavBar';
import HeroSection from '@/components/landing_page/HeroSection';
import AboutUs from '@/components/landing_page/AboutUs';
import FeaturePage from '@/components/landing_page/FeaturePage';
import TrustSecurityPage from '@/components/landing_page/TrustSecurityPage';
import Testimonials from '@/components/landing_page/Testimonial';
import Other from '@/components/landing_page/Other';
import Footer from '@/components/landing_page/Footer';

export default function Home() {
  return (
    <div className='w-full' >
      <Head>
        <title>QiewCode - Finance With Security And Flexibility</title>
        <meta name="description" content="Finance with security and flexibility platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

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
