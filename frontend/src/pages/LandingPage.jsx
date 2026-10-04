import AboutSection from "../components/landing/AboutSection";
import FeatureStrip from "../components/landing/FeatureStrip";
import HeroSection from "../components/landing/HeroSection";
import PlatformOverviewSection from "../components/landing/PlatformOverviewSection";
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
      <main className="w-full overflow-x-hidden">
        <HeroSection />
        <FeatureStrip />
        <StoreSection />
        <AboutSection />
        <PlatformOverviewSection />
      </main>
    </div>
  );
}

export default LandingPage;
