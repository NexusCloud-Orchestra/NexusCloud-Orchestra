import type { Config } from "tailwindcss"

/**
 * NexusCloud design tokens, matched to the landing page (public/landing/styles.css):
 * night sky ground, deep-blue glass surfaces, frost type, one gold accent.
 * Token names are kept so every screen inherits the theme.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#060C16",
        deep: "#0B1828",
        paper: "#060C16",
        surface: "#0B1828",
        raise: "#122338",
        line: "#1E2D40",
        "line-strong": "#2E4058",
        ink: "#EAF0F7",
        "ink-2": "#AAB3BF",
        "ink-3": "#7D8896",
        accent: "#F3C56F",
        "accent-deep": "#FFD68A",
        "accent-wash": "#2A2416",
        "accent-line": "#6B5631",
        "on-accent": "#1B1406",
        ok: "#6FD3A0",
        "ok-wash": "#0F2A20",
        "ok-line": "#1F5A40",
        warn: "#F59E5B",
        "warn-wash": "#2D1D10",
        "warn-line": "#6A4422",
        bad: "#F2827A",
        "bad-wash": "#2E1416",
        "bad-line": "#6B2A2C",
      },
      fontFamily: {
        sans: ["Instrument Sans", "Segoe UI", "Helvetica Neue", "sans-serif"],
        display: ["Syne", "Avenir Next", "Futura", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Consolas", "monospace"],
      },
      fontSize: {
        "2xs": ["10px", "14px"],
        xs: ["11px", "16px"],
        sm: ["12.5px", "18px"],
        base: ["14px", "21px"],
        md: ["15px", "22px"],
        lg: ["16px", "23px"],
        xl: ["20px", "27px"],
        "2xl": ["26px", "32px"],
        "3xl": ["34px", "40px"],
        "4xl": ["44px", "48px"],
      },
      letterSpacing: {
        kicker: "0.08em",
        tight: "-0.01em",
        tighter: "-0.02em",
      },
      borderRadius: {
        xs: "4px",
        sm: "10px",
        md: "16px",
        lg: "20px",
      },
      boxShadow: {
        pop: "0 24px 60px -20px rgba(0,0,0,0.7), 0 2px 10px -4px rgba(0,0,0,0.5)",
        toast: "0 16px 40px -14px rgba(0,0,0,0.75)",
        glow: "0 0 0 1px rgba(243,197,111,0.45), 0 10px 40px -12px rgba(243,197,111,0.35)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "180ms",
        slow: "280ms",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.2, 0, 0, 1)",
        inout: "cubic-bezier(0.4, 0, 0.2, 1)",
        spring: "cubic-bezier(0.34, 1.3, 0.44, 1)",
      },
      maxWidth: {
        content: "1160px",
        prose: "68ch",
      },
      keyframes: {
        "fade-rise": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.98) translateY(-2px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(16px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        draw: {
          from: { strokeDashoffset: "1" },
          to: { strokeDashoffset: "0" },
        },
        "bar-grow": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        rise: {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        indeterminate: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(250%)" },
        },
      },
      animation: {
        "fade-rise": "fade-rise 280ms cubic-bezier(0.2, 0, 0, 1) both",
        "fade-in": "fade-in 180ms cubic-bezier(0.2, 0, 0, 1) both",
        "scale-in": "scale-in 140ms cubic-bezier(0.2, 0, 0, 1) both",
        "slide-in-right": "slide-in-right 220ms cubic-bezier(0.2, 0, 0, 1) both",
        "slide-up": "slide-up 240ms cubic-bezier(0.2, 0, 0, 1) both",
        "bar-grow": "bar-grow 600ms cubic-bezier(0.2, 0, 0, 1) both",
        "pulse-soft": "pulse-soft 1.6s ease-in-out infinite",
        rise: "rise 0.9s cubic-bezier(.2,.7,.2,1) both",
        indeterminate: "indeterminate 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config
