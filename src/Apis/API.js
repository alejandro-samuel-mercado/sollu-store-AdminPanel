import axios from "axios";
import { memo } from "react";
import { useAuth } from "../context/AuthContext";

const API = axios.create({
  baseURL: `${process.env.REACT_APP_API_BASE_URL}/api/`,
});

API.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  async (error) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { clearSesion } = useAuth();

    if (error.response?.status === 401 || error.response?.status === 403) {
      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(
            `${process.env.REACT_APP_API_BASE_URL}/api/auth/token/refresh/`,
            { refresh: refreshToken }
          );
          const newAccessToken = refreshResponse.data.access;
          localStorage.setItem("access_token", newAccessToken);

          error.config.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return axios(error.config);
        } catch (refreshError) {
          console.error("Error al renovar el token:", refreshError);
          clearSesion();
        }
      } else {
        clearSesion();
      }
    }
    return Promise.reject(error);
  }
);

export default API;
