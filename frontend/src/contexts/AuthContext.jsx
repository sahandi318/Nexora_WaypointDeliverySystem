import {
  useEffect,
  useState,
} from "react";

import api, {
  ACCESS_TOKEN_KEY,
} from "../services/api";

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
  // CHANGE PASSWORD
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
  // LOGOUT
  // ==========================================================

  function logout() {
    sessionStorage.removeItem(
      ACCESS_TOKEN_KEY
    );

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