import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#0a0a0a",
          white: "#ffffff",
          green: "#22c55e",
          greendark: "#16a34a",
          greenlight: "#86efac",
          surface: "#141414",
          surface2: "#1c1c1c",
          border: "#2a2a2a",
          muted: "#8a8a8a",
          amber: "#f59e0b",
          red: "#ef4444",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: { card: "14px" },
      boxShadow: {
        glow: "0 0 0 1px rgba(34,197,94,0.15), 0 8px 30px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};
export default config;
