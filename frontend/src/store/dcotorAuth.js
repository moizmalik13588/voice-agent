export const saveDoctor = (token, doctor) => {
  localStorage.setItem("doctor_token", token);
  localStorage.setItem("doctor", JSON.stringify(doctor));
};

export const getDoctor = () => {
  const d = localStorage.getItem("doctor");
  return d ? JSON.parse(d) : null;
};

export const isDoctorLoggedIn = () => !!localStorage.getItem("doctor_token");

export const logoutDoctor = () => {
  localStorage.removeItem("doctor_token");
  localStorage.removeItem("doctor");
};
