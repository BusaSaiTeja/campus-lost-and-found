import axios from "axios";

const hostname = window.location.hostname;

const API = axios.create({
  baseURL: hostname === 'localhost'
    ? 'http://localhost:5000'
    : import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Flag to avoid multiple refresh calls simultaneously
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  })

  failedQueue = [];
};

API.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If refresh request is ongoing, queue the requests
        return new Promise(function(resolve, reject) {
          failedQueue.push({resolve, reject});
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return API(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call your refresh token endpoint
        const res = await API.post('/api/refresh');
        const newAccessToken = res.data.access_token;

        // Optionally store token if needed (localStorage/sessionStorage)
        // But since you use httpOnly cookies, just retry request

        processQueue(null, newAccessToken);

        isRefreshing = false;

        // Retry the original request
        return API(originalRequest);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        // Optionally logout user or redirect to login
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
