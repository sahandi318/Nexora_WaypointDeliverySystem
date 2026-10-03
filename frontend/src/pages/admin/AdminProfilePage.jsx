import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  IdCard,
  ImagePlus,
  KeyRound,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import AdminShell from "../../components/admin/AdminShell";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

import {
  prepareProfilePhoto,
} from "../../utils/profilePhoto";


function AdminProfilePage() {
  const navigate =
    useNavigate();

  const {
    refreshUser,
  } = useAuth();

  const fileInputRef =
    useRef(null);

  const [
    profile,
    setProfile,
  ] = useState(null);

  const [
    fullName,
    setFullName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    isPhotoEditorOpen,
    setIsPhotoEditorOpen,
  ] = useState(false);

  const [
    photoPreview,
    setPhotoPreview,
  ] = useState(null);

  const [
    isPhotoSaving,
    setIsPhotoSaving,
  ] = useState(false);

  const [
    isDraggingPhoto,
    setIsDraggingPhoto,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  useEffect(() => {
    let mounted =
      true;


    async function loadProfile() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response =
          await api.get(
            "/admin/profile"
          );


        if (!mounted) {
          return;
        }


        const loadedProfile =
          response.data.profile;


        setProfile(
          loadedProfile
        );

        setFullName(
          loadedProfile?.fullName ||
          ""
        );

        setEmail(
          loadedProfile?.email ||
          ""
        );

        setPhone(
          loadedProfile?.phone ||
          ""
        );

        setPhotoPreview(
          loadedProfile
            ?.profilePhotoData ||
          null
        );
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            error.response?.data
              ?.message ||
            "Unable to load the administrator profile."
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }


    loadProfile();


    return () => {
      mounted = false;
    };
  }, []);


  async function handleSave(
    event
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");


    if (
      fullName.trim().length < 2
    ) {
      setErrorMessage(
        "Enter your full name."
      );

      return;
    }


    if (!email.trim()) {
      setErrorMessage(
        "Enter your email address."
      );

      return;
    }


    try {
      setIsSaving(true);

      const response =
        await api.patch(
          "/admin/profile",
          {
            fullName:
              fullName.trim(),

            email:
              email.trim(),

            phone:
              phone.trim(),
          }
        );


      const updatedProfile =
        response.data.profile;


      setProfile(
        updatedProfile
      );

      setFullName(
        updatedProfile.fullName ||
        ""
      );

      setEmail(
        updatedProfile.email ||
        ""
      );

      setPhone(
        updatedProfile.phone ||
        ""
      );


      await refreshUser();


      setSuccessMessage(
        "Your profile details were saved successfully."
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data
          ?.message ||
        error.message ||
        "Unable to save your profile details."
      );
    } finally {
      setIsSaving(false);
    }
  }


  function openPhotoEditor() {
    setPhotoPreview(
      profile?.profilePhotoData ||
      null
    );

    setErrorMessage("");
    setSuccessMessage("");
    setIsPhotoEditorOpen(true);
  }


  function closePhotoEditor() {
    setPhotoPreview(
      profile?.profilePhotoData ||
      null
    );

    setIsDraggingPhoto(false);
    setIsPhotoEditorOpen(false);
  }


  async function handlePhotoFile(
    file
  ) {
    if (!file) {
      return;
    }


    setErrorMessage("");
    setSuccessMessage("");


    try {
      const preparedPhoto =
        await prepareProfilePhoto(
          file
        );


      setPhotoPreview(
        preparedPhoto
      );
    } catch (error) {
      setErrorMessage(
        error.message ||
        "Unable to prepare that profile photo."
      );
    }
  }


  async function handleSavePhoto() {
    setErrorMessage("");
    setSuccessMessage("");


    try {
      setIsPhotoSaving(true);

      const response =
        await api.patch(
          "/admin/profile/photo",
          {
            profilePhotoData:
              photoPreview,
          }
        );


      const updatedProfile =
        response.data.profile;


      setProfile(
        updatedProfile
      );

      setPhotoPreview(
        updatedProfile
          ?.profilePhotoData ||
        null
      );


      await refreshUser();


      setIsPhotoEditorOpen(
        false
      );

      setSuccessMessage(
        "Profile photo updated successfully."
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data
          ?.message ||
        error.message ||
        "Unable to update the profile photo."
      );
    } finally {
      setIsPhotoSaving(false);
    }
  }


  function handleDrop(
    event
  ) {
    event.preventDefault();

    setIsDraggingPhoto(
      false
    );


    const file =
      event.dataTransfer
        ?.files?.[0];


    handlePhotoFile(
      file
    );
  }


  const activePhoto =
    isPhotoEditorOpen
      ? photoPreview
      : (
        profile
          ?.profilePhotoData ||
        null
      );


  return (
    <AdminShell
      title="Administrator profile"
      description="Review and update the personal details linked to your administrator account."
    >
      <div className="mx-auto max-w-5xl">
        <section
          className="
            overflow-hidden
            rounded-2xl
            border
            border-[var(--color-border)]
            bg-[var(--color-surface)]
            shadow-[var(--shadow-sm)]
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5
              border-b
              border-[var(--color-border)]
              p-5
              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:p-7
            "
          >
            <div
              className="
                flex
                min-w-0
                items-center
                gap-4
                sm:gap-5
              "
            >
              <ProfileAvatar
                photo={
                  activePhoto
                }
                fullName={
                  profile?.fullName ||
                  fullName
                }
                size="large"
              />

              <div className="min-w-0">
                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    bg-[var(--color-primary-soft)]
                    px-3
                    py-1
                    text-xs
                    font-bold
                    text-[var(--color-primary)]
                  "
                >
                  <ShieldCheck size={13} />
                  Administrator
                </div>

                <h2
                  className="
                    mt-2
                    truncate
                    text-xl
                    font-bold
                  "
                >
                  {profile?.fullName ||
                    "Administrator"}
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-[var(--color-text-muted)]
                  "
                >
                  Personal account information
                </p>
              </div>
            </div>


            <button
              type="button"
              onClick={
                isPhotoEditorOpen
                  ? closePhotoEditor
                  : openPhotoEditor
              }
              disabled={
                isLoading
              }
              className="
                nexora-focus
                inline-flex
                h-10
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-[var(--color-border-strong)]
                bg-[var(--color-surface-soft)]
                px-4
                text-sm
                font-bold
                text-[var(--color-text)]
                transition
                hover:border-[var(--color-primary)]
                hover:text-[var(--color-primary)]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {isPhotoEditorOpen ? (
                <X size={16} />
              ) : (
                <Camera size={16} />
              )}

              {isPhotoEditorOpen
                ? "Close editor"
                : "Edit photo"}
            </button>
          </div>


          {isPhotoEditorOpen && (
            <div
              className="
                border-b
                border-[var(--color-border)]
                bg-[var(--color-surface-soft)]
                p-5
                sm:p-7
              "
            >
              <div
                className="
                  grid
                  items-center
                  gap-5
                  lg:grid-cols-[minmax(0,1fr)_auto]
                "
              >
                <div>
                  <div
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsDraggingPhoto(
                        true
                      );
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDraggingPhoto(
                        true
                      );
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();

                      if (
                        event.currentTarget ===
                        event.target
                      ) {
                        setIsDraggingPhoto(
                          false
                        );
                      }
                    }}
                    onDrop={
                      handleDrop
                    }
                    className={`
                      rounded-2xl
                      border-2
                      border-dashed
                      p-5
                      transition
                      ${
                        isDraggingPhoto
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                          : "border-[var(--color-border-strong)] bg-[var(--color-surface)]"
                      }
                    `}
                  >
                    <div
                      className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        gap-3
                        text-center
                        sm:flex-row
                        sm:justify-start
                        sm:text-left
                      "
                    >
                      <div
                        className="
                          flex
                          h-12
                          w-12
                          shrink-0
                          items-center
                          justify-center
                          rounded-2xl
                          bg-[var(--color-primary-soft)]
                          text-[var(--color-primary)]
                        "
                      >
                        <UploadCloud size={22} />
                      </div>

                      <div className="min-w-0">
                        <p
                          className="
                            text-sm
                            font-extrabold
                            text-[var(--color-text)]
                          "
                        >
                          Drag and drop your photo here
                        </p>

                        <p
                          className="
                            mt-1
                            text-xs
                            leading-5
                            text-[var(--color-text-muted)]
                          "
                        >
                          JPG, PNG or WebP. The image is automatically cropped
                          into a clean square profile photo.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          fileInputRef
                            .current
                            ?.click()
                        }
                        className="
                          nexora-focus
                          mt-1
                          inline-flex
                          h-10
                          shrink-0
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          border
                          border-[var(--color-border-strong)]
                          bg-[var(--color-surface)]
                          px-4
                          text-sm
                          font-bold
                          text-[var(--color-primary)]
                          transition
                          hover:border-[var(--color-primary)]
                          sm:ml-auto
                          sm:mt-0
                        "
                      >
                        <ImagePlus size={16} />
                        Select file
                      </button>
                    </div>

                    <input
                      ref={
                        fileInputRef
                      }
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) =>
                        handlePhotoFile(
                          event.target
                            .files?.[0]
                        )
                      }
                    />
                  </div>
                </div>


                <div
                  className="
                    flex
                    flex-wrap
                    items-center
                    justify-center
                    gap-3
                    lg:justify-end
                  "
                >
                  <ProfileAvatar
                    photo={
                      photoPreview
                    }
                    fullName={
                      profile?.fullName ||
                      fullName
                    }
                    size="medium"
                  />

                  <div className="flex flex-col gap-2">
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={() =>
                          setPhotoPreview(
                            null
                          )
                        }
                        disabled={
                          isPhotoSaving
                        }
                        className="
                          nexora-focus
                          inline-flex
                          h-9
                          items-center
                          justify-center
                          gap-2
                          rounded-lg
                          border
                          border-[var(--color-border)]
                          px-3
                          text-xs
                          font-bold
                          text-[var(--color-danger)]
                          transition
                          hover:bg-[var(--color-danger-soft)]
                        "
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={
                        handleSavePhoto
                      }
                      disabled={
                        isPhotoSaving
                      }
                      className="
                        nexora-focus
                        inline-flex
                        h-9
                        items-center
                        justify-center
                        gap-2
                        rounded-lg
                        bg-[var(--color-primary)]
                        px-3
                        text-xs
                        font-bold
                        text-white
                        transition
                        hover:bg-[var(--color-primary-hover)]
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                      "
                    >
                      <Save size={14} />

                      {isPhotoSaving
                        ? "Saving..."
                        : "Save photo"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}


          {isLoading ? (
            <div className="flex min-h-80 items-center justify-center">
              <div
                className="
                  h-10
                  w-10
                  animate-spin
                  rounded-full
                  border-4
                  border-[var(--color-primary-soft)]
                  border-t-[var(--color-primary)]
                "
              />
            </div>
          ) : (
            <form
              className="p-5 sm:p-7"
              onSubmit={
                handleSave
              }
            >
              <div
                className="
                  grid
                  gap-5
                  md:grid-cols-2
                "
              >
                <ReadOnlyField
                  icon={IdCard}
                  label="User ID"
                  value={
                    profile?.userId ||
                    "-"
                  }
                  hint="The account User ID cannot be changed here."
                />

                <EditableField
                  icon={UserRound}
                  id="adminFullName"
                  label="Full name"
                  value={fullName}
                  onChange={
                    setFullName
                  }
                  autoComplete="name"
                  placeholder="Enter full name"
                  required
                />

                <EditableField
                  icon={Mail}
                  id="adminEmail"
                  label="Email"
                  value={email}
                  onChange={
                    setEmail
                  }
                  type="email"
                  autoComplete="email"
                  placeholder="Enter email address"
                  required
                />

                <EditableField
                  icon={Phone}
                  id="adminPhone"
                  label="Phone"
                  value={phone}
                  onChange={
                    setPhone
                  }
                  type="tel"
                  autoComplete="tel"
                  placeholder="Enter phone number"
                />
              </div>


              <div
                className="
                  mt-6
                  grid
                  gap-4
                  sm:grid-cols-3
                "
              >
                <MetaField
                  icon={ShieldCheck}
                  label="Account status"
                  value={
                    profile?.isActive
                      ? "Active"
                      : "Inactive"
                  }
                />

                <MetaField
                  icon={CalendarDays}
                  label="Registered"
                  value={
                    formatDate(
                      profile?.createdAt
                    )
                  }
                />

                <MetaField
                  icon={CalendarDays}
                  label="Last login"
                  value={
                    formatDate(
                      profile?.lastLoginAt
                    )
                  }
                />
              </div>


              {errorMessage && (
                <MessageBox
                  type="error"
                  message={
                    errorMessage
                  }
                />
              )}

              {successMessage && (
                <MessageBox
                  type="success"
                  message={
                    successMessage
                  }
                />
              )}


              <div
                className="
                  mt-6
                  flex
                  justify-end
                "
              >
                <button
                  type="submit"
                  disabled={
                    isSaving
                  }
                  className="
                    nexora-focus
                    inline-flex
                    h-11
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
                    disabled:opacity-60
                  "
                >
                  <Save size={17} />

                  {isSaving
                    ? "Saving..."
                    : "Save changes"}
                </button>
              </div>
            </form>
          )}
        </section>


        <section
          className="
            mt-6
            flex
            flex-col
            gap-4
            rounded-2xl
            border
            border-[var(--color-border)]
            bg-[var(--color-surface)]
            p-5
            shadow-[var(--shadow-sm)]
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:p-6
          "
        >
          <div className="flex items-start gap-3">
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-[var(--color-primary-soft)]
                text-[var(--color-primary)]
              "
            >
              <KeyRound size={20} />
            </div>

            <div>
              <h3 className="font-bold">
                Password & security
              </h3>

              <p
                className="
                  mt-1
                  text-sm
                  leading-6
                  text-[var(--color-text-secondary)]
                "
              >
                Change your password using your current password, or verify
                your email if you cannot remember it.
              </p>
            </div>
          </div>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/admin/change-password"
              )
            }
            className="
              nexora-focus
              inline-flex
              h-11
              shrink-0
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-[var(--color-border-strong)]
              bg-[var(--color-surface-soft)]
              px-4
              text-sm
              font-bold
              text-[var(--color-primary)]
              transition
              hover:border-[var(--color-primary)]
            "
          >
            Change password
            <ArrowRight size={17} />
          </button>
        </section>
      </div>
    </AdminShell>
  );
}


