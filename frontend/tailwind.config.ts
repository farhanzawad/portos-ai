import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        portos: {
          navy: {
            DEFAULT: "#102A43",
            dark: "#0B1D30",
            secondary: "#1E4967",
          },
          teal: {
            DEFAULT: "#16A394",
            light: "#E6F6F4",
            dark: "#0E7569",
          },
          amber: {
            DEFAULT: "#E5A23B",
            light: "#FDF5E8",
            dark: "#A8701B",
          },
          red: {
            DEFAULT: "#D95454",
            light: "#FDEEEEE",
            dark: "#9E3434",
          },
          bg: "#F4F6F8",
          surface: "#FFFFFF",
          muted: "#667085",
          border: "#DCE3EA",
          canvas: "#132B3F",
        },
      },
      fontFamily: {
        sans: ["Inter", "Geist", "system-ui", "sans-serif"],
        mono: ["GeistMono", "monospace"],
      },
      spacing: {
        "8pt": "8px",
        "16pt": "16px",
        "24pt": "24px",
        "32pt": "32px",
      },
    },
  },
  plugins: [],
};

export default config;

