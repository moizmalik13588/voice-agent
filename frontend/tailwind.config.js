/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e3f0fc",
          100: "#bbd6f7",
          500: "#1565c0",
          600: "#1257a8",
          700: "#0e4490",
        },
        navy: "#0a1628",
        surface: "#f8fafc",
        accent: {
          blue: "#60a5fa",
          green: "#34d399",
          purple: "#a78bfa",
        },
      },
    },
  },
  plugins: [],
};
