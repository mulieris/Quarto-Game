/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1c1917",
        paper: "#faf7f2",
        wood: "#c4a574",
        wooddeep: "#8b6914",
        accent: "#3d5a6c",
        muted: "#78716c",
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      boxShadow: {
        panel: "0 18px 50px rgba(28, 25, 23, 0.12)",
      },
    },
  },
  plugins: [],
};
