import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#f6f2e8",
        soot: "#0a0d10",
        panel: "#111820",
        line: "rgba(246, 242, 232, 0.14)",
        gold: "#d9b66f",
        cyan: "#5bd3d8",
        orange: "#f28a45",
        muted: "#aeb6bc"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
