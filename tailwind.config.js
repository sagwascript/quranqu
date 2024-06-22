/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      sans: ['"Rubik", sans-serif'],
    },
    extend: {
      fontFamily: {
        sans: ["Rubik", "sans-serif"],
        arabic: ["Uthmanic"],
      },
      colors: {
        dark: {
          100: "#212529",
        },
      },
    },
  },
  plugins: [],
};
