import {
  Hash,
} from "lucide-react";


export const USER_ID_PREFIXES =
  Object.freeze({
    ADMIN:
      "ADMIN",

    STORE_MANAGER:
      "SM",

    DISPATCHER:
      "DSP",

    LOADER:
      "LD",

    DRIVER:
      "DR",
  });


function PrefixedUserIdField({
  id,
  label = "User ID",
  prefix,
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = "001",
}) {
  function handleChange(
    event
  ) {
    const numericPart =
      event.target.value
        .replace(
          /\D/g,
          ""
        )
        .slice(
          0,
          12
        );


    onChange(
      numericPart
    );
  }


  return (
    <div>
      <label
        htmlFor={
          id
        }
        className="
          mb-2
          block
          text-sm
          font-semibold
          text-[var(--color-text)]
        "
      >
        {label}

        {required && (
          <span className="ml-1 text-[var(--color-primary)]">
            *
          </span>
        )}
      </label>

      <div
        className="
          grid
          grid-cols-[auto_minmax(0,1fr)]
          overflow-hidden
          rounded-xl
          border
          border-[var(--color-border)]
          bg-[var(--color-input)]
          transition
          focus-within:border-[var(--color-primary)]
          focus-within:ring-1
          focus-within:ring-[var(--color-primary)]
        "
      >
        <div
          className="
            flex
            h-12
            min-w-[78px]
            items-center
            justify-center
            gap-1.5
            border-r
            border-[var(--color-border)]
            bg-[var(--color-surface-soft)]
            px-3
            text-sm
            font-extrabold
            tracking-[0.04em]
            text-[var(--color-primary)]
          "
          aria-hidden="true"
        >
          <Hash
            size={14}
            strokeWidth={2.4}
          />

          {prefix}
        </div>

        <input
          id={
            id
          }
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={
            value
          }
          onChange={
            handleChange
          }
          disabled={
            disabled
          }
          required={
            required
          }
          placeholder={
            placeholder
          }
          className="
            h-12
            min-w-0
            w-full
            bg-transparent
            px-4
            text-sm
            font-semibold
            tracking-[0.04em]
            text-[var(--color-text)]
            outline-none
            placeholder:font-normal
            placeholder:tracking-normal
            placeholder:text-[var(--color-text-muted)]
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        />
      </div>
    </div>
  );
}


export default PrefixedUserIdField;
