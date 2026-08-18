/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1", // indigo-500
        secondary: "#8b5cf6", // violet-500
        accent: "#ec4899", // pink-500
        background: "#f9fafb", // gray-50
        card: "#ffffff",
        muted: "#f3f4f6", // gray-100
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        card: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        dialog: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -3px rgb(0 0 0 / 0.04)",
      },
      fontSize: {
        base: ["1rem", { lineHeight: "1.75" }],
        lg: ["1.125rem", { lineHeight: "1.75" }],
      },
    },
  },
  plugins: [],
};