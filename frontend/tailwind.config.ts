import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
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
        // Audio interface specific colors
        audio: {
          panel: "hsl(var(--audio-panel))",
          control: "hsl(var(--audio-control))",
          active: "hsl(var(--beat-active))",
          inactive: "hsl(var(--beat-inactive))",
          meter: "hsl(var(--level-meter))",
          warning: "hsl(var(--warning))",
        },
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-panel': 'var(--gradient-panel)',
        'gradient-button': 'var(--gradient-button)',
      },
      boxShadow: {
        'neon': 'var(--shadow-neon)',
        'panel': 'var(--shadow-panel)',
        'control': 'var(--shadow-control)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "beat-pulse": {
          "0%, 100%": { 
            transform: "scale(1)",
            boxShadow: "0 0 10px hsl(var(--beat-active) / 0.3)"
          },
          "50%": { 
            transform: "scale(1.1)",
            boxShadow: "0 0 25px hsl(var(--beat-active) / 0.6)"
          },
        },
        "neon-glow": {
          "0%, 100%": { boxShadow: "0 0 10px hsl(var(--primary) / 0.3)" },
          "50%": { boxShadow: "0 0 30px hsl(var(--primary) / 0.8)" },
        },
        "level-meter": {
          "0%": { height: "10%" },
          "100%": { height: "100%" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "beat-pulse": "beat-pulse 0.15s ease-out",
        "neon-glow": "neon-glow 2s ease-in-out infinite",
        "level-meter": "level-meter 0.3s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
