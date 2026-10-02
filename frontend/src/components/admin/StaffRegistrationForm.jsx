import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  MapPin,
  UserRound,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import InternationalPhoneField from "../common/InternationalPhoneField";
import PrefixedUserIdField, {
  USER_ID_PREFIXES,
} from "../common/PrefixedUserIdField";
import PasswordRequirements, {
  isPasswordStrong,
} from "../common/PasswordRequirements";
import api from "../../services/api";


const INITIAL_FORM = {
  userId: "",
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  assignmentId: "",
};


function StaffRegistrationForm({
  role,
  roleLabel,
  endpoint,
  assignmentType,
}) {
  const [
    form,
    setForm,
  ] = useState(
    INITIAL_FORM
  );

  const [
    assignments,
    setAssignments,
  ] = useState([]);

  const [
    isLoadingAssignments,
    setIsLoadingAssignments,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  const [
    phoneIsValid,
    setPhoneIsValid,
  ] = useState(true);


  const isOutletAssignment =
    assignmentType ===
    "outlet";

  const assignmentLabel =
    isOutletAssignment
      ? "Outlet"
      : "Depot";

  const assignmentEndpoint =
    isOutletAssignment
      ? "/admin/outlets"
      : "/admin/depots";


  const userIdPrefix =
    USER_ID_PREFIXES[
      role
    ];


  useEffect(() => {
    let isMounted =
      true;


    async function loadAssignments() {
      try {
        setIsLoadingAssignments(
          true
        );

        setErrorMessage("");


        const response =
          await api.get(
            assignmentEndpoint
          );


        if (!isMounted) {
          return;
        }


        setAssignments(
          isOutletAssignment
            ? response.data.outlets || []
            : response.data.depots || []
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }


        setErrorMessage(
          error.response?.data
            ?.message ||
          `Unable to load available ${assignmentLabel.toLowerCase()}s.`
        );
      } finally {
        if (isMounted) {
          setIsLoadingAssignments(
            false
          );
        }
      }
    }


    loadAssignments();


    return () => {
      isMounted =
        false;
    };
  }, [
    assignmentEndpoint,
    assignmentLabel,
    isOutletAssignment,
  ]);


  const assignmentOptions =
    useMemo(
      () =>
        assignments.map(
          (item) => ({
            value:
              String(item.id),

            label:
              isOutletAssignment
                ? `${item.outletCode} · ${item.brand} · ${item.district}`
                : `${item.code} · ${item.name}${item.district ? ` · ${item.district}` : ""}`,
          })
        ),
      [
        assignments,
        isOutletAssignment,
      ]
    );


  function updateField(
    event
  ) {
    const {
      name,
      value,
    } = event.target;


    setForm(
      (current) => ({
        ...current,
        [name]:
          value,
      })
    );

    setErrorMessage("");
    setSuccessMessage("");
  }


  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    if (
      !form.userId.trim() ||
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirmPassword ||
      !form.assignmentId
    ) {
      setErrorMessage(
        "Complete all required fields before registering the account."
      );

      return;
    }


    if (
      !/^\d+$/.test(
        form.userId
      )
    ) {
      setErrorMessage(
        "Enter only the numeric part of the User ID."
      );

      return;
    }


    if (
      form.phone &&
      !phoneIsValid
    ) {
      setErrorMessage(
        "Enter a valid phone number for the selected country."
      );

      return;
    }


    if (
      !isPasswordStrong(
        form.password
      )
    ) {
      setErrorMessage(
        "Temporary password does not meet all security requirements."
      );

      return;
    }


    if (
      form.password !==
      form.confirmPassword
    ) {
      setErrorMessage(
        "Password and confirmation do not match."
      );

      return;
    }


    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");


      const payload = {
        userId:
          `${userIdPrefix}${form.userId.trim()}`,

        fullName:
          form.fullName.trim(),

        email:
          form.email.trim(),

        phone:
          form.phone.trim(),

        password:
          form.password,

        confirmPassword:
          form.confirmPassword,

        [
          isOutletAssignment
            ? "outletId"
            : "depotId"
        ]:
          Number(
            form.assignmentId
          ),
      };


      const response =
        await api.post(
          endpoint,
          payload
        );


      setSuccessMessage(
        response.data.message ||
        `${roleLabel} account registered successfully.`
      );

      setForm(
        INITIAL_FORM
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data
          ?.message ||
        `Unable to register the ${roleLabel.toLowerCase()} account.`
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <div
      className="
        mx-auto
        grid
        w-full
        max-w-5xl
        gap-5
        lg:grid-cols-[minmax(0,1fr)_280px]
      "
    >
      <section
        className="
          rounded-[24px]
          border
          border-[var(--color-border)]
          bg-[var(--color-surface)]
          p-5
          shadow-[var(--shadow-sm)]
          sm:p-7
        "
      >
        <div
          className="
            flex
            flex-col
            gap-3
            border-b
            border-[var(--color-border)]
            pb-5
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <p
              className="
                text-xs
                font-bold
                uppercase
                tracking-[0.14em]
                text-[var(--color-primary)]
              "
            >
              {role.replaceAll(
                "_",
                " "
              )}
            </p>

            <h2
              className="
                mt-1
                text-xl
                font-bold
                tracking-[-0.025em]
              "
            >
              Account information
            </h2>
          </div>

          <div
            className="
              inline-flex
              w-fit
              items-center
              gap-2
              rounded-xl
              bg-[var(--color-primary-soft)]
              px-3
              py-2
              text-xs
              font-bold
              text-[var(--color-primary)]
            "
          >
            <UserRound size={15} />
            {roleLabel}
          </div>
        </div>


        <form
          className="mt-6"
          onSubmit={handleSubmit}
        >
          <div
            className="
              grid
              gap-5
              md:grid-cols-2
            "
          >
            <PrefixedUserIdField
              id={`${role.toLowerCase()}UserId`}
              label="User ID"
              prefix={
                userIdPrefix
              }
              value={
                form.userId
              }
              onChange={(value) => {
                setForm(
                  (current) => ({
                    ...current,

                    userId:
                      value,
                  })
                );

                setErrorMessage("");
                setSuccessMessage("");
              }}
              placeholder="001"
              disabled={
                isSubmitting
              }
              required
            />


            <FormField
              label="Full name"
              required
            >
              <InputWithIcon
                icon={UserRound}
                name="fullName"
                value={form.fullName}
                onChange={updateField}
                placeholder="Enter full name"
                autoComplete="name"
                disabled={isSubmitting}
              />
            </FormField>


            <FormField
              label="Email"
              required
            >
              <InputWithIcon
                icon={Mail}
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                placeholder="name@example.com"
                autoComplete="email"
                disabled={isSubmitting}
              />
            </FormField>


            <InternationalPhoneField
              id={`${role.toLowerCase()}Phone`}
              label="Phone"
              value={form.phone}
              onChange={(value) => {
                setForm(
                  (current) => ({
                    ...current,

                    phone:
                      value,
                  })
                );

                setErrorMessage("");
                setSuccessMessage("");
              }}
              onValidityChange={
                setPhoneIsValid
              }
              disabled={
                isSubmitting
              }
            />


            <FormField
              label={assignmentLabel}
              required
              fullWidth
            >
              <div className="relative">
                {isOutletAssignment ? (
                  <MapPin
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                  />
                ) : (
                  <Building2
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                  />
                )}

                <select
                  name="assignmentId"
                  value={form.assignmentId}
                  onChange={updateField}
                  disabled={
                    isSubmitting ||
                    isLoadingAssignments
                  }
                  className="
                    nexora-focus
                    h-12
                    w-full
                    appearance-none
                    rounded-xl
                    border
                    border-[var(--color-border)]
                    bg-[var(--color-input)]
                    pl-11
                    pr-4
                    text-sm
                    text-[var(--color-text)]
                    outline-none
                    transition
                    hover:border-[var(--color-border-strong)]
                    focus:border-[var(--color-primary)]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  <option value="">
                    {isLoadingAssignments
                      ? `Loading ${assignmentLabel.toLowerCase()}s...`
                      : `Select ${assignmentLabel.toLowerCase()}`}
                  </option>

                  {assignmentOptions.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </select>
              </div>
            </FormField>


            <FormField
              label="Temporary password"
              required
            >
              <PasswordInput
                name="password"
                value={form.password}
                onChange={updateField}
                showPassword={showPassword}
                onToggle={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }
                placeholder="Create temporary password"
                disabled={isSubmitting}
              />
            </FormField>


            <div className="md:col-span-2">
              <PasswordRequirements
                password={
                  form.password
                }
              />
            </div>


            <FormField
              label="Confirm password"
              required
            >
              <PasswordInput
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={updateField}
                showPassword={showPassword}
                onToggle={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }
                placeholder="Re-enter temporary password"
                disabled={isSubmitting}
              />
            </FormField>
          </div>


          {errorMessage && (
            <div
              role="alert"
              className="
                mt-5
                flex
                items-start
                gap-3
                rounded-xl
                border
                border-[var(--color-danger)]
                bg-[var(--color-danger-soft)]
                px-4
                py-3
                text-sm
                text-[var(--color-danger)]
              "
            >
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>
                {errorMessage}
              </span>
            </div>
          )}


          {successMessage && (
            <div
              role="status"
              className="
                mt-5
                flex
                items-start
                gap-3
                rounded-xl
                border
                border-[var(--color-primary)]
                bg-[var(--color-primary-soft)]
                px-4
                py-3
                text-sm
                font-medium
                text-[var(--color-primary)]
              "
            >
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>
                {successMessage}
              </span>
            </div>
          )}


          <button
            type="submit"
            disabled={
              isSubmitting ||
              isLoadingAssignments
            }
            className="
              nexora-focus
              mt-6
              inline-flex
              h-12
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-[var(--color-primary)]
              px-5
              text-sm
              font-bold
              text-white
              transition
              hover:bg-[var(--color-primary-hover)]
              disabled:cursor-not-allowed
              disabled:opacity-65
              sm:w-auto
              sm:min-w-52
            "
          >
            {isSubmitting
              ? "Registering..."
              : `Register ${roleLabel}`}

            {!isSubmitting && (
              <ArrowRight size={17} />
            )}
          </button>
        </form>
      </section>


      <aside
        className="
          h-fit
          rounded-[22px]
          border
          border-[var(--color-border)]
          bg-[var(--color-surface-soft)]
          p-5
        "
      >
        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            bg-[var(--color-primary)]
            text-white
          "
        >
          <KeyRound size={20} />
        </div>

        <h3 className="mt-4 font-bold">
          Temporary access
        </h3>

        <p
          className="
            mt-2
            text-sm
            leading-6
            text-[var(--color-text-secondary)]
          "
        >
          The staff member signs in with the temporary password and must create a new password before using protected operational features.
        </p>

      </aside>
    </div>
  );
}


function FormField({
  label,
  required = false,
  fullWidth = false,
  children,
}) {
  return (
    <label
      className={
        fullWidth
          ? "md:col-span-2"
          : ""
      }
    >
      <span
        className="
          mb-2
          block
          text-sm
          font-semibold
        "
      >
        {label}
        {required && (
          <span className="ml-1 text-[var(--color-primary)]">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}


function InputWithIcon({
  icon: Icon,
  ...props
}) {
  return (
    <div className="relative">
      <Icon
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
      />

      <input
        {...props}
        className="
          nexora-focus
          h-12
          w-full
          rounded-xl
          border
          border-[var(--color-border)]
          bg-[var(--color-input)]
          pl-11
          pr-4
          text-sm
          text-[var(--color-text)]
          outline-none
          transition
          placeholder:text-[var(--color-text-muted)]
          hover:border-[var(--color-border-strong)]
          focus:border-[var(--color-primary)]
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      />
    </div>
  );
}


function PasswordInput({
  showPassword,
  onToggle,
  ...props
}) {
  return (
    <div className="relative">
      <KeyRound
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
      />

      <input
        {...props}
        type={
          showPassword
            ? "text"
            : "password"
        }
        autoComplete="new-password"
        className="
          nexora-focus
          h-12
          w-full
          rounded-xl
          border
          border-[var(--color-border)]
          bg-[var(--color-input)]
          pl-11
          pr-12
          text-sm
          text-[var(--color-text)]
          outline-none
          transition
          placeholder:text-[var(--color-text-muted)]
          hover:border-[var(--color-border-strong)]
          focus:border-[var(--color-primary)]
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      />

      <button
        type="button"
        onClick={onToggle}
        disabled={props.disabled}
        className="
          nexora-focus
          absolute
          right-2
          top-1/2
          flex
          h-9
          w-9
          -translate-y-1/2
          items-center
          justify-center
          rounded-lg
          text-[var(--color-text-muted)]
          transition
          hover:bg-[var(--color-surface-soft)]
          hover:text-[var(--color-text)]
        "
        aria-label={
          showPassword
            ? "Hide password"
            : "Show password"
        }
      >
        {showPassword ? (
          <EyeOff size={18} />
        ) : (
          <Eye size={18} />
        )}
      </button>
    </div>
  );
}


export default StaffRegistrationForm;
