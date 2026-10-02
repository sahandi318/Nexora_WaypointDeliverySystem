import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import useAuth from "./useAuth";

import {
  getStoreManagerContext,
} from "../services/storeManagerService";


// ============================================================
// STORE MANAGER TRUSTED CONTEXT HOOK
// ============================================================

function useStoreManagerContext() {
  const navigate =
    useNavigate();


  const {
    logout,
    refreshUser,
  } = useAuth();


  const [
    context,
    setContext,
  ] = useState(null);


  const [
    isLoading,
    setIsLoading,
  ] = useState(true);


  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);


  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  // ==========================================================
  // HANDLE REQUEST FAILURE
  // ==========================================================

  const handleRequestFailure =
    useCallback(
      async (
        error
      ) => {
        // ------------------------------------------------------
        // REQUEST CANCELLED
        // ------------------------------------------------------

        if (
          error?.code ===
            "ERR_CANCELED" ||
          error?.name ===
            "CanceledError"
        ) {
          return null;
        }


        const status =
          error.response?.status;


        const code =
          error.response?.data
            ?.code;


        const serverMessage =
          error.response?.data
            ?.message;


        // ------------------------------------------------------
        // INVALID / EXPIRED SESSION
        // ------------------------------------------------------

        if (status === 401) {
          logout();


          navigate(
            "/login",
            {
              replace: true,
            }
          );


          return null;
        }


        // ------------------------------------------------------
        // PASSWORD CHANGE REQUIRED
        // ------------------------------------------------------

        if (
          status === 403 &&
          code ===
            "PASSWORD_CHANGE_REQUIRED"
        ) {
          try {
            await refreshUser();
          } catch {
            /*
             * ProtectedRoute will handle the session if the
             * authenticated-user refresh also fails.
             */
          }


          navigate(
            "/change-password",
            {
              replace: true,
            }
          );


          return null;
        }


        // ------------------------------------------------------
        // OTHER AUTHORIZATION / NETWORK ERROR
        // ------------------------------------------------------

        setContext(null);


        setErrorMessage(
          serverMessage ||
          error.message ||
          "Unable to load your Store Manager workspace."
        );


        return null;
      },
      [
        logout,
        navigate,
        refreshUser,
      ]
    );


  // ==========================================================
  // INITIAL TRUSTED CONTEXT LOAD
  // ==========================================================

  useEffect(() => {
    const controller =
      new AbortController();


    async function loadInitialContext() {
      try {
        const trustedContext =
          await getStoreManagerContext({
            signal:
              controller.signal,
          });


        if (
          controller.signal
            .aborted
        ) {
          return;
        }


        setContext(
          trustedContext
        );


        setErrorMessage("");
      } catch (error) {
        if (
          controller.signal
            .aborted
        ) {
          return;
        }


        await handleRequestFailure(
          error
        );
      } finally {
        if (
          !controller.signal
            .aborted
        ) {
          setIsLoading(false);
        }
      }
    }


    loadInitialContext();


    return () => {
      controller.abort();
    };
  }, [
    handleRequestFailure,
  ]);


  // ==========================================================
  // MANUAL CONTEXT REFRESH
  // ==========================================================

  const refreshContext =
    useCallback(
      async () => {
        try {
          setIsRefreshing(
            true
          );


          setErrorMessage("");


          const trustedContext =
            await getStoreManagerContext();


          setContext(
            trustedContext
          );


          return trustedContext;
        } catch (error) {
          return handleRequestFailure(
            error
          );
        } finally {
          setIsRefreshing(
            false
          );
        }
      },
      [
        handleRequestFailure,
      ]
    );


  return {
    context,

    user:
      context?.user ||
      null,

    outlet:
      context?.outlet ||
      null,

    depot:
      context?.depot ||
      null,

    isLoading,

    isRefreshing,

    errorMessage,

    refreshContext,
  };
}


export default useStoreManagerContext;