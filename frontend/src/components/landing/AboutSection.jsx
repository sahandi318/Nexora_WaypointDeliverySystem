import {
  Heart,
  MapPin,
  ShoppingBag,
  Users,
} from "lucide-react";


const highlights = [
  {
    icon: MapPin,
    shortTitle: "Locations",
    title: "Multiple Locations",
    description:
      "Waypoint stores are available across several areas in Sri Lanka.",
  },
  {
    icon: ShoppingBag,
    shortTitle: "Shopping",
    title: "Everyday Shopping",
    description:
      "Convenient local stores for everyday products and essentials.",
  },
  {
    icon: Users,
    shortTitle: "Service",
    title: "Friendly Service",
    description:
      "A welcoming store experience focused on local customers.",
  },
  {
    icon: Heart,
    shortTitle: "Community",
    title: "Community Focus",
    description:
      "Growing together with the communities our stores serve.",
  },
];


function AboutSection() {
  return (
    <section
      id="about"
      className="
        landing-about-section
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
          grid
          w-full
          max-w-7xl
          gap-8
          px-4
          sm:px-6
          lg:grid-cols-2
          lg:items-center
          lg:gap-12
          lg:px-8
        "
      >
        <div>
          <p
            className="
              text-center
              text-[10px]
              font-bold
              uppercase
              tracking-[0.18em]
              text-[var(--color-primary)]
              sm:text-sm
              lg:text-left
            "
          >
            About Waypoint
          </p>

          <h2
            className="
              mx-auto
              mt-2
              max-w-lg
              text-center
              text-2xl
              font-black
              tracking-tight
              text-[var(--color-text)]
              sm:mt-3
              sm:text-3xl
              lg:mx-0
              lg:text-left
              lg:text-4xl
            "
          >
            Local stores made easier to find
          </h2>

          <p
            className="
              mx-auto
              mt-3
              max-w-lg
              text-center
              text-sm
              leading-6
              text-[var(--color-text-secondary)]
              sm:mt-5
              sm:text-base
              sm:leading-7
              lg:mx-0
              lg:text-left
            "
          >
            <span className="sm:hidden">
              Convenient local shopping, closer to you.
            </span>

            <span className="hidden sm:inline">
              Nexora Waypoint brings together local stores across Sri Lanka,
              helping customers discover convenient shopping locations closer
              to them.
            </span>
          </p>

          <p
            className="
              mt-4
              hidden
              max-w-xl
              text-base
              leading-7
              text-[var(--color-text-secondary)]
              lg:block
            "
          >
            Our goal is to make everyday shopping simple, accessible and
            connected with the communities we serve.
          </p>

          <a
            href="#stores"
            className="
              landing-primary-action
              mt-7
              hidden
              items-center
              justify-center
              rounded-xl
              bg-[var(--color-primary)]
              px-6
              py-3.5
              text-sm
              font-bold
              text-white
              shadow-md
              transition
              hover:-translate-y-0.5
              hover:bg-[var(--color-primary-hover)]
              lg:inline-flex
            "
          >
            Explore Our Stores
          </a>
        </div>


        <div
          className="
            grid
            grid-cols-2
            gap-3
            sm:gap-5
          "
        >
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="
                  landing-glass-card
                  min-w-0
                  rounded-2xl
                  p-4
                  transition-colors
                  duration-300
                  sm:p-5
                  lg:p-6
                "
              >
                <div
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-xl
                    bg-[var(--color-surface-soft)]
                    text-[var(--color-primary)]
                    sm:h-11
                    sm:w-11
                    lg:h-12
                    lg:w-12
                    lg:rounded-2xl
                  "
                >
                  <Icon size={18} />
                </div>

                <h3
                  className="
                    mt-3
                    truncate
                    text-xs
                    font-extrabold
                    text-[var(--color-text)]
                    sm:hidden
                  "
                >
                  {item.shortTitle}
                </h3>

                <h3
                  className="
                    mt-4
                    hidden
                    text-base
                    font-extrabold
                    text-[var(--color-text)]
                    sm:block
                    lg:mt-5
                    lg:text-lg
                  "
                >
                  {item.title}
                </h3>

                <p
                  className="
                    mt-2
                    hidden
                    text-xs
                    leading-5
                    text-[var(--color-text-secondary)]
                    md:block
                    lg:text-sm
                    lg:leading-6
                  "
                >
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


export default AboutSection;
