import {
  Home,
  Info,
  Mail,
  MapPin,
  Store,
} from "lucide-react";

import logo from "../../assets/waypoint-logo.png";


const footerLinks = [
  {
    label: "Home",
    href: "#home",
    icon: Home,
  },
  {
    label: "Stores",
    href: "#stores",
    icon: Store,
  },
  {
    label: "About",
    href: "#about",
    icon: Info,
  },
];


function Footer() {
  return (
    <footer
      id="contact"
      className="
        landing-footer-surface
        scroll-mt-16
        sm:scroll-mt-20
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-7xl
          px-4
          py-9
          sm:grid
          sm:grid-cols-3
          sm:gap-8
          sm:px-6
          sm:py-12
          lg:gap-10
          lg:px-8
          lg:py-14
        "
      >
        {/* BRAND */}

        <div>
          <div
            className="
              flex
              items-center
              justify-center
              gap-2.5
              sm:justify-start
              sm:gap-3
            "
          >
            <img
              src={logo}
              alt="Nexora Waypoint"
              className="
                h-10
                w-10
                rounded-lg
                object-cover
                sm:h-12
                sm:w-12
                sm:rounded-xl
              "
            />

            <div>
              <p
                className="
                  text-sm
                  font-extrabold
                  tracking-wide
                  text-white
                  sm:text-base
                "
              >
                NEXORA
              </p>

              <p
                className="
                  text-[10px]
                  font-semibold
                  tracking-[0.18em]
                  text-[var(--color-sidebar-muted)]
                  sm:text-xs
                "
              >
                WAYPOINT
              </p>
            </div>
          </div>

          <p
            className="
              mx-auto
              mt-4
              max-w-xs
              text-center
              text-xs
              leading-5
              text-[var(--color-sidebar-muted)]
              sm:mx-0
              sm:mt-5
              sm:max-w-sm
              sm:text-left
              sm:text-sm
              sm:leading-6
            "
          >
            Discover convenient Waypoint stores and local shopping locations
            across Sri Lanka.
          </p>
        </div>


        {/* QUICK LINKS */}

        <div className="mt-7 sm:mt-0">
          <h3
            className="
              hidden
              text-sm
              font-extrabold
              uppercase
              tracking-[0.15em]
              text-white
              sm:block
            "
          >
            Quick Links
          </h3>

          <div
            className="
              grid
              grid-cols-3
              gap-2
              sm:mt-5
              sm:flex
              sm:flex-col
              sm:gap-3
            "
          >
            {footerLinks.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="
                    flex
                    min-w-0
                    flex-col
                    items-center
                    gap-1.5
                    rounded-xl
                    bg-white/5
                    px-1
                    py-3
                    text-[10px]
                    font-semibold
                    text-[var(--color-sidebar-muted)]
                    transition
                    hover:bg-white/10
                    hover:text-white
                    sm:flex-row
                    sm:justify-start
                    sm:bg-transparent
                    sm:p-0
                    sm:text-sm
                  "
                >
                  <Icon
                    size={16}
                    className="sm:hidden"
                  />

                  <span className="truncate">
                    {item.label}
                  </span>
                </a>
              );
            })}
          </div>
        </div>


        {/* CONTACT */}

        <div className="mt-7 sm:mt-0">
          <h3
            className="
              text-center
              text-xs
              font-extrabold
              uppercase
              tracking-[0.15em]
              text-white
              sm:text-left
              sm:text-sm
            "
          >
            Contact
          </h3>

          <div
            className="
              mt-4
              flex
              justify-center
              gap-3
              sm:block
              sm:space-y-4
            "
          >
            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                border
                border-white/10
                bg-white/8
                text-white
                sm:h-auto
                sm:w-auto
                sm:justify-start
                sm:gap-3
                sm:rounded-none
                sm:border-0
                sm:bg-transparent
                sm:text-sm
                sm:text-[var(--color-sidebar-muted)]
              "
              title="Waypoint Group, Sri Lanka"
            >
              <MapPin size={18} />

              <span className="hidden sm:inline">
                Waypoint Group, Sri Lanka
              </span>
            </div>

            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                border
                border-white/10
                bg-white/8
                text-white
                sm:h-auto
                sm:w-auto
                sm:items-start
                sm:justify-start
                sm:gap-3
                sm:rounded-none
                sm:border-0
                sm:bg-transparent
                sm:text-sm
                sm:text-[var(--color-sidebar-muted)]
              "
              title="Contact your nearest Waypoint store"
            >
              <Mail
                size={18}
                className="shrink-0"
              />

              <span className="hidden sm:inline">
                Contact your nearest Waypoint store for local information.
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* BOTTOM BAR */}

      <div
        className="
          border-t
          border-white/10
          bg-black/5
        "
      >
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-7xl
            flex-col
            items-center
            gap-1
            px-4
            py-4
            text-center
            text-[9px]
            text-[var(--color-sidebar-muted)]
            sm:flex-row
            sm:justify-between
            sm:px-6
            sm:py-5
            sm:text-left
            sm:text-xs
            lg:px-8
          "
        >
          <p>
            © 2026 Nexora Waypoint. All rights reserved.
          </p>

          <p className="hidden sm:block">
            Your local stores, always within reach.
          </p>
        </div>
      </div>
    </footer>
  );
}


export default Footer;
