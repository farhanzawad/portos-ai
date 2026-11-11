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
        "primary-container": "#ff5722",
        "primary": "#ffb5a0",
        "secondary": "#4edea3",
        "secondary-container": "#00a572",
        "surface-container": "#1e2024",
        "surface-container-high": "#282a2e",
        "surface-container-low": "#1a1c20",
        "surface-container-lowest": "#0c0e12",
        "surface-variant": "#333539",
        portos: {
          // Executive Maritime Navy / Slate (Slate 900 base)
          navy: {
            DEFAULT: "#0F172A",
            dark: "#090D16",
            secondary: "#1E293B",
            muted: "#334155",
          },
          // Electric Maritime Cyan & Action Accents
          sky: {
            50: "#F0F9FF",
            100: "#E0F2FE",
            200: "#BAE6FD",
            300: "#7DD3FC",
            400: "#38BDF8",
            500: "#0EA5E9",
            600: "#0284C7",
            700: "#0369A1",
            800: "#075985",
            900: "#0C4A6E",
          },
          // Operational Health / Success (Clean Precision Emerald)
          emerald: {
            50: "#ECFDF5",
            100: "#D1FAE5",
            200: "#A7F3D0",
            300: "#6EE7B7",
            400: "#34D399",
            500: "#10B981",
            600: "#059669",
            700: "#047857",
            800: "#065F46",
          },
          // Operational Watch / Advisory (Sunlit Amber)
          amber: {
            DEFAULT: "#F59E0B",
            50: "#FFFBEB",
            100: "#FEF3C7",
            200: "#FDE68A",
            500: "#F59E0B",
            600: "#D97706",
            700: "#B45309",
          },
          // Disruption / Hazard / Incompatible (Modern Crimson Rose)
          red: {
            DEFAULT: "#F43F5E",
            50: "#FFF1F2",
            100: "#FFE4E6",
            200: "#FECDD3",
            500: "#F43F5E",
            600: "#E11D48",
            700: "#BE123C",
          },
          // Standard UI Backgrounds & Borders
          bg: "#F8FAFC",
          surface: "#FFFFFF",
          muted: "#64748B",
          border: "#E2E8F0",
          canvas: "#0F172A",
          teal: {
            DEFAULT: "#0284C7",
            light: "#E0F2FE",
            dark: "#0369A1",
          },
        },
      },
      borderRadius: {
        "xl": "12px",
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "24px",
      },
      boxShadow: {
        "xs": "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
        "2xs": "0 1px 2px 0 rgba(15, 23, 42, 0.03)",
        "sm": "0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
        "md": "0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
        "lg": "0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)",
        "fasto": "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)",
        "fasto-hover": "0 10px 20px -3px rgba(15, 23, 42, 0.07), 0 4px 6px -2px rgba(15, 23, 42, 0.03)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
