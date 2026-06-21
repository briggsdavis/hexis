import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neutral surfaces per PRD §17 (light mode only).
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F5F5F5",
        },
        border: "#E5E7EB",
        // Completion scale per PRD §13.
        completion: {
          low: "#EF4444", // 0–25%   red
          mid: "#F97316", // 26–50%  orange
          high: "#EAB308", // 51–75% yellow
          full: "#22C55E", // 76–100% green
        },
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)",
        card: "0 1px 2px rgba(16, 24, 40, 0.06)",
      },
      borderRadius: {
        xl: "12px",
      },
      transitionDuration: {
        "80": "80ms",
        "120": "120ms",
        "180": "180ms",
      },
    },
  },
  plugins: [],
};

export default config;
