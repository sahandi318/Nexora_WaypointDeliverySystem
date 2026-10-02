import {
  Check,
  Circle,
} from "lucide-react";


export function getPasswordRequirements(
  password = ""
) {
  return {
    uppercase:
      /[A-Z]/.test(
        password
      ),

    lowercase:
      /[a-z]/.test(
        password
      ),

    number:
      /[0-9]/.test(
        password
      ),

    special:
      /[^A-Za-z0-9]/.test(
        password
      ),

    length:
      password.length >= 10,
  };
}


export function isPasswordStrong(
  password = ""
) {
  return Object.values(
    getPasswordRequirements(
      password
    )
  ).every(Boolean);
}


function PasswordRequirements({
  password,
}) {
  const requirements =
    getPasswordRequirements(
      password
    );

  const items = [
    {
      key:
        "uppercase",

      label:
        "Uppercase",
    },
    {
      key:
        "lowercase",

      label:
        "Lowercase",
    },
    {
      key:
        "number",

      label:
        "Number",
    },
    {
      key:
        "special",

      label:
        "Symbol",
    },
    {
      key:
        "length",

      label:
        "10+ chars",
    },
  ];


  return (
    <div
      className="
        w-full
        max-w-2xl
        rounded-xl
        border
        border-[var(--color-border)]
        bg-[var(--color-surface-soft)]
        p-3
      "
    >
      <p
        className="
          mb-2
          text-[10px]
          font-bold
          uppercase
          tracking-[0.1em]
          text-[var(--color-text-muted)]
        "
      >
        Password requirements
      </p>

      <div
        className="
          grid
          grid-cols-2
          gap-1.5
          sm:grid-cols-3
        "
      >
        {items.map(
          (item) => {
            const passed =
              requirements[
                item.key
              ];


            return (
              <div
                key={
                  item.key
                }
                className={`
                  flex
                  min-h-8
                  items-center
                  gap-2
                  rounded-lg
                  border
                  px-2.5
                  py-1.5
                  text-[11px]
                  font-semibold
                  transition
                  duration-200
                  ${
                    passed
                      ? `
                        border-[var(--color-success)]
                        bg-[var(--color-success-soft)]
                        text-[var(--color-success)]
                      `
                      : `
                        border-[var(--color-border)]
                        bg-[var(--color-surface)]
                        text-[var(--color-text)]
                      `
                  }
                `}
              >
                <span
                  className={`
                    flex
                    h-4
                    w-4
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    ${
                      passed
                        ? `
                          bg-[var(--color-success)]
                          text-white
                        `
                        : `
                          border
                          border-[var(--color-border-strong)]
                          text-[var(--color-text-muted)]
                        `
                    }
                  `}
                >
                  {passed ? (
                    <Check
                      size={10}
                      strokeWidth={3}
                    />
                  ) : (
                    <Circle
                      size={7}
                      strokeWidth={1.8}
                    />
                  )}
                </span>

                {item.label}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}


export default PasswordRequirements;
