import {
  ArrowRight,
  Building2,
  ShieldCheck,
  Store,
  Workflow,
} from "lucide-react";

const highlights = [
  {
    icon: Store,
    title: "Public store directory",
    description:
      "A simple way for visitors to browse Waypoint outlets without exposing internal operational information.",
  },
  {
    icon: ShieldCheck,
    title: "Secure role-based access",
    description:
      "Authorized staff use protected sign-in flows and dedicated workspaces for their responsibilities.",
  },
  {
    icon: Workflow,
    title: "Built for coordinated delivery",
    description:
      "The platform brings store, dispatch, loading and delivery workflows into one connected system.",
  },
];

function AboutSection() {
  return (
    <section
      id="about"
      className="landing-about-section scroll-mt-16 py-14 transition-colors duration-300 sm:scroll-mt-20 sm:py-20 lg:py-24"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14 lg:px-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-primary)] sm:text-sm">
            About Nexora Waypoint
          </p>

          <h2 className="mt-3 max-w-xl text-3xl font-black tracking-[-0.035em] text-[var(--color-text)] sm:text-4xl">
            One clear digital experience for the Waypoint network.
          </h2>

          <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
            Nexora Waypoint combines a public-facing outlet directory with a secure
            operational platform for authorized staff. The landing page keeps store
            discovery simple, while protected areas support the delivery workflow
            behind the network.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#stores"
              className="landing-primary-action inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-hover)]"
            >
              Explore outlets
              <ArrowRight size={16} />
            </a>

            <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-text-secondary)]">
              <Building2 size={16} className="text-[var(--color-primary)]" />
              Sri Lanka store network
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="landing-glass-card flex gap-4 rounded-2xl p-4 sm:p-5 lg:p-6"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface-soft)] text-[var(--color-primary)]">
                  <Icon size={19} />
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-[var(--color-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {item.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
