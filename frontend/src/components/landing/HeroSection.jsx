import {
  ArrowRight,
  Building2,
  MapPin,
} from "lucide-react";

import headquartersImage from "../../assets/landing/waypoint-headquarters-hero.webp";


function HeroSection() {
  return (
    <section
      id="home"
      className="
        landing-hero-surface
        scroll-mt-16
        overflow-hidden
        transition-colors
        duration-300
        sm:scroll-mt-20
      "
    >
      <div
        className="
          relative
          mx-auto
          grid
          w-full
          max-w-7xl
          gap-8
          px-4
          py-10
          sm:px-6
          sm:py-14
          md:gap-10
          lg:grid-cols-[0.9fr_1.1fr]
          lg:items-center
          lg:gap-10
          lg:px-8
          lg:py-18
          xl:gap-14
          xl:py-22
        "
      >
        <div
          className="
            relative
            z-10
            min-w-0
          "
        >
          <div
            className="
              inline-flex
              items-center
              gap-1.5
              rounded-full
              border
              border-[var(--color-border)]
              bg-[var(--color-surface-soft)]
              px-3.5
              py-1.5
              text-[10px]
              font-semibold
              text-[var(--color-primary)]
              shadow-[var(--shadow-xs)]
              sm:px-4
              sm:py-2
              sm:text-sm
            "
          >
            <MapPin size={14} />
            Trusted store coverage across Sri Lanka
          </div>

          <h1
            className="
              mt-4
              max-w-2xl
              text-[2.2rem]
              font-black
              leading-[1.02]
              tracking-tight
              text-[var(--color-text)]
              min-[420px]:text-[2.55rem]
              sm:mt-6
              sm:text-5xl
              lg:text-[3.65rem]
              xl:text-[4.25rem]
            "
          >
            Waypoint stores,
            <span className="mt-1 block text-[var(--color-primary)] sm:mt-2">
              easier to discover
            </span>
          </h1>

          <p
            className="
              mt-4
              max-w-xl
              text-sm
              leading-6
              text-[var(--color-text-secondary)]
              sm:mt-6
              sm:text-lg
              sm:leading-8
            "
          >
            Discover the Nexora Waypoint network through a clear, professional
            experience. Browse outlets, filter by district or brand and find the
            location information you need without unnecessary complexity.
          </p>

          <div
            className="
              mt-6
              flex
              flex-col
              gap-3
              sm:mt-8
              sm:flex-row
            "
          >
            <a
              href="#stores"
              className="
                landing-primary-action
                inline-flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[var(--color-primary)]
                px-5
                py-3.5
                text-sm
                font-bold
                text-white
                shadow-md
                transition
                hover:-translate-y-0.5
                hover:bg-[var(--color-primary-hover)]
                sm:w-auto
                sm:px-6
              "
            >
              Explore outlets
              <ArrowRight size={17} />
            </a>

            <a
              href="#about"
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-[var(--color-border-strong)]
                bg-[var(--color-surface)]
                px-6
                py-3.5
                text-sm
                font-bold
                text-[var(--color-text)]
                shadow-[var(--shadow-xs)]
                transition
                hover:-translate-y-0.5
                hover:border-[var(--color-primary)]
                hover:bg-[var(--color-surface-soft)]
              "
            >
              <Building2 size={18} />
              Learn more
            </a>
          </div>
        </div>

        <div
          className="
            landing-hero-hq
            relative
            min-h-[340px]
            overflow-hidden
            sm:min-h-[440px]
            lg:min-h-[620px]
            xl:min-h-[660px]
          "
        >
          <img
            src={headquartersImage}
            alt="Nexora Waypoint headquarters"
            className="
              landing-hero-hq-image
              absolute
              inset-0
              h-full
              w-full
              object-cover
            "
          />

          <div
            className="
              landing-hero-hq-lighting
              pointer-events-none
              absolute
              inset-0
            "
          />

          <div
            className="
              landing-hero-hq-fade
              pointer-events-none
              absolute
              inset-0
            "
          />

          <div
            className="
              landing-hero-hq-brand-glow
              pointer-events-none
              absolute
              inset-0
            "
          />

        </div>
      </div>
    </section>
  );
}

export default HeroSection;
