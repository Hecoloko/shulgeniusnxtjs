import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import BackgroundGrid from "@/components/landing/BackgroundGrid";
import TrustedBy from "@/components/landing/TrustedBy";
import StatsStrip from "@/components/landing/StatsStrip";
import FeatureGrid from "@/components/landing/FeatureGrid";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import CtaSection from "@/components/landing/CtaSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50 font-sans selection:bg-amber-100 selection:text-amber-900 relative">
      <BackgroundGrid />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <TrustedBy />
        <StatsStrip />
        <FeatureGrid />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <CtaSection />
      </main>

      <footer className="bg-stone-50 border-t border-stone-200 py-12 text-center text-stone-500 text-sm font-medium">
        <p>© 2026 ShulGenius. Built with ❤️ for Klal Yisrael.</p>
      </footer>
    </div>
  );
}
