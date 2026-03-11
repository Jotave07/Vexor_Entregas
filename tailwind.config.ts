import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#dceffc",
          200: "#badff9",
          300: "#84c8f4",
          400: "#47acec",
          500: "#1f93d7",
          600: "#1475b3",
          700: "#145d91",
          800: "#164f78",
          900: "#184364",
          950: "#0f2b42"
        },
        accent: "#f97316",
        ink: "#0f172a",
        sand: "#f8fafc"
      },
      boxShadow: {
        card: "0 20px 45px -24px rgba(15, 23, 42, 0.35)"
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
