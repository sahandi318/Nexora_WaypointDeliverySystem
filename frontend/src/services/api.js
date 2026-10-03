import axios from "axios";

export const ACCESS_TOKEN_KEY =
  "nexora_access_token";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

api.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem(
        ACCESS_TOKEN_KEY
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      error.response?.status === 401
    ) {
      sessionStorage.removeItem(
        ACCESS_TOKEN_KEY
      );
    }

    return Promise.reject(error);
  }
);

export default api;