const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...fontFamily.mono],
        geo: ["var(--font-geo)", ...fontFamily.sans],
      },
      colors: {
        "custom-green": "#4A7C59",
        "custom-background": "#1C1C1C",
      },
    },
  },
  plugins: [],
};
