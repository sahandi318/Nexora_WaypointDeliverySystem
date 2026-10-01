import {
  ArrowRight,
  MapPin,
  Store,
} from "lucide-react";


const stores = [
  {
    city: "Colombo",
    province: "Western Province",
    description:
      "Explore convenient Nexora Waypoint stores across the Colombo area.",
  },
  {
    city: "Kandy",
    province: "Central Province",
    description:
      "Find Nexora Waypoint stores serving customers across the Kandy area.",
  },
  {
    city: "Galle",
    province: "Southern Province",
    description:
      "Discover accessible Nexora Waypoint stores across the Galle area.",
  },
  {
    city: "Gampaha",
    province: "Western Province",
    description:
      "Explore nearby Nexora Waypoint stores throughout the Gampaha area.",
  },
];


function StoreSection() {
  return (
    <section
      id="stores"
      className="
        landing-soft-section
        scroll-mt-16
        py-12
        transition-colors
        duration-300
        sm:scroll-mt-20
        sm:py-18
        lg:py-24
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-7xl
          px-4
          sm:px-6
          lg:px-8
        "
      >
        <div
          className="
            mx-auto
            max-w-2xl
            text-center
          "
        >
          <p
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-[0.18em]
              text-[var(--color-primary)]
              sm:text-sm
            "
          >
            Our Stores
          </p>

          <h2
            className="
              mt-2
              text-2xl
              font-black
              tracking-tight
              text-[var(--color-text)]
              sm:mt-3
              sm:text-3xl
              lg:text-4xl
            "
          >
            Find a Nexora Waypoint store near you
          </h2>

          <p
            className="
              mx-auto
              mt-3
              max-w-xl
              text-sm
              leading-6
              text-[var(--color-text-secondary)]
              sm:mt-4
              sm:text-base
              sm:leading-7
            "
          >
            <span className="sm:hidden">
              Explore convenient Waypoint locations.
            </span>

            <span className="hidden sm:inline">
              Explore selected store areas and discover a convenient Waypoint
              location closer to you.
            </span>
          </p>
        </div>


        <div
          className="
            mt-8
            grid
            grid-cols-2
            gap-3
            sm:mt-10
            sm:gap-5
            lg:mt-12
            lg:grid-cols-4
            lg:gap-6
          "
        >
          {stores.map((store) => (
            <article
              key={store.city}
              className="
                landing-glass-card
                group
                min-w-0
                rounded-2xl
                p-3.5
                transition
                hover:-translate-y-1
                hover:border-[var(--color-primary)]
                hover:shadow-[var(--shadow-md)]
                sm:p-5
                lg:min-h-[250px]
                lg:p-6
              "
            >
              <div
                className="
                  flex
                  items-start
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
                    rounded-xl
                    bg-[var(--color-surface-soft)]
                    text-[var(--color-primary)]
                    transition
                    group-hover:bg-[var(--color-primary)]
                    group-hover:text-white
                    sm:h-11
                    sm:w-11
                    lg:h-12
                    lg:w-12
                    lg:rounded-2xl
                  "
                >
                  <Store size={18} />
                </div>

                <ArrowRight
                  size={16}
                  className="
                    mt-1
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
                  sm:text-lg
                  lg:mt-5
                  lg:text-xl
                "
              >
                {store.city}
              </h3>

              <div
                className="
                  mt-1
                  flex
                  min-w-0
                  items-center
                  gap-1.5
                  text-[10px]
                  font-semibold
                  text-[var(--color-primary)]
                  sm:text-xs
                  lg:mt-2
                  lg:gap-2
                  lg:text-sm
                "
              >
                <MapPin
                  size={12}
                  className="shrink-0 lg:hidden"
                />

                <MapPin
                  size={16}
                  className="hidden shrink-0 lg:block"
                />

                <span className="truncate">
                  {store.province}
                </span>
              </div>

              <p
                className="
                  mt-3
                  hidden
                  text-sm
                  leading-6
                  text-[var(--color-text-secondary)]
                  md:block
                  lg:mt-4
                "
              >
                {store.description}
              </p>

              <a
                href="#contact"
                className="
                  mt-5
                  hidden
                  text-sm
                  font-bold
                  text-[var(--color-primary)]
                  transition
                  hover:text-[var(--color-primary-hover)]
                  lg:inline-block
                "
              >
                Store information
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


export default StoreSection;
