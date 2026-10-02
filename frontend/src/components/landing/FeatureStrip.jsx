import {
  Heart,
  MapPin,
  ShoppingBag,
  Users,
} from "lucide-react";


const features = [
  {
    icon: MapPin,
    mobileLabel: "Locations",
    title: "Multiple Locations",
    description: "Stores across Sri Lanka",
  },
  {
    icon: ShoppingBag,
    mobileLabel: "Shopping",
    title: "Everyday Shopping",
    description: "Convenient local stores",
  },
  {
    icon: Users,
    mobileLabel: "Service",
    title: "Friendly Service",
    description: "Serving local communities",
  },
  {
    icon: Heart,
    mobileLabel: "Community",
    title: "Growing Together",
    description: "Closer to our customers",
  },
];


function FeatureStrip() {
  return (
    <section
      className="
        border-y
        border-[var(--color-border)]
        bg-[var(--color-surface)]
        transition-colors
        duration-300
      "
    >
      <div
        className="
          mx-auto
          grid
          w-full
          max-w-7xl
          grid-cols-4
          px-2
          sm:px-6
          lg:px-8
        "
      >
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <div
              key={feature.title}
              className={`
                flex
                min-w-0
                flex-col
                items-center
                justify-center
                gap-2
                px-1
                py-4
                text-center
                sm:flex-row
                sm:justify-start
                sm:gap-3
                sm:px-4
                sm:py-6
                sm:text-left
                lg:gap-4
                lg:px-6
                ${
                  index !== features.length - 1
                    ? "border-r border-[var(--color-border)]"
                    : ""
                }
              `}
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
                  bg-[var(--color-surface-soft)]
                  text-[var(--color-primary)]
                  sm:h-11
                  sm:w-11
                  lg:h-12
                  lg:w-12
                "
              >
                <Icon size={17} />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    block
                    max-w-full
                    truncate
                    text-[9px]
                    font-extrabold
                    text-[var(--color-text)]
                    sm:hidden
                  "
                >
                  {feature.mobileLabel}
                </p>

                <p
                  className="
                    hidden
                    text-sm
                    font-extrabold
                    text-[var(--color-text)]
                    sm:block
                  "
                >
                  {feature.title}
                </p>

                <p
                  className="
                    mt-1
                    hidden
                    text-xs
                    text-[var(--color-text-secondary)]
                    md:block
                    lg:text-sm
                  "
                >
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
