import axios from "axios";

const hostname = window.location.hostname;

// use VITE_API_URL if provided, otherwise fallback to localhost dev server
const envUrl = (import.meta.env.VITE_API_URL || "").trim();
const baseURL = hostname === "localhost" ? "http://localhost:5000" : envUrl;

const API = axios.create({
  baseURL,
  withCredentials: true,
});

// ensure defaults (explicit)
API.defaults.withCredentials = true;

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

// Response interceptor to catch 401 and refresh using cookies
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle real responses with status 401 and avoid infinite loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // queue the request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => API(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the refresh endpoint — backend will set new access_token cookie
        // NOTE: your backend route is /api/refresh (auth_bp registered under /api)
        await axios.post(`${baseURL}/api/refresh`, {}, { withCredentials: true });

        // Refresh succeeded; retry queued requests (they will include cookies)
        processQueue(null);
        return API(originalRequest);
      } catch (err) {
        processQueue(err);
        // Optionally: redirect to login on refresh failure
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