function ProfileAvatar({
  photo,
  fullName,
  size,
}) {
  const large =
    size === "large";

  const dimensionClasses =
    large
      ? "h-20 w-20 sm:h-24 sm:w-24"
      : "h-16 w-16";


  return (
    <div
      className={`
        relative
        shrink-0
        overflow-hidden
        rounded-full
        border-2
        border-[var(--color-surface)]
        bg-[var(--color-primary)]
        shadow-[var(--shadow-md)]
        ring-1
        ring-[var(--color-border-strong)]
        ${dimensionClasses}
      `}
    >
      {photo ? (
        <img
          src={
            photo
          }
          alt={`${fullName || "Administrator"} profile`}
          className="
            h-full
            w-full
            object-cover
          "
        />
      ) : (
        <div
          className="
            flex
            h-full
            w-full
            items-center
            justify-center
            text-lg
            font-extrabold
            text-white
          "
        >
          {getInitials(
            fullName
          )}
        </div>
      )}
    </div>
  );
}


function EditableField({
  icon: Icon,
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold"
      >
        {label}
      </label>

      <div className="relative">
        <Icon
          size={17}
          className="
            pointer-events-none
            absolute
            left-4
            top-1/2
            -translate-y-1/2
            text-[var(--color-text-muted)]
          "
        />

        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          autoComplete={
            autoComplete
          }
          placeholder={
            placeholder
          }
          required={
            required
          }
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
          "
        />
      </div>
    </div>
  );
}


function ReadOnlyField({
  icon: Icon,
  label,
  value,
  hint,
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">
        {label}
      </p>

      <div
        className="
          flex
          min-h-12
          items-center
          gap-3
          rounded-xl
          border
          border-[var(--color-border)]
          bg-[var(--color-surface-soft)]
          px-4
        "
      >
        <Icon
          size={17}
          className="shrink-0 text-[var(--color-text-muted)]"
        />

        <span className="text-sm font-semibold">
          {value}
        </span>
      </div>

      {hint && (
        <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}


function MetaField({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div
      className="
        rounded-xl
        border
        border-[var(--color-border)]
        bg-[var(--color-surface-soft)]
        p-4
      "
    >
      <div
        className="
          flex
          items-center
          gap-2
          text-xs
          font-bold
          text-[var(--color-text-muted)]
        "
      >
        <Icon size={14} />
        {label}
      </div>

      <p className="mt-2 text-sm font-bold">
        {value}
      </p>
    </div>
  );
}


function MessageBox({
  type,
  message,
}) {
  const success =
    type === "success";


  return (
    <div
      className={`
        mt-6
        flex
        items-start
        gap-3
        rounded-xl
        border
        px-4
        py-3
        text-sm
        ${
          success
            ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
            : "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
        }
      `}
      role={
        success
          ? "status"
          : "alert"
      }
    >
      {success ? (
        <CheckCircle2
          size={18}
          className="mt-0.5 shrink-0"
        />
      ) : (
        <AlertCircle
          size={18}
          className="mt-0.5 shrink-0"
        />
      )}

      <span>
        {message}
      </span>
    </div>
  );
}


function getInitials(
  fullName
) {
  if (!fullName) {
    return "AD";
  }


  const parts =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);


  return parts
    .slice(0, 2)
    .map((part) =>
      part.charAt(0)
    )
    .join("")
    .toUpperCase() ||
    "AD";
}


function formatDate(
  value
) {
  if (!value) {
    return "Not available";
  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not available";
  }


  return date.toLocaleString();
}


export default AdminProfilePage;
