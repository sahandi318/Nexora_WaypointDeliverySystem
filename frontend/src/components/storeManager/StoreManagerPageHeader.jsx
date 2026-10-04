function StoreManagerPageHeader({
  eyebrow,
  title,
  description,
  actions,
}) {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5 shadow-[0_10px_26px_rgba(15,23,42,0.035)] sm:px-6">
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px] bg-[linear-gradient(180deg,var(--color-primary)_0%,var(--color-accent)_66%,transparent_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-24 h-52 w-52 rounded-full bg-[var(--color-primary)]/[0.045] blur-3xl"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_0_4px_rgba(22,165,114,0.10)]" />
              <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[var(--color-primary)]">
                {eyebrow}
              </p>
            </div>
          ) : null}

          <h1 className={`${eyebrow ? "mt-2" : ""} text-[1.5rem] font-extrabold tracking-[-0.038em] text-[var(--color-text)] sm:text-[1.7rem]`}>
            {title}
          </h1>

          {description ? (
            <p className="mt-1.5 max-w-3xl text-[11.5px] leading-5 text-[var(--color-text-secondary)] sm:text-[12px]">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default StoreManagerPageHeader;
