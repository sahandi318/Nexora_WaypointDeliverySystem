import {
  ArrowRight,
  MapPin,
  Navigation,
  Store,
} from "lucide-react";


const featuredLocations = [
  {
    city: "Colombo",
    area: "Western Province",
  },
  {
    city: "Kandy",
    area: "Central Province",
  },
  {
    city: "Galle",
    area: "Southern Province",
  },
  {
    city: "Gampaha",
    area: "Western Province",
  },
];


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
          lg:grid-cols-[0.95fr_1.05fr]
          lg:items-center
          lg:gap-14
          lg:px-8
          lg:py-20
        "
      >
        <div className="min-w-0">
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
              lg:text-6xl
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
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
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


        <div
          className="
            landing-glass-card
            min-w-0
            rounded-[24px]
            p-4
            transition-colors
            duration-300
            sm:p-6
            md:p-7
            lg:rounded-[30px]
            lg:p-9
          "
        >
          <div
            className="
              flex
              min-w-0
              items-start
              justify-between
              gap-4
            "
          >
            <div className="min-w-0">
              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-[var(--color-primary)]
                  sm:text-xs
                "
              >
                Our Stores
              </p>

              <h2
                className="
                  mt-1.5
                  max-w-md
                  text-xl
                  font-black
                  leading-tight
                  text-[var(--color-text)]
                  sm:mt-2
                  sm:text-2xl
                "
              >
                Find a Waypoint Store Near You
              </h2>

              <p
                className="
                  mt-2
                  hidden
                  max-w-md
                  text-sm
                  leading-6
                  text-[var(--color-text-secondary)]
                  sm:block
                "
              >
                Explore some of the areas served by Nexora Waypoint stores.
              </p>
            </div>

            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-[var(--color-primary)]
                text-white
                shadow-md
                sm:h-14
                sm:w-14
                sm:rounded-2xl
              "
            >
              <Store size={22} />
            </div>
          </div>


          <div
            className="
              mt-5
              grid
              grid-cols-2
              gap-3
              sm:mt-7
              sm:gap-4
            "
          >
            {featuredLocations.map((location) => (
              <a
                key={location.city}
                href="#stores"
                className="
                  group
                  min-w-0
                  rounded-2xl
                  border
                  border-[var(--color-border)]
                  bg-[var(--color-surface-soft)]
                  p-3.5
                  transition
                  hover:-translate-y-0.5
                  hover:border-[var(--color-primary)]
                  hover:shadow-[var(--shadow-md)]
                  sm:p-5
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-2
                  "
                >
                  <div
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-[var(--color-surface)]
                      text-[var(--color-primary)]
                      shadow-sm
                      sm:h-11
                      sm:w-11
                      sm:rounded-xl
                    "
                  >
                    <MapPin size={17} />
                  </div>

                  <ArrowRight
                    size={15}
                    className="
                      shrink-0
                      text-[var(--color-text-muted)]
                      transition
                      group-hover:translate-x-1
                      group-hover:text-[var(--color-primary)]
                    "
                  />
                </div>

                <h3
                  className="
                    mt-3
                    truncate
                    text-sm
                    font-extrabold
                    text-[var(--color-text)]
                    sm:mt-4
                    sm:text-lg
                  "
                >
                  {location.city}
                </h3>

                <p
                  className="
                    mt-0.5
                    truncate
                    text-[10px]
                    text-[var(--color-text-secondary)]
                    sm:mt-1
                    sm:text-sm
                  "
                >
                  {location.area}
                </p>
              </a>
            ))}
          </div>


          <a
            href="#stores"
            className="
              landing-primary-action
              mt-4
              flex
              min-w-0
              items-center
              justify-between
              gap-3
              rounded-xl
              bg-[var(--color-primary)]
              px-4
              py-3
              text-white
              shadow-md
              sm:mt-6
              sm:rounded-2xl
              sm:px-5
              sm:py-4
            "
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-bold sm:text-sm">
                Find your nearest store
              </p>

              <p className="mt-0.5 hidden text-xs text-white/80 sm:block">
                Explore Waypoint locations across Sri Lanka
              </p>
            </div>

            <Navigation
              size={18}
              className="shrink-0"
            />
          </a>
        </div>
      </div>
    </section>
  );
}


export default HeroSection;
