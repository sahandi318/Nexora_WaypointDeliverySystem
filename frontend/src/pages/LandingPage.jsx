import AboutSection from "../components/landing/AboutSection";
import FeatureStrip from "../components/landing/FeatureStrip";
import Footer from "../components/landing/Footer";
import HeroSection from "../components/landing/HeroSection";
import LandingNavbar from "../components/landing/LandingNavbar";
import StoreSection from "../components/landing/StoreSection";


function LandingPage() {
  return (
    <div
      className="
        landing-page-shell
        min-h-screen
        w-full
        overflow-x-hidden
        text-[var(--color-text)]
        transition-colors
        duration-300
      "
    >
      <LandingNavbar />

      <main className="w-full overflow-x-hidden pt-16 sm:pt-20">
        <HeroSection />
        <FeatureStrip />
        <StoreSection />
        <AboutSection />
      </main>

      <Footer />
    </div>
  );
}


export default LandingPage;
