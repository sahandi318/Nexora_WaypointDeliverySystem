import {
  Menu,
  Store,
  Warehouse,
} from "lucide-react";

import LanguageSelector from "../common/LanguageSelector";
import ThemeToggle from "../common/ThemeToggle";

import useTranslations from "../../hooks/useTranslations";

function StoreManagerTopbar({
  user,
  outlet,
  depot,
  onOpenNavigation,
}) {
  const {
    t,
  } = useTranslations();

  const displayName =
    user?.fullName ||
    user?.userId ||
    t(
      "role.storeManager"
    );

  const initials =
    getInitials(
      displayName
    );

  return (
    <header
      className="
        sticky
        top-0
        z-[120]
        border-b
        border-[var(--color-border)]
        bg-[var(--color-surface)]/96
        shadow-[0_1px_0_rgba(15,23,42,0.035)]
        backdrop-blur-xl
      "
    >
      <div
        className="
          relative
          flex
          min-h-[66px]
          items-center
          justify-between
          gap-3
          px-4
          sm:px-6
          xl:px-8
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-y-0
            left-0
            w-[360px]
          "
          style={{
            background:
              "radial-gradient(circle at 18% 50%, rgba(60,203,143,0.075), transparent 62%)",
          }}
        />

        <div
          className="
            relative
            flex
            min-w-0
            items-center
            gap-3
          "
        >
          <button
            type="button"
            onClick={
              onOpenNavigation
            }
            aria-label={t(
              "storeManager.openNavigation"
            )}
            className="
              nexora-focus
              inline-flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-[var(--color-border)]
              bg-[var(--color-surface)]
              text-[var(--color-text-secondary)]
              shadow-sm
              transition
              hover:bg-[var(--color-surface-soft)]
              hover:text-[var(--color-text)]
              lg:hidden
            "
          >
            <Menu
              size={18}
            />
          </button>

          <div
            className="
              flex
              min-w-0
              items-center
              gap-2.5
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-[#C9F0DA]
                bg-[var(--color-surface)]
                text-[#0F6B4F]
                shadow-[0_4px_12px_rgba(15,169,104,0.06)]
              "
            >
              <Store
                size={16}
              />
            </div>

            <div
              className="
                min-w-0
              "
            >
              <p
                className="
                  truncate
                  text-[12.5px]
                  font-bold
                  text-[var(--color-text)]
                "
              >
                {outlet?.brand ||
                  t(
                    "storeManager.outlet"
                  )}

                {outlet?.outletCode
                  ? ` · ${outlet.outletCode}`
                  : ""}
              </p>

              <div
                className="
                  mt-0.5
                  hidden
                  items-center
                  gap-1.5
                  text-[10px]
                  text-[var(--color-text-muted)]
                  sm:flex
                "
              >
                <Warehouse
                  size={11.5}
                  className="
                    shrink-0
                  "
                />

                <span
                  className="
                    truncate
                  "
                >
                  {depot?.name ||
                    t(
                      "storeManager.notAssigned"
                    )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="
            relative
            z-[140]
            flex
            shrink-0
            items-center
            gap-2
          "
        >
          <div
            className="
              hidden
              sm:block
            "
          >
            <LanguageSelector />
          </div>

          <div
            className="
              sm:hidden
            "
          >
            <LanguageSelector
              compact
            />
          </div>

          <ThemeToggle
            inline
          />

          <div
            className="
              hidden
              h-8
              w-px
              bg-[var(--color-border)]
              lg:block
            "
          />

          <div
            className="
              hidden
              items-center
              gap-2.5
              rounded-xl
              border
              border-[var(--color-border)]
              bg-[var(--color-surface-soft)]
              px-2.5
              py-1.5
              lg:flex
            "
          >
            <div
              className="
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[linear-gradient(145deg,#16A572_0%,#0F6B4F_100%)]
                text-[9px]
                font-extrabold
                text-white
              "
            >
              {initials}
            </div>

            <div
              className="
                min-w-0
                text-left
              "
            >
              <p
                className="
                  max-w-[165px]
                  truncate
                  text-[10.5px]
                  font-bold
                  text-[var(--color-text)]
                "
              >
                {displayName}
              </p>

              <p
                className="
                  mt-0.5
                  text-[9px]
                  text-[var(--color-text-muted)]
                "
              >
                {t(
                  "role.storeManager"
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function getInitials(
  value
) {
  if (!value) {
    return "SM";
  }

  const words =
    value
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    words.length === 1
  ) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${
    words[
      words.length - 1
    ][0]
  }`.toUpperCase();
}

export default StoreManagerTopbar;
