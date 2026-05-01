export const saveAuth = (apiKey, hospital) => {
  localStorage.setItem("api_key", apiKey);
  localStorage.setItem("hospital", JSON.stringify(hospital));
};

export const getHospital = () => {
  const h = localStorage.getItem("hospital");
  return h ? JSON.parse(h) : null;
};

export const isLoggedIn = () => !!localStorage.getItem("api_key");

export const logout = () => {
  localStorage.removeItem("api_key");
  localStorage.removeItem("hospital");
};
