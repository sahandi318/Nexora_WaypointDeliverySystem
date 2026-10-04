import {
  Home,
  Info,
  LogIn,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import logo from "../../assets/waypoint-logo.png";


const mobileLinks = [
  {
    label: "Home",
    href: "/#home",
    icon: Home,
  },
  {
    label: "Stores",
    href: "/#stores",
    icon: MapPin,
  },
  {
    label: "About",
    href: "/#about",
    icon: Info,
  },
  {
    label: "Contact",
    href: "/#contact",
    icon: Phone,
  },
];


function LandingNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);



  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);


  const closeMenu = () => {
    setIsMenuOpen(false);
  };


  return (
    <header
      className="
        landing-navbar-surface
        fixed
        inset-x-0
        top-0
        z-50
        border-b
        border-[var(--color-border)]
        transition-colors
        duration-300
      "
    >
      <div
        className="
          mx-auto
          flex
          h-16
          w-full
          max-w-7xl
          items-center
          justify-between
          gap-4
          px-4
          sm:h-20
          sm:px-6
          lg:px-8
        "
      >
        {/* BRAND */}

        <a
          href="/#home"
          onClick={closeMenu}
          className="
            flex
            min-w-0
            shrink-0
            items-center
            gap-2.5
          "
        >
          <img
            src={logo}
            alt="Nexora Waypoint"
            className="
              h-9
              w-9
              shrink-0
              rounded-lg
              object-cover
              sm:h-11
              sm:w-11
              sm:rounded-xl
            "
          />

          <div className="min-w-0 leading-tight">
            <p
              className="
                truncate
                text-[13px]
                font-extrabold
                tracking-wide
                text-[var(--color-text)]
                sm:text-base
              "
            >
              NEXORA
            </p>

            <p
              className="
                truncate
                text-[9px]
                font-semibold
                tracking-[0.18em]
                text-[var(--color-primary)]
                sm:text-xs
              "
            >
              WAYPOINT
            </p>
          </div>
        </a>


        {/* DESKTOP NAVIGATION */}

        <nav
          className="
            hidden
            items-center
            gap-7
            md:flex
            lg:gap-9
          "
        >
          <a
            href="/#home"
            className="
              text-sm
              font-semibold
              text-[var(--color-text)]
              transition
              hover:text-[var(--color-primary)]
            "
          >
            Home
          </a>

          <a
            href="/#stores"
            className="
              text-sm
              font-semibold
              text-[var(--color-text)]
              transition
              hover:text-[var(--color-primary)]
            "
          >
            Our Stores
          </a>

          <a
            href="/#about"
            className="
              text-sm
              font-semibold
              text-[var(--color-text)]
              transition
              hover:text-[var(--color-primary)]
            "
          >
            About
          </a>

          <a
            href="/#contact"
            className="
              text-sm
              font-semibold
              text-[var(--color-text)]
              transition
              hover:text-[var(--color-primary)]
            "
          >
            Contact
          </a>
        </nav>


        {/* ACTIONS */}

        <div className="flex shrink-0 items-center gap-2 pr-12 sm:pr-14">


          {/* Subtle administrator entry — intentionally secondary */}

          <Link
            to="/admin/login"
            aria-label="Administrator Login"
            title="Administrator Login"
            className="
              hidden
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-transparent
              bg-transparent
              text-[var(--color-text-muted)]
              transition
              duration-200
              hover:border-[var(--color-border)]
              hover:bg-[var(--color-surface-soft)]
              hover:text-[var(--color-primary)]
              md:inline-flex
            "
          >
            <ShieldCheck size={17} />
          </Link>


          {/* Primary staff entry */}

          <Link
            to="/login"
            className="
              hidden
              h-10
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-[var(--color-border)]
              bg-[var(--color-surface)]
              px-4
              text-sm
              font-bold
              text-[var(--color-text)]
              shadow-sm
              transition
              duration-200
              hover:-translate-y-0.5
              hover:border-[var(--color-primary)]
              hover:bg-[var(--color-surface-soft)]
              hover:shadow-md
              md:inline-flex
            "
            title="Staff Login"
          >
            <LogIn size={17} />
            Staff Login
          </Link>


          {/* Mobile: Staff Login remains directly accessible */}

          <Link
            to="/login"
            aria-label="Staff Login"
            title="Staff Login"
            className="
              inline-flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-[var(--color-border)]
              bg-[var(--color-surface)]
              text-[var(--color-text)]
              shadow-sm
              transition
              duration-200
              hover:border-[var(--color-primary)]
              hover:bg-[var(--color-surface-soft)]
              md:hidden
            "
          >
            <LogIn size={18} />
          </Link>


          {/* MOBILE MENU */}

          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={isMenuOpen}
            onClick={() =>
              setIsMenuOpen(
                (current) => !current
              )
            }
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-[var(--color-border)]
              bg-[var(--color-surface)]
              text-[var(--color-text)]
              shadow-sm
              transition
              duration-200
              hover:border-[var(--color-primary)]
              hover:bg-[var(--color-surface-soft)]
              md:hidden
            "
          >
            {isMenuOpen ? (
              <X size={19} />
            ) : (
              <Menu size={19} />
            )}
          </button>
        </div>
      </div>


      {/* MOBILE NAVIGATION */}

      {isMenuOpen && (
        <div
          className="
            border-t
            border-[var(--color-border)]
            bg-[var(--color-surface)]
            px-4
            pb-4
            pt-3
            shadow-md
            md:hidden
          "
        >
          <div
            className="
              mx-auto
              grid
              max-w-md
              grid-cols-4
              gap-2
            "
          >
            {mobileLinks.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="
                    flex
                    min-w-0
                    flex-col
                    items-center
                    justify-center
                    gap-1.5
                    rounded-xl
                    px-1
                    py-2.5
                    text-center
                    text-[10px]
                    font-semibold
                    text-[var(--color-text-secondary)]
                    transition
                    hover:bg-[var(--color-surface-soft)]
                    hover:text-[var(--color-primary)]
                  "
                >
                  <Icon size={17} />

                  <span className="truncate">
                    {item.label}
                  </span>
                </a>
              );
            })}
          </div>


          {/* Admin is deliberately quieter than Staff Login */}

          <Link
            to="/admin/login"
            onClick={closeMenu}
            className="
              mx-auto
              mt-3
              flex
              max-w-md
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-[var(--color-border)]
              px-3
              py-2.5
              text-xs
              font-semibold
              text-[var(--color-text-muted)]
              transition
              hover:bg-[var(--color-surface-soft)]
              hover:text-[var(--color-primary)]
            "
          >
            <ShieldCheck size={15} />
            Administrator access
          </Link>
        </div>
      )}
    </header>
  );
}


export default LandingNavbar;
