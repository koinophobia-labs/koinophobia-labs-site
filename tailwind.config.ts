import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        bg2: "var(--bg2)",
        panel: "var(--panel)",
        panel2: "var(--panel2)",
        slate: "var(--slate)",
        gold: "var(--gold)",
        cyan: "var(--cyan)",
        magenta: "var(--magenta)",
        orange: "var(--orange)",
        text: "var(--text)",
        dim: "var(--dim)",
        faint: "var(--faint)",
        glow: "var(--glow)",
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 40px 80px -40px color-mix(in srgb, var(--glow) 40%, transparent)",
      },
    },
  },
  plugins: [],
};

export default config;

