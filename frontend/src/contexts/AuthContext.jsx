import {
  useEffect,
  useMemo,
  useState,
} from "react";

import api, {
  ACCESS_TOKEN_KEY,
} from "../services/api";

import AuthContext from "./AuthContextCore";


export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);

  const [
    isInitializing,
    setIsInitializing,
  ] = useState(true);


  // ==========================================================
  // INITIAL SESSION RESTORE
  // ==========================================================

  useEffect(() => {
    let isMounted = true;


    async function restoreSession() {
      const token =
        sessionStorage.getItem(
          ACCESS_TOKEN_KEY
        );


      if (!token) {
        if (isMounted) {
          setIsInitializing(false);
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
          setIsInitializing(false);
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
    userId,
    password,
  }) {
    const response =
      await api.post(
        "/auth/login",
        {
          userId,
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
  // LOGOUT
  // ==========================================================

  function logout() {
    sessionStorage.removeItem(
      ACCESS_TOKEN_KEY
    );

    setUser(null);
  }


  // ==========================================================
  // REFRESH CURRENT USER
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


  const value =
    useMemo(
      () => ({
        user,
        isAuthenticated:
          Boolean(user),
        isInitializing,
        login,
        logout,
        refreshUser,
      }),

      [
        user,
        isInitializing,
      ]
    );


  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}