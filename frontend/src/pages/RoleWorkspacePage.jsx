import {
  LogOut,
  ShieldCheck,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

import {
  getLoginPathForRole,
} from "../utils/authPortal";


function RoleWorkspacePage() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();


  function handleLogout() {
    logout();

    navigate(
      getLoginPathForRole(
        user?.role
      ),
      {
        replace: true,
      }
    );
  }


  return (
    <main
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-[var(--color-bg)]
        px-5
        py-12
        text-[var(--color-text)]
      "
    >
      <div className="absolute right-6 top-6">
</div>


      <div
        className="
          w-full
          max-w-lg
          rounded-[26px]
          border
          border-[var(--color-border)]
          bg-[var(--color-surface)]
          p-8
          text-center
          shadow-[var(--shadow-md)]
        "
      >
        <div
          className="
            mx-auto
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            bg-[var(--color-primary-soft)]
            text-[var(--color-primary)]
          "
        >
          <ShieldCheck size={25} />
        </div>


        <p
          className="
            mt-5
            text-sm
            font-bold
            text-[var(--color-primary)]
          "
        >
          Authentication successful
        </p>


        <h1
          className="
            mt-2
            text-2xl
            font-bold
            tracking-tight
          "
        >
          {user.role.replaceAll(
            "_",
            " "
          )}
        </h1>


        <p
          className="
            mt-4
            text-sm
            leading-6
            text-[var(--color-text-secondary)]
          "
        >
          Signed in as{" "}
          <strong>
            {user.userId}
          </strong>
          . This role's workspace
          will be connected by its
          development module.
        </p>


        <button
          type="button"
          onClick={
            handleLogout
          }
          className="
            nexora-focus
            mt-7
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
          "
        >
          <LogOut size={17} />

          Sign out
        </button>
      </div>
    </main>
  );
}


export default RoleWorkspacePage;