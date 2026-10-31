import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./team/**/*.{js,ts,jsx,tsx,mdx}",
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
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: {
          DEFAULT: "#f8fafc",
          dim: "#e2e8f0",
          bright: "#ffffff",
          container: "#f1f5f9",
          "container-lowest": "#ffffff",
          "container-low": "#f8fafc",
          "container-high": "#e2e8f0",
          "container-highest": "#cbd5e1",
        },
        "on-surface": "#0f172a",
        "on-surface-variant": "#64748b",
        "outline-variant": "#cbd5e1",
        outline: "#94a3b8",
        "primary-container": "#4f46e5",
        "on-primary": "#ffffff",
        "on-primary-container": "#ffffff",
        "secondary-container": "#e0e7ff",
        "on-secondary-container": "#3730a3",
        "secondary-fixed-dim": "#a5b4fc",
        "tertiary-container": "#e0f2fe",
        "inverse-surface": "#1e293b",
        "inverse-on-surface": "#f8fafc",
        error: "#ef4444",
        "error-container": "#fee2e2",
        "on-error-container": "#991b1b",
      },
      spacing: {
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2rem",
        "gutter-md": "1.5rem",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
