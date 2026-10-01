import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          50: "#f0f4f9",
          100: "#d9e2ec",
          200: "#bcccdc",
          300: "#9fb3c8",
          400: "#627d98",
          500: "#486581",
          600: "#334e68",
          700: "#243b53",
          800: "#1e3a8a",
          900: "#0f2042",
          950: "#0a162e",
        },
      },
      animation: {
        pulse: "pulse 1.5s linear infinite",
        open: "open 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        loading: "loading .5s linear infinite",
        waving: "waving 2.2s ease-in-out infinite",
        "pulse-radar": "pulse-radar 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "pulse-button": "pulse-button 2s ease-in-out infinite",
      },
      keyframes: {
        pulse: {
          "0%": { opacity: "0.5" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0.5" },
        },
        open: {
          "0%": {
            transform: "scale(0.85)",
            opacity: "0",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
        loading: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        waving: {
          "0%, 100%": {
            transform: "rotate(0deg) scale(1)",
          },
          "20%": {
            transform: "rotate(-12deg) scale(1.12)",
          },
          "40%": {
            transform: "rotate(12deg) scale(1.12)",
          },
          "60%": {
            transform: "rotate(-8deg) scale(1.06)",
          },
          "80%": {
            transform: "rotate(8deg) scale(1.06)",
          },
        },
        "pulse-radar": {
          "0%": {
            transform: "scale(0.85)",
            opacity: "0.85",
          },
          "70%": {
            transform: "scale(1.5)",
            opacity: "0",
          },
          "100%": {
            transform: "scale(1.5)",
            opacity: "0",
          },
        },
        "pulse-button": {
          "0%, 100%": {
            transform: "scale(1)",
            boxShadow: "0 0 0 0 rgba(30, 58, 138, 0.2)",
          },
          "50%": {
            transform: "scale(1.08)",
            boxShadow: "0 0 0 4px rgba(30, 58, 138, 0.12)",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
