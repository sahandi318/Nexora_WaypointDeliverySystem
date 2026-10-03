import {
  useState,
} from "react";

import StoreManagerMobileDrawer from "./StoreManagerMobileDrawer";
import StoreManagerSidebar from "./StoreManagerSidebar";
import StoreManagerTopbar from "./StoreManagerTopbar";

function StoreManagerShell({
  user,
  outlet,
  depot,
  children,
}) {
  const [
    isMobileNavigationOpen,
    setIsMobileNavigationOpen,
  ] = useState(false);

  return (
    <div
      className="
        min-h-screen
        bg-[var(--color-bg)]
        text-[var(--color-text)]
      "
      style={{
        backgroundImage:
          "radial-gradient(circle at 82% 8%, rgba(60,203,143,0.07), transparent 24%), radial-gradient(circle at 68% 28%, rgba(141,224,182,0.06), transparent 20%)",
      }}
    >
      <div
        className="
          fixed
          inset-y-0
          left-0
          z-40
          hidden
          w-[236px]
          lg:block
        "
      >
        <StoreManagerSidebar
          user={user}
          outlet={outlet}
          depot={depot}
        />
      </div>

      <StoreManagerMobileDrawer
        isOpen={
          isMobileNavigationOpen
        }
        onClose={() =>
          setIsMobileNavigationOpen(
            false
          )
        }
        user={user}
        outlet={outlet}
        depot={depot}
      />

      <div
        className="
          min-h-screen
          lg:pl-[236px]
        "
      >
        <StoreManagerTopbar
          user={user}
          outlet={outlet}
          depot={depot}
          onOpenNavigation={() =>
            setIsMobileNavigationOpen(
              true
            )
          }
        />

        <main
          className="
            mx-auto
            w-full
            max-w-[1520px]
            px-4
            py-6
            sm:px-6
            sm:py-8
            xl:px-8
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default StoreManagerShell;
