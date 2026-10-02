import {
  Check,
  ChevronDown,
  Phone,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";


const COUNTRIES = [
  { code: "LK", name: "Sri Lanka", dial: "94", min: 9, max: 9 },
  { code: "IN", name: "India", dial: "91", min: 10, max: 10 },
  { code: "US", name: "United States", dial: "1", min: 10, max: 10 },
  { code: "CA", name: "Canada", dial: "1", min: 10, max: 10 },
  { code: "GB", name: "United Kingdom", dial: "44", min: 10, max: 10 },
  { code: "AU", name: "Australia", dial: "61", min: 9, max: 9 },
  { code: "NZ", name: "New Zealand", dial: "64", min: 8, max: 10 },
  { code: "SG", name: "Singapore", dial: "65", min: 8, max: 8 },
  { code: "MY", name: "Malaysia", dial: "60", min: 9, max: 10 },
  { code: "AE", name: "United Arab Emirates", dial: "971", min: 9, max: 9 },
  { code: "SA", name: "Saudi Arabia", dial: "966", min: 9, max: 9 },
  { code: "QA", name: "Qatar", dial: "974", min: 8, max: 8 },
  { code: "KW", name: "Kuwait", dial: "965", min: 8, max: 8 },
  { code: "OM", name: "Oman", dial: "968", min: 8, max: 8 },
  { code: "BH", name: "Bahrain", dial: "973", min: 8, max: 8 },
  { code: "JP", name: "Japan", dial: "81", min: 10, max: 10 },
  { code: "KR", name: "South Korea", dial: "82", min: 9, max: 10 },
  { code: "CN", name: "China", dial: "86", min: 11, max: 11 },
  { code: "HK", name: "Hong Kong", dial: "852", min: 8, max: 8 },
  { code: "ID", name: "Indonesia", dial: "62", min: 9, max: 12 },
  { code: "TH", name: "Thailand", dial: "66", min: 9, max: 9 },
  { code: "VN", name: "Vietnam", dial: "84", min: 9, max: 10 },
  { code: "PH", name: "Philippines", dial: "63", min: 10, max: 10 },
  { code: "PK", name: "Pakistan", dial: "92", min: 10, max: 10 },
  { code: "BD", name: "Bangladesh", dial: "880", min: 10, max: 10 },
  { code: "NP", name: "Nepal", dial: "977", min: 10, max: 10 },
  { code: "DE", name: "Germany", dial: "49", min: 10, max: 11 },
  { code: "FR", name: "France", dial: "33", min: 9, max: 9 },
  { code: "IT", name: "Italy", dial: "39", min: 9, max: 10 },
  { code: "ES", name: "Spain", dial: "34", min: 9, max: 9 },
  { code: "PT", name: "Portugal", dial: "351", min: 9, max: 9 },
  { code: "NL", name: "Netherlands", dial: "31", min: 9, max: 9 },
  { code: "BE", name: "Belgium", dial: "32", min: 9, max: 9 },
  { code: "CH", name: "Switzerland", dial: "41", min: 9, max: 9 },
  { code: "AT", name: "Austria", dial: "43", min: 10, max: 13 },
  { code: "SE", name: "Sweden", dial: "46", min: 7, max: 10 },
  { code: "NO", name: "Norway", dial: "47", min: 8, max: 8 },
  { code: "DK", name: "Denmark", dial: "45", min: 8, max: 8 },
  { code: "FI", name: "Finland", dial: "358", min: 7, max: 10 },
  { code: "IE", name: "Ireland", dial: "353", min: 9, max: 9 },
  { code: "PL", name: "Poland", dial: "48", min: 9, max: 9 },
  { code: "CZ", name: "Czech Republic", dial: "420", min: 9, max: 9 },
  { code: "RO", name: "Romania", dial: "40", min: 9, max: 9 },
  { code: "GR", name: "Greece", dial: "30", min: 10, max: 10 },
  { code: "TR", name: "Turkey", dial: "90", min: 10, max: 10 },
  { code: "RU", name: "Russia", dial: "7", min: 10, max: 10 },
  { code: "UA", name: "Ukraine", dial: "380", min: 9, max: 9 },
  { code: "ZA", name: "South Africa", dial: "27", min: 9, max: 9 },
  { code: "NG", name: "Nigeria", dial: "234", min: 10, max: 10 },
  { code: "KE", name: "Kenya", dial: "254", min: 9, max: 9 },
  { code: "GH", name: "Ghana", dial: "233", min: 9, max: 9 },
  { code: "EG", name: "Egypt", dial: "20", min: 10, max: 10 },
  { code: "MA", name: "Morocco", dial: "212", min: 9, max: 9 },
  { code: "BR", name: "Brazil", dial: "55", min: 10, max: 11 },
  { code: "MX", name: "Mexico", dial: "52", min: 10, max: 10 },
  { code: "AR", name: "Argentina", dial: "54", min: 10, max: 10 },
  { code: "CL", name: "Chile", dial: "56", min: 9, max: 9 },
  { code: "CO", name: "Colombia", dial: "57", min: 10, max: 10 },
  { code: "PE", name: "Peru", dial: "51", min: 9, max: 9 },
];


function flagFromCode(
  countryCode
) {
  return countryCode
    .toUpperCase()
    .replace(
      /./g,
      (character) =>
        String.fromCodePoint(
          127397 +
          character.charCodeAt()
        )
    );
}


function findCountryForValue(
  value
) {
  if (
    !value ||
    !value.startsWith("+")
  ) {
    return null;
  }


  return [...COUNTRIES]
    .sort(
      (a, b) =>
        b.dial.length -
        a.dial.length
    )
    .find(
      (country) =>
        value.startsWith(
          `+${country.dial}`
        )
    ) || null;
}


function InternationalPhoneField({
  id,
  label = "Phone",
  value = "",
  onChange,
  onValidityChange,
  disabled = false,
  required = false,
}) {
  const containerRef =
    useRef(null);

  const initialCountry =
    findCountryForValue(
      value
    ) ||
    COUNTRIES[0];

  const [
    countryCode,
    setCountryCode,
  ] = useState(
    initialCountry.code
  );

  const [
    nationalNumber,
    setNationalNumber,
  ] = useState(() => {
    if (!value) {
      return "";
    }


    return value
      .replace(
        `+${initialCountry.dial}`,
        ""
      )
      .replace(
        /\D/g,
        ""
      );
  });

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);


  const country =
    useMemo(
      () =>
        COUNTRIES.find(
          (item) =>
            item.code ===
            countryCode
        ) ||
        COUNTRIES[0],
      [
        countryCode,
      ]
    );


  const isValid =
    !nationalNumber ||
    (
      nationalNumber.length >=
        country.min &&
      nationalNumber.length <=
        country.max
    );


  useEffect(() => {
    onValidityChange?.(
      isValid
    );
  }, [
    isValid,
    onValidityChange,
  ]);


  useEffect(() => {
    function handlePointerDown(
      event
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target
        )
      ) {
        setIsOpen(
          false
        );
      }
    }


    function handleKeyDown(
      event
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setIsOpen(
          false
        );
      }
    }


    document.addEventListener(
      "mousedown",
      handlePointerDown
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);


  useEffect(() => {
    if (!value) {
      setNationalNumber(
        ""
      );

      return;
    }


    const matchedCountry =
      findCountryForValue(
        value
      );


    if (!matchedCountry) {
      return;
    }


    const nextDigits =
      value
        .replace(
          `+${matchedCountry.dial}`,
          ""
        )
        .replace(
          /\D/g,
          ""
        )
        .slice(
          0,
          matchedCountry.max
        );


    if (
      matchedCountry.code !==
        countryCode
    ) {
      setCountryCode(
        matchedCountry.code
      );
    }


    if (
      nextDigits !==
        nationalNumber
    ) {
      setNationalNumber(
        nextDigits
      );
    }
  }, [
    value,
    countryCode,
    nationalNumber,
  ]);


  function emitValue(
    nextDigits,
    nextCountry = country
  ) {
    onChange?.(
      nextDigits
        ? `+${nextCountry.dial}${nextDigits}`
        : ""
    );
  }


  function selectCountry(
    nextCountry
  ) {
    const nextDigits =
      nationalNumber.slice(
        0,
        nextCountry.max
      );


    setCountryCode(
      nextCountry.code
    );

    setNationalNumber(
      nextDigits
    );

    setIsOpen(
      false
    );

    emitValue(
      nextDigits,
      nextCountry
    );
  }


  function handleNumberChange(
    event
  ) {
    const nextDigits =
      event.target.value
        .replace(
          /\D/g,
          ""
        )
        .slice(
          0,
          country.max
        );


    setNationalNumber(
      nextDigits
    );

    emitValue(
      nextDigits
    );
  }


  return (
    <div
      ref={
        containerRef
      }
    >
      <label
        htmlFor={
          id
        }
        className="
          mb-2
          block
          text-sm
          font-semibold
        "
      >
        {label}

        {required && (
          <span className="ml-1 text-[var(--color-danger)]">
            *
          </span>
        )}
      </label>

      <div
        className={`
          grid
          grid-cols-[108px_minmax(0,1fr)]
          overflow-visible
          rounded-xl
          border
          bg-[var(--color-input)]
          transition
          ${
            isValid
              ? "border-[var(--color-border)] focus-within:border-[var(--color-primary)]"
              : "border-[var(--color-danger)]"
          }
        `}
      >
        <div
          className="
            relative
            border-r
            border-[var(--color-border)]
          "
        >
          <button
            type="button"
            disabled={
              disabled
            }
            onClick={() =>
              setIsOpen(
                (current) =>
                  !current
              )
            }
            className="
              flex
              h-11
              w-full
              items-center
              justify-between
              gap-1
              rounded-l-xl
              bg-transparent
              px-2.5
              text-xs
              font-bold
              text-[var(--color-text)]
              outline-none
              transition
              hover:bg-[var(--color-surface-soft)]
              focus:ring-2
              focus:ring-inset
              focus:ring-[var(--color-primary)]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
            aria-haspopup="listbox"
            aria-expanded={
              isOpen
            }
          >
            <span
              className="
                flex
                min-w-0
                items-center
                gap-1.5
              "
            >
              <span>
                {flagFromCode(
                  country.code
                )}
              </span>

              <span
                className="
                  truncate
                  whitespace-nowrap
                "
              >
                +{country.dial}
              </span>
            </span>

            <ChevronDown
              size={13}
              className={`
                shrink-0
                text-[var(--color-text-muted)]
                transition-transform
                ${
                  isOpen
                    ? "rotate-180"
                    : ""
                }
              `}
            />
          </button>


          {isOpen && (
            <div
              role="listbox"
              className="
                absolute
                left-0
                top-[calc(100%+6px)]
                z-[300]
                max-h-64
                w-64
                overflow-y-auto
                rounded-xl
                border
                border-[var(--color-border)]
                bg-[var(--color-surface)]
                p-1.5
                text-[var(--color-text)]
                shadow-[var(--shadow-lg)]
              "
            >
              {COUNTRIES.map(
                (item) => {
                  const selected =
                    item.code ===
                    country.code;


                  return (
                    <button
                      key={
                        item.code
                      }
                      type="button"
                      role="option"
                      aria-selected={
                        selected
                      }
                      onClick={() =>
                        selectCountry(
                          item
                        )
                      }
                      className={`
                        flex
                        w-full
                        items-center
                        gap-2
                        rounded-lg
                        px-2.5
                        py-2
                        text-left
                        text-xs
                        transition
                        ${
                          selected
                            ? `
                              bg-[var(--color-primary-soft)]
                              text-[var(--color-primary)]
                            `
                            : `
                              text-[var(--color-text)]
                              hover:bg-[var(--color-surface-soft)]
                            `
                        }
                      `}
                    >
                      <span
                        className="
                          w-5
                          shrink-0
                          text-center
                        "
                      >
                        {flagFromCode(
                          item.code
                        )}
                      </span>

                      <span
                        className="
                          w-12
                          shrink-0
                          font-bold
                        "
                      >
                        +{item.dial}
                      </span>

                      <span
                        className="
                          min-w-0
                          flex-1
                          truncate
                          text-[var(--color-text-secondary)]
                        "
                      >
                        {item.name}
                      </span>

                      {selected && (
                        <Check
                          size={14}
                          className="shrink-0"
                        />
                      )}
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>


        <div className="relative">
          <Phone
            size={16}
            className="
              pointer-events-none
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-[var(--color-text-muted)]
            "
          />

          <input
            id={
              id
            }
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={
              nationalNumber
            }
            onChange={
              handleNumberChange
            }
            disabled={
              disabled
            }
            required={
              required
            }
            maxLength={
              country.max
            }
            placeholder="Phone number"
            className="
              h-11
              w-full
              rounded-r-xl
              bg-transparent
              pl-9
              pr-3
              text-sm
              text-[var(--color-text)]
              outline-none
              placeholder:text-[var(--color-text-muted)]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          />
        </div>
      </div>
    </div>
  );
}


export default InternationalPhoneField;
