import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/user",
  headers: {
    "Content-Type": "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| Request Interceptor
|--------------------------------------------------------------------------
| Automatically adds the JWT token to every API request.
*/

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/*
|--------------------------------------------------------------------------
| Response Interceptor
|--------------------------------------------------------------------------
| Handles common backend errors in one place.
*/

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      console.log("401 Unauthorized");

      localStorage.removeItem("token");

      // Redirect to login
      window.location.href = "/login";
    }

    if (status === 403) {
      console.log("403 Forbidden");
    }

    if (status === 404) {
      console.log("404 Not Found");
    }

    if (status >= 500) {
      console.log("Server error");
    }

    return Promise.reject(error);
  }
);

export default api;