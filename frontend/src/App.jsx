import {
  CheckCircle2,
  Database,
  LockKeyhole,
  Palette,
  Store,
} from "lucide-react";

import ThemeToggle from "./components/common/ThemeToggle";

function App() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <header
        className="
          sticky
          top-0
          z-50
          border-b
          border-[var(--color-border)]
          bg-[var(--color-surface)]
        "
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-2xl
                bg-[var(--color-primary)]
                text-white
                shadow-md
              "
            >
              <Store size={22} strokeWidth={2.2} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Nexora Waypoint
              </h1>

              <p className="text-xs text-[var(--color-text-secondary)]">
                Delivery Operations Platform
              </p>
            </div>
          </div>

          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <section
          className="
            overflow-hidden
            rounded-[28px]
            border
            border-[var(--color-border)]
            bg-[var(--color-surface)]
            shadow-[var(--shadow-md)]
          "
        >
          <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="p-8 md:p-12">
              <div
                className="
                  mb-6
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  bg-[var(--color-primary-soft)]
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-[var(--color-primary-strong)]
                "
              >
                <CheckCircle2 size={16} />
                Store Manager foundation
              </div>

              <h2
                className="
                  max-w-3xl
                  text-4xl
                  font-bold
                  leading-tight
                  tracking-[-0.035em]
                  md:text-5xl
                "
              >
                Clean operations.
                <span className="text-[var(--color-primary)]">
                  {" "}
                  Better delivery control.
                </span>
              </h2>

              <p
                className="
                  mt-5
                  max-w-2xl
                  text-base
                  leading-7
                  text-[var(--color-text-secondary)]
                  md:text-lg
                "
              >
                Nexora Waypoint is being built with a database-driven
                architecture, secure role-based access and a consistent
                Emerald Green interface for both light and dark modes.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <TechnologyTag text="React" />
                <TechnologyTag text="Tailwind CSS" />
                <TechnologyTag text="Express" />
                <TechnologyTag text="MySQL" />
              </div>
            </div>

            <div
              className="
                border-t
                border-[var(--color-border)]
                bg-[var(--color-surface-soft)]
                p-8
                md:p-10
                lg:border-l
                lg:border-t-0
              "
            >
              <p
                className="
                  mb-6
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-[var(--color-text-muted)]
                "
              >
                Foundation status
              </p>

              <div className="space-y-4">
                <StatusItem
                  icon={Palette}
                  title="Emerald Design System"
                  description="Modern light and dark themes"
                />

                <StatusItem
                  icon={Store}
                  title="Store Manager"
                  description="Dedicated feature module"
                />

                <StatusItem
                  icon={Database}
                  title="Database Driven"
                  description="Operational data will come from MySQL"
                />

                <StatusItem
                  icon={LockKeyhole}
                  title="Secure Access"
                  description="JWT and RBAC authentication"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <PreviewCard
            title="Primary"
            value="Emerald Green"
            variant="primary"
          />

          <PreviewCard
            title="Surface"
            value="Clean & calm"
            variant="surface"
          />

          <PreviewCard
            title="Theme"
            value="Light + Dark"
            variant="accent"
          />
        </section>

        <p className="mt-10 text-center text-sm text-[var(--color-text-muted)]">
          Nexora Waypoint • Store Manager development environment
        </p>
      </main>
    </div>
  );
}

function TechnologyTag({ text }) {
  return (
    <span
      className="
        rounded-xl
        border
        border-[var(--color-border)]
        bg-[var(--color-surface-soft)]
        px-4
        py-2
        text-sm
        font-medium
      "
    >
      {text}
    </span>
  );
}

function StatusItem({ icon: Icon, title, description }) {
  return (
    <div
      className="
        flex
        items-start
        gap-4
        rounded-2xl
        border
        border-[var(--color-border)]
        bg-[var(--color-surface)]
        p-4
        shadow-[var(--shadow-xs)]
      "
    >
      <div
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-[var(--color-primary-soft)]
          text-[var(--color-primary)]
        "
      >
        <Icon size={19} />
      </div>

      <div>
        <h3 className="text-sm font-semibold">
          {title}
        </h3>

        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {description}
        </p>
      </div>
    </div>
  );
}

function PreviewCard({ title, value, variant }) {
  const backgrounds = {
    primary: "bg-[var(--color-primary)] text-white",
    surface:
      "bg-[var(--color-surface)] text-[var(--color-text)]",
    accent:
      "bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]",
  };

  return (
    <div
      className={`
        min-h-36
        rounded-2xl
        border
        border-[var(--color-border)]
        p-6
        shadow-[var(--shadow-sm)]
        ${backgrounds[variant]}
      `}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-75">
        {title}
      </p>

      <p className="mt-8 text-xl font-bold">
        {value}
      </p>
    </div>
  );
}

export default App;