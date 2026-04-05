import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#071018",
        panel: "#0d1923",
        panelAlt: "#101f2b",
        line: "#1d3445",
        text: "#e2edf7",
        muted: "#8da3b7",
        accent: "#5ec2ff",
        success: "#67d39b",
        warning: "#f0bd64",
        danger: "#ff7a7a",
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "Segoe UI", "sans-serif"],
        mono: ["IBM Plex Mono", "Consolas", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(94, 194, 255, 0.2), 0 14px 30px rgba(0, 0, 0, 0.35)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(94, 194, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(94, 194, 255, 0.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;

