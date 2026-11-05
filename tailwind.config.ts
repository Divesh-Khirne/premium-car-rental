import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#101827", 800: "#18233a", 700: "#223050", 600: "#33446b" },
        gold: { DEFAULT: "#C9A96E", dark: "#a98a52", light: "#e6d3ac" },
        surface: "#F5F6F8",
        ink: "#20242C",
      },
      fontFamily: {
        // System font stacks: zero network dependency. EDIT HERE to use Google Fonts via next/font.
        display: ['"Iowan Old Style"', '"Palatino Linotype"', "Palatino", "Georgia", "serif"],
        sans: ["ui-sans-serif", "system-ui", "-apple-system", '"Segoe UI"', "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,39,.05), 0 8px 24px -12px rgba(16,24,39,.18)",
        lift: "0 18px 40px -18px rgba(16,24,39,.35)",
      },
    },
  },
  plugins: [],
};
export default config;
