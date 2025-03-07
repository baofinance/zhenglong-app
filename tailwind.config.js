/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
        geo: ["Geo", "sans-serif"],
      },
      keyframes: {
        "steam-1": {
          "0%": { transform: "scale(2) translate(0%, 10%)", opacity: "0.05" },
          "50%": {
            transform: "scale(2.2) translate(-5%, -5%)",
            opacity: "0.1",
          },
          "100%": { transform: "scale(2) translate(0%, 10%)", opacity: "0.05" },
        },
        "steam-2": {
          "0%": { transform: "scale(2) translate(0%, -10%)", opacity: "0.05" },
          "50%": { transform: "scale(2.2) translate(5%, 5%)", opacity: "0.1" },
          "100%": {
            transform: "scale(2) translate(0%, -10%)",
            opacity: "0.05",
          },
        },
        "steam-3": {
          "0%": { transform: "scale(2) translate(-10%, 0%)", opacity: "0.05" },
          "50%": { transform: "scale(2.2) translate(5%, -5%)", opacity: "0.1" },
          "100%": {
            transform: "scale(2) translate(-10%, 0%)",
            opacity: "0.05",
          },
        },
        backgroundMove: {
          "0%": { transform: "translate(0, 0)" },
          "100%": { transform: "translate(40px, 40px)" },
        },
        "circuit-1": {
          "0%": { transform: "translateY(-50%)" },
          "100%": { transform: "translateY(0%)" },
        },
        "circuit-2": {
          "0%": { transform: "translateY(-30%)" },
          "100%": { transform: "translateY(20%)" },
        },
        "circuit-3": {
          "0%": { transform: "translateY(0%)" },
          "100%": { transform: "translateY(-50%)" },
        },
        "float-1": {
          "0%, 100%": { transform: "scaleX(1)" },
          "50%": { transform: "scaleX(1.1)" },
        },
        "float-2": {
          "0%, 100%": { transform: "scaleX(1)" },
          "50%": { transform: "scaleX(0.9)" },
        },
        "float-3": {
          "0%, 100%": { transform: "translate(0, 0) rotate(12deg)" },
          "50%": { transform: "translate(15px, 5px) rotate(12deg)" },
        },
        "float-4": {
          "0%, 100%": { transform: "translate(0, 0) rotate(-12deg)" },
          "50%": { transform: "translate(-5px, -15px) rotate(-12deg)" },
        },
        "pulse-width": {
          "0%, 100%": { width: "100%" },
          "50%": { width: "130%" },
        },
        "pulse-width-mirror": {
          "0%, 100%": { width: "100%" },
          "50%": { width: "130%" },
        },
        "scale-pulse": {
          "0%, 100%": {
            transform: "scale(1)",
          },
          "50%": {
            transform: "scale(1.2)",
          },
        },
        "scale-pulse-mirror": {
          "0%, 100%": {
            transform: "scale(1)",
          },
          "50%": {
            transform: "scale(1.2)",
          },
        },
      },
      animation: {
        "steam-1": "steam-1 20s ease-in-out infinite",
        "steam-2": "steam-2 25s ease-in-out infinite",
        "steam-3": "steam-3 30s ease-in-out infinite",
        "background-move": "backgroundMove 20s linear infinite",
        "circuit-1": "circuit-1 15s linear infinite",
        "circuit-2": "circuit-2 20s linear infinite",
        "circuit-3": "circuit-3 18s linear infinite",
        "float-1": "float-1 8s ease-in-out infinite",
        "float-2": "float-2 12s ease-in-out infinite",
        "float-3": "float-3 10s ease-in-out infinite",
        "float-4": "float-4 9s ease-in-out infinite",
        "pulse-width": "pulse-width 2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "pulse-width-mirror":
          "pulse-width-mirror 2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "scale-pulse": "scale-pulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "scale-pulse-mirror":
          "scale-pulse-mirror 2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
      },
      transitionProperty: {
        opacity: "opacity",
      },
      transitionDuration: {
        2000: "2000ms",
      },
    },
  },
  plugins: [],
};
