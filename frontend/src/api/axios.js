import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

api.interceptors.request.use((config) => {
  const key = localStorage.getItem("api_key");
  if (key) config.headers["x-api-key"] = key;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Check karein kya hum login page par hain?
    const isLoginPage =
      window.location.pathname === "/login" ||
      window.location.pathname === "/doctor/login";

    // Agar 401 error hai AUR hum login page par NAHI hain, tabhi redirect karein
    if (err.response?.status === 401 && !isLoginPage) {
      if (window.location.pathname.startsWith("/doctor")) {
        localStorage.removeItem("doctor_token");
        localStorage.removeItem("doctor");
        window.location.href = "/doctor/login";
      } else {
        localStorage.removeItem("api_key");
        localStorage.removeItem("hospital");
        window.location.href = "/login";
      }
    }

    // Agar login page par hain, toh sirf error pass karein taaki UI mein error dikhe
    return Promise.reject(err);
  },
);

export default api;
