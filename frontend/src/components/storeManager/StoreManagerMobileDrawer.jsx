import {
  X,
} from "lucide-react";

import StoreManagerSidebar from "./StoreManagerSidebar";

import useTranslations from "../../hooks/useTranslations";

function StoreManagerMobileDrawer({
  isOpen,
  onClose,
  user,
  outlet,
  depot,
}) {
  const {
    t,
  } = useTranslations();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        lg:hidden
      "
    >
      <button
        type="button"
        aria-label={t(
          "storeManager.closeNavigation"
        )}
        onClick={
          onClose
        }
        className="
          absolute
          inset-0
          bg-black/45
          backdrop-blur-[1px]
        "
      />

      <div
        className="
          relative
          h-full
          w-[min(82vw,272px)]
          shadow-2xl
        "
      >
        <StoreManagerSidebar
          user={user}
          outlet={outlet}
          depot={depot}
          onNavigate={
            onClose
          }
        />

        <button
          type="button"
          onClick={
            onClose
          }
          aria-label={t(
            "storeManager.closeNavigation"
          )}
          className="
            nexora-focus
            absolute
            right-2.5
            top-4
            inline-flex
            h-8
            w-8
            items-center
            justify-center
            rounded-lg
            text-white/60
            transition
            hover:bg-white/10
            hover:text-white
          "
        >
          <X
            size={17}
          />
        </button>
      </div>
    </div>
  );
}

export default StoreManagerMobileDrawer;
