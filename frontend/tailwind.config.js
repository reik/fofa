/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4d9463",
          dark: "#3a7049",
          light: "#edfaf2",
        },
        accent: {
          DEFAULT: "#f0b24f",
          dark: "#d4962b",
        },
        surface: "#ffffff",
        bg: "#fafaf7",
        border: "#e6e2dc",
        muted: "#7b8492",
        light: "#a8b0bb",
      },
      fontFamily: {
        body: ["Nunito", "sans-serif"],
        heading: ["Titan One", "cursive"],
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "20px",
        xl: "28px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 3px rgba(0,0,0,.08)",
        md: "0 4px 16px rgba(0,0,0,.10)",
        lg: "0 8px 32px rgba(0,0,0,.12)",
      },
    },
  },
  plugins: [],
};
