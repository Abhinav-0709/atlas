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
        atlas: {
          lime: "#D8F237",
          "lime-light": "#E9FA6A",
          "lime-dark": "#B2CE19",
          sky: "#4EBDFD",
          "sky-light": "#70CCFE",
          "sky-dark": "#2EA5EE",
          blue: "#1A92E8",
          black: "#0E1015",
          dark: "#14171F",
          "dark-section": "#0F1117",
          "dark-card": "#161922",
          card: "#191E28",
          cream: "#F4F5F0",
          "cream-card": "#FAFAF7",
          border: "#E5E7EB",
          "border-dark": "#262B37",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
        handwriting: ["var(--font-caveat)", "cursive"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
