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
      screens: {
        'xs': '475px',
        'tablet': '640px',
        'landscape': { 'raw': '(orientation: landscape) and (max-width: 1023px)' },
      },
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
        warm: {
          DEFAULT: "hsl(var(--warm))",
          foreground: "hsl(var(--warm-foreground))",
        },
        gentle: {
          DEFAULT: "hsl(var(--gentle))",
          foreground: "hsl(var(--gentle-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "card": "var(--card-radius)",
        "card-lg": "var(--card-radius-lg)",
      },
      spacing: {
        "card": "var(--card-padding)",
        "card-sm": "var(--card-padding-sm)",
        "card-lg": "var(--card-padding-lg)",
        "card-gap": "var(--card-gap)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "rainbow-flow": {
          "0%, 100%": {
            "background-position": "0% 50%",
          },
          "50%": {
            "background-position": "100% 50%",
          },
        },
        "rainbow-spin": {
          "0%, 100%": {
            transform: "rotate(0deg)",
          },
          "25%": {
            transform: "rotate(5deg)",
          },
          "75%": {
            transform: "rotate(-5deg)",
          },
        },
        "rainbow-border": {
          "0%, 100%": {
            "border-color": "hsl(0, 100%, 65%)",
          },
          "14%": {
            "border-color": "hsl(30, 100%, 60%)",
          },
          "28%": {
            "border-color": "hsl(60, 100%, 55%)",
          },
          "42%": {
            "border-color": "hsl(120, 100%, 50%)",
          },
          "57%": {
            "border-color": "hsl(180, 100%, 50%)",
          },
          "71%": {
            "border-color": "hsl(240, 100%, 60%)",
          },
          "85%": {
            "border-color": "hsl(300, 100%, 65%)",
          },
        },
        "shimmer": {
          "0%": {
            "background-position": "200% 0",
          },
          "100%": {
            "background-position": "-200% 0",
          },
        },
        "meteor": {
          "0%": {
            transform: "translateY(0) translateX(0) rotate(45deg)",
            opacity: "1",
          },
          "100%": {
            transform: "translateY(300px) translateX(-300px) rotate(45deg)",
            opacity: "0",
          },
        },
        "float": {
          "0%, 100%": {
            transform: "translateX(0) translateY(0)",
          },
          "25%": {
            transform: "translateX(10px) translateY(-5px)",
          },
          "50%": {
            transform: "translateX(20px) translateY(0)",
          },
          "75%": {
            transform: "translateX(10px) translateY(5px)",
          },
        },
        "sway": {
          "0%, 100%": {
            transform: "rotate(0deg) translateX(0)",
          },
          "25%": {
            transform: "rotate(1deg) translateX(2px)",
          },
          "75%": {
            transform: "rotate(-1deg) translateX(-2px)",
          },
        },
        "twinkle": {
          "0%, 100%": {
            opacity: "0.3",
            transform: "scale(1)",
          },
          "50%": {
            opacity: "1",
            transform: "scale(1.2)",
          },
        },
        "aurora": {
          "0%, 100%": {
            transform: "translateY(0) scaleY(1)",
            opacity: "0.5",
          },
          "50%": {
            transform: "translateY(-20px) scaleY(1.2)",
            opacity: "0.8",
          },
        },
        "snowfall": {
          "0%": {
            transform: "translateY(-10px) translateX(0)",
            opacity: "0",
          },
          "10%": {
            opacity: "1",
          },
          "90%": {
            opacity: "1",
          },
          "100%": {
            transform: "translateY(100vh) translateX(20px)",
            opacity: "0",
          },
        },
        "sun-glow": {
          "0%, 100%": {
            transform: "scale(1)",
            opacity: "0.8",
          },
          "50%": {
            transform: "scale(1.1)",
            opacity: "1",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "rainbow-flow": "rainbow-flow 3s ease infinite",
        "rainbow-spin": "rainbow-spin 2s ease-in-out infinite",
        "rainbow-border": "rainbow-border 3s linear infinite",
        "shimmer": "shimmer 3s ease-in-out infinite",
        "meteor": "meteor 3s linear infinite",
        "float": "float 8s ease-in-out infinite",
        "sway": "sway 4s ease-in-out infinite",
        "twinkle": "twinkle 3s ease-in-out infinite",
        "aurora": "aurora 6s ease-in-out infinite",
        "snowfall": "snowfall 8s linear infinite",
        "sun-glow": "sun-glow 4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
