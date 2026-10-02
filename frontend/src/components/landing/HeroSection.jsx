import {
  ArrowRight,
  Building2,
  MapPin,
  Navigation,
  Store,
} from "lucide-react";

import headquartersImage from "../../assets/landing/waypoint-headquarters-hero.webp";


const mobileBenefits = [
  {
    icon: MapPin,
    label: "Locations",
  },
  {
    icon: Store,
    label: "Local Stores",
  },
  {
    icon: Navigation,
    label: "Easy to Find",
  },
];


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
          py-8
          sm:px-6
          sm:py-12
          md:gap-10
          md:py-14
          lg:grid-cols-[0.92fr_1.08fr]
          lg:items-center
          lg:gap-10
          lg:px-8
          lg:py-16
          xl:gap-14
          xl:py-20
        "
      >
        {/* HERO COPY */}

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
              px-3
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
            Stores across Sri Lanka
          </div>


          <h1
            className="
              mt-4
              max-w-2xl
              text-[2rem]
              font-black
              leading-[1.03]
              tracking-tight
              text-[var(--color-text)]
              min-[420px]:text-[2.35rem]
              sm:mt-6
              sm:text-5xl
              lg:text-[3.45rem]
              xl:text-6xl
            "
          >
            Your Local Stores,

            <span
              className="
                mt-1
                block
                text-[var(--color-primary)]
                sm:mt-2
              "
            >
              Always Within Reach
            </span>
          </h1>


          <p
            className="
              mt-4
              max-w-lg
              text-sm
              leading-6
              text-[var(--color-text-secondary)]
              sm:mt-6
              sm:text-lg
              sm:leading-7
            "
          >
            <span className="sm:hidden">
              Find convenient Nexora Waypoint stores near you.
            </span>

            <span className="hidden sm:inline">
              Discover Nexora Waypoint stores across Sri Lanka and find a
              convenient location closer to you.
            </span>
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
              Explore Stores
              <ArrowRight size={17} />
            </a>

            <a
              href="#about"
              className="
                hidden
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
                sm:inline-flex
              "
            >
              <Store size={18} />
              Learn More
            </a>
          </div>


          <div
            className="
              mt-6
              grid
              grid-cols-3
              gap-2
              border-t
              border-[var(--color-border)]
              pt-5
              sm:hidden
            "
          >
            {mobileBenefits.map((item) => {
              const Icon =
                item.icon;


              return (
                <div
                  key={
                    item.label
                  }
                  className="
                    landing-glass-card
                    flex
                    min-w-0
                    flex-col
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    px-1
                    py-3
                    text-center
                  "
                >
                  <div
                    className="
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-full
                      bg-[var(--color-surface-soft)]
                      text-[var(--color-primary)]
                    "
                  >
                    <Icon size={15} />
                  </div>

                  <span
                    className="
                      block
                      w-full
                      truncate
                      text-[9px]
                      font-bold
                      leading-tight
                      text-[var(--color-text)]
                    "
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>


          <div
            className="
              mt-10
              hidden
              grid-cols-3
              gap-6
              border-t
              border-[var(--color-border)]
              pt-6
              sm:grid
            "
          >
            <div>
              <p className="text-sm font-bold text-[var(--color-text)]">
                Multiple Locations
              </p>

              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Across Sri Lanka
              </p>
            </div>

            <div>
              <p className="text-sm font-bold text-[var(--color-text)]">
                Local Stores
              </p>

              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Easy to reach
              </p>
            </div>

            <div>
              <p className="text-sm font-bold text-[var(--color-text)]">
                Convenient Service
              </p>

              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Closer to you
              </p>
            </div>
          </div>
        </div>


        {/* THEME-AWARE HEADQUARTERS VISUAL
            IMPORTANT:
            The exact same image is used in light and dark mode.
            Only filters/lighting overlays change, so the building
            structure and camera angle never change.
        */}

        <div
          className="
            landing-hero-hq
            relative
            min-h-[330px]
            overflow-hidden
            rounded-[24px]
            border
            border-[var(--color-border)]
            shadow-[var(--shadow-lg)]
            sm:min-h-[430px]
            sm:rounded-[30px]
            lg:min-h-[590px]
            xl:min-h-[620px]
          "
        >
          <img
            src={
              headquartersImage
            }
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


          <div
            className="
              absolute
              left-4
              top-4
              z-10
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-white/20
              bg-black/25
              px-3
              py-1.5
              text-[10px]
              font-extrabold
              uppercase
              tracking-[0.15em]
              text-white
              shadow-lg
              backdrop-blur-md
              sm:left-5
              sm:top-5
              sm:text-xs
            "
          >
            <Building2 size={14} />
            Waypoint Headquarters
          </div>


          <div
            className="
              landing-hero-hq-mode
              absolute
              bottom-4
              right-4
              z-10
              flex
              items-center
              gap-2
              rounded-full
              border
              border-white/20
              bg-black/30
              px-3
              py-1.5
              text-[10px]
              font-bold
              text-white
              shadow-lg
              backdrop-blur-md
              sm:bottom-5
              sm:right-5
              sm:text-xs
            "
          >
            <span
              className="
                landing-hero-hq-status-dot
                h-2
                w-2
                rounded-full
              "
            />

            <span className="landing-hero-hq-day-copy">
              Natural daylight
            </span>

            <span className="landing-hero-hq-night-copy">
              Night illumination
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}


export default HeroSection;
