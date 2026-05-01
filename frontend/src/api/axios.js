import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000", // yeh sahi hona chahiye
});

// Har request mein api key attach karo
api.interceptors.request.use((config) => {
  const key = localStorage.getItem("api_key");
  if (key) config.headers["x-api-key"] = key;
  return config;
});

// 401 pe login pe redirect
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("api_key");
      localStorage.removeItem("hospital");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export default api;
