function StoreManagerPageHeader({
  eyebrow,
  title,
  description,
  actions,
}) {
  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-[20px]
        border
        border-[var(--color-border)]
        bg-[var(--color-surface)]
        px-5
        py-5
        shadow-[0_10px_28px_rgba(15,23,42,0.035)]
        sm:px-6
      "
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-16
          -top-20
          h-56
          w-56
          rounded-full
          bg-[#8DE0B6]/10
          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          bottom-0
          right-10
          h-px
          w-48
          bg-[linear-gradient(90deg,transparent,#8DE0B6,transparent)]
          opacity-40
        "
      />

      <div
        className="
          relative
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div
          className="
            min-w-0
          "
        >
          {eyebrow && (
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-[#16A572]
                  shadow-[0_0_0_4px_rgba(22,165,114,0.10)]
                "
              />

              <p
                className="
                  text-[9.5px]
                  font-bold
                  uppercase
                  tracking-[0.15em]
                  text-[var(--color-primary)]
                "
              >
                {eyebrow}
              </p>
            </div>
          )}

          <h1
            className="
              mt-2
              text-[1.55rem]
              font-bold
              tracking-[-0.035em]
              text-[var(--color-text)]
              sm:text-[1.75rem]
            "
          >
            {title}
          </h1>

          {description && (
            <p
              className="
                mt-2
                max-w-3xl
                text-[12.5px]
                leading-5
                text-[var(--color-text-secondary)]
              "
            >
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div
            className="
              flex
              shrink-0
              items-center
              gap-2
            "
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default StoreManagerPageHeader;
