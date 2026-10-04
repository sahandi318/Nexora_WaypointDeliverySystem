import {
  ArrowRight,
  MapPin,
  Search,
  ShieldCheck,
  Store,
} from "lucide-react";

const userSteps = [
  {
    icon: Store,
    eyebrow: "Explore",
    title: "Find a Waypoint outlet",
    description:
      "Browse the public outlet directory to see available Waypoint locations across Sri Lanka.",
  },
  {
    icon: Search,
    eyebrow: "Narrow your search",
    title: "Choose the location that suits you",
    description:
      "Use district, brand and outlet search filters to quickly find the location you are looking for.",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Secure access",
    title: "Staff can sign in safely",
    description:
      "Authorized Waypoint staff can continue to their secure workspace from the staff login area.",
  },
];

function PlatformOverviewSection() {
  return (
    <section
      id="platform"
      className="
        scroll-mt-20
        border-t
        border-[var(--color-border)]
        bg-[var(--color-surface)]
        py-14
        transition-colors
        duration-300
        sm:py-18
        lg:py-20
      "
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-primary)] sm:text-xs">
            <MapPin size={14} />
            Make the most of Waypoint
          </div>

          <h2 className="mt-4 text-2xl font-black tracking-tight text-[var(--color-text)] sm:text-3xl lg:text-4xl">
            A simple way to find what you need
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base sm:leading-8">
            Whether you are looking for a nearby outlet or returning to a staff
            workspace, Waypoint keeps the journey clear, quick and easy to use.
          </p>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-3 lg:mt-11 lg:gap-5">
          {userSteps.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="
                  group
                  rounded-[24px]
                  border
                  border-[var(--color-border)]
                  bg-[var(--color-bg)]
                  p-5
                  shadow-[var(--shadow-xs)]
                  transition
                  duration-300
                  hover:-translate-y-1
                  hover:border-[var(--color-primary)]
                  hover:shadow-[var(--shadow-md)]
                  sm:p-6
                "
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-surface-soft)] text-[var(--color-primary)]">
                  <Icon size={20} />
                </div>

                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-primary)] sm:text-xs">
                  {item.eyebrow}
                </p>

                <h3 className="mt-2 text-lg font-black leading-snug text-[var(--color-text)] sm:text-xl">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>

        <div
          className="
            mt-6
            flex
            flex-col
            gap-4
            rounded-[24px]
            border
            border-[var(--color-border)]
            bg-[var(--color-surface-soft)]
            p-5
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:p-6
          "
        >
          <div>
            <p className="text-base font-black text-[var(--color-text)] sm:text-lg">
              Looking for a store?
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
              Start with the outlet directory and use the filters to find a suitable location.
            </p>
          </div>

          <a
            href="#stores"
            className="
              landing-primary-action
              inline-flex
              shrink-0
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-[var(--color-primary)]
              px-5
              py-3
              text-sm
              font-bold
              text-white
              shadow-[var(--shadow-sm)]
              transition
              hover:-translate-y-0.5
              hover:bg-[var(--color-primary-hover)]
            "
          >
            Browse outlets
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

export default PlatformOverviewSection;
