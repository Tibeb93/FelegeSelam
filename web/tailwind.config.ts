import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#F4F8FC",
          100: "#E8F1FB",
          200: "#D0E4F7",
          300: "#A6CEF0",
          400: "#5CA4E2",
          500: "#1E78C8",
          600: "#1462A8",
          700: "#0F4C81",
          800: "#0C3C67",
          900: "#0A2E52",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          gold: "#F2B233",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Semantic status tokens
        success: {
          DEFAULT: "#1B8E5A",
          foreground: "#FFFFFF",
          50: "#E8F7F0",
          100: "#D1F0E1",
          600: "#1B8E5A",
          700: "#136640",
          800: "#0E4D30",
          900: "#0A3521",
        },
        warning: {
          DEFAULT: "#E39B00",
          foreground: "#FFFFFF",
          50: "#FEF9EE",
          100: "#FDF2DC",
          500: "#E39B00",
          600: "#C48600",
          700: "#9E6C00",
        },
        danger: {
          DEFAULT: "#C62828",
          foreground: "#FFFFFF",
          50: "#FDF2F2",
          100: "#FCE5E5",
          600: "#C62828",
          700: "#A81E1E",
          800: "#8B1818",
        },
        // Blue & White Brand Design Tokens (single source of truth)
        brand: {
          primary700: "#0F4C81",
          primary900: "#0A2E52",
          primary500: "#1E78C8",
          primary100: "#E8F1FB",
          white: "#FFFFFF",
          text: "#0F2438",
          mutedText: "#5B6B7C",
          border: "#D7E3F1",
          accentGold: "#F2B233",
          success: "#1B8E5A",
          warning: "#E39B00",
          danger: "#C62828",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        ethiopic: ["'Noto Sans Ethiopic'", "Nyala", "'Abyssinica SIL'", "system-ui", "sans-serif"],
      },
      minHeight: {
        touch: "48px",
      },
      minWidth: {
        touch: "48px",
      },
    },
  },
  plugins: [],
};

export default config;
