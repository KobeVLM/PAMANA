/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // PAMANA Custom Colors
        pamana: {
          green: "#2D7D46",
          amber: "#D97706",
          warm: "#92400E",
          earth: "#78350F",
          forest: "#14532D",
          cream: "#FFFBEB",
          gold: "#F59E0B",
          terracotta: "#C2410C",
          bark: "#3B2A1A",
          wood: "#4A3728",
          parchment: "#FAF3E0",
          moss: "#4D7C0F",
        },
      },
      boxShadow: {
        story:
          "0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 4px 12px -4px rgba(0, 0, 0, 0.4)",
        tile: "0 5px 0 0 rgba(0, 0, 0, 0.35), 0 12px 20px -10px rgba(0, 0, 0, 0.5)",
        "glow-gold":
          "0 0 0 3px rgba(245, 158, 11, 0.35), 0 0 24px rgba(245, 158, 11, 0.25)",
        "inner-soft": "inset 0 1px 0 0 rgba(255, 255, 255, 0.12)",
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
        "bounce-in": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "70%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-6px)" },
          "40%, 80%": { transform: "translateX(6px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(45, 125, 70, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(45, 125, 70, 0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) rotate(-1deg)" },
          "50%": { transform: "translateY(-12px) rotate(1deg)" },
        },
        "star-pop": {
          "0%": { transform: "scale(0) rotate(-30deg)", opacity: "0" },
          "70%": { transform: "scale(1.3) rotate(5deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-4deg)" },
          "75%": { transform: "rotate(4deg)" },
        },
        sheen: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(220%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-in": "bounce-in 0.4s ease-out",
        shake: "shake 0.4s ease-in-out",
        "pulse-glow": "pulse-glow 2s infinite",
        float: "float 3s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "star-pop": "star-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "pop-in": "pop-in 0.25s ease-out",
        "slide-up": "slide-up 0.35s ease-out",
        wiggle: "wiggle 0.5s ease-in-out",
        sheen: "sheen 2.5s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["Nunito", "system-ui", "sans-serif"],
        heading: ["Nunito", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
