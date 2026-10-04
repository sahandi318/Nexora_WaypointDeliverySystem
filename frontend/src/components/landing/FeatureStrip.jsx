import {
  Building2,
  LockKeyhole,
  MapPin,
  Truck,
} from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Outlet discovery",
    description: "Find public Waypoint locations quickly.",
  },
  {
    icon: Building2,
    title: "Network visibility",
    description: "Browse the store network by district and brand.",
  },
  {
    icon: LockKeyhole,
    title: "Secure staff access",
    description: "Authorized teams sign in through protected workspaces.",
  },
  {
    icon: Truck,
    title: "Connected operations",
    description: "Built to support coordinated delivery workflows.",
  },
];

function FeatureStrip() {
  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)] transition-colors duration-300">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <div
              key={feature.title}
              className={`flex min-w-0 items-start gap-3 px-2 py-5 sm:px-4 sm:py-6 lg:px-5 ${
                index % 2 === 0
                  ? "border-r border-[var(--color-border)]"
                  : ""
              } ${index < 2 ? "border-b border-[var(--color-border)] lg:border-b-0" : ""} ${
                index === 1 ? "lg:border-r" : ""
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface-soft)] text-[var(--color-primary)]">
                <Icon size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-extrabold text-[var(--color-text)]">
                  {feature.title}
                </p>
                <p className="mt-1 hidden text-sm leading-5 text-[var(--color-text-secondary)] sm:block">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default FeatureStrip;
