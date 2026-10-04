import {
  useEffect,
  useState,
} from "react";

import api, {
  ACCESS_TOKEN_KEY,
} from "../services/api";

import {
  clearPasswordResetSession,
  savePasswordResetIdentifier,
  savePasswordResetToken,
} from "../services/passwordResetSession";

import AuthContext from "./AuthContextCore";


export function AuthProvider({
  children,
}) {
  const [
    user,
    setUser,
  ] = useState(null);

  const [
    isInitializing,
    setIsInitializing,
  ] = useState(true);


  // ==========================================================
  // RESTORE SESSION
  // ==========================================================

  useEffect(() => {
    let isMounted =
      true;


    async function restoreSession() {
      const token =
        sessionStorage.getItem(
          ACCESS_TOKEN_KEY
        );


      if (!token) {
        if (isMounted) {
          setIsInitializing(
            false
          );
        }

        return;
      }


      try {
        const response =
          await api.get(
            "/auth/me"
          );


        if (isMounted) {
          setUser(
            response.data.user
          );
        }
      } catch {
        sessionStorage.removeItem(
          ACCESS_TOKEN_KEY
        );


        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(
            false
          );
        }
      }
    }


    restoreSession();


    return () => {
      isMounted = false;
    };
  }, []);


  // ==========================================================
  // LOGIN
  // ==========================================================

  async function login({
    identifier,
    password,
  }) {
    const response =
      await api.post(
        "/auth/login",
        {
          identifier,
          password,
        }
      );


    const {
      token,
      user:
        authenticatedUser,
    } = response.data;


    if (
      !token ||
      !authenticatedUser
    ) {
      throw new Error(
        "The server returned an invalid authentication response."
      );
    }


    clearPasswordResetSession();


    sessionStorage.setItem(
      ACCESS_TOKEN_KEY,
      token
    );


    setUser(
      authenticatedUser
    );


    return authenticatedUser;
  }


  // ==========================================================
  // FIRST LOGIN PASSWORD CHANGE
  // ==========================================================

  async function changePassword({
    currentPassword,
    newPassword,
    confirmPassword,
  }) {
    const response =
      await api.post(
        "/auth/change-password",
        {
          currentPassword,
          newPassword,
          confirmPassword,
        }
      );


    const updatedUser =
      response.data.user;


    if (!updatedUser) {
      throw new Error(
        "The server returned an invalid password-change response."
      );
    }


    setUser(
      updatedUser
    );


    return updatedUser;
  }


  // ==========================================================
  // REQUEST PASSWORD RESET
  // ==========================================================

  async function requestPasswordReset({
    identifier,
  }) {
    const cleanedIdentifier =
      identifier.trim();


    const response =
      await api.post(
        "/auth/forgot-password",
        {
          identifier:
            cleanedIdentifier,
        },
        // SMTP may take longer than the shared API's 10-second timeout.
        { timeout: 60000 }
      );


    savePasswordResetIdentifier(
      cleanedIdentifier
    );


    /*
     * A new OTP request invalidates the browser's
     * previously stored reset authorization.
     */
    savePasswordResetToken(
      null
    );


    return response.data;
  }


  // ==========================================================
  // VERIFY RESET OTP
  // ==========================================================

  async function verifyPasswordResetOtp({
    identifier,
    otp,
  }) {
    const response =
      await api.post(
        "/auth/verify-reset-otp",
        {
          identifier:
            identifier.trim(),

          otp,
        }
      );


    const resetToken =
      response.data.resetToken;


    if (!resetToken) {
      throw new Error(
        "The server returned an invalid reset authorization."
      );
    }


    savePasswordResetToken(
      resetToken
    );


    return response.data;
  }


  // ==========================================================
  // RESET FORGOTTEN PASSWORD
  // ==========================================================

  async function resetForgottenPassword({
    resetToken,
    newPassword,
    confirmPassword,
  }) {
    const response =
      await api.post(
        "/auth/reset-password",
        {
          resetToken,
          newPassword,
          confirmPassword,
        }
      );


    clearPasswordResetSession();


    return response.data;
  }


  // ==========================================================
  // LOGOUT
  // ==========================================================

  function logout() {
    sessionStorage.removeItem(
      ACCESS_TOKEN_KEY
    );

    clearPasswordResetSession();

    setUser(null);
  }


  // ==========================================================
  // REFRESH USER
  // ==========================================================

  async function refreshUser() {
    const response =
      await api.get(
        "/auth/me"
      );


    setUser(
      response.data.user
    );


    return response.data.user;
  }


  const value = {
    user,

    isAuthenticated:
      Boolean(user),

    isInitializing,

    login,
    logout,

    changePassword,

    requestPasswordReset,

    verifyPasswordResetOtp,

    resetForgottenPassword,

    refreshUser,
  };


  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}