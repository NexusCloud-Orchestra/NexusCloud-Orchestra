import type { Config } from "tailwindcss"

/**
 * NexusCloud Orchestra design tokens.
 * Light-only. Warm paper ground, white surfaces, hairline structure,
 * graphite type, one cobalt accent. No gradients as a visual device.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6F6F3",
        surface: "#FFFFFF",
        raise: "#FAFAF8",
        line: "#E7E6E1",
        "line-strong": "#D6D4CD",
        ink: "#17191D",
        "ink-2": "#565A62",
        "ink-3": "#8E929C",
        accent: "#2F4BE0",
        "accent-deep": "#2338B5",
        "accent-wash": "#EEF0FC",
        "accent-line": "#C9D2F6",
        ok: "#15734A",
        "ok-wash": "#E8F3ED",
        "ok-line": "#BFDCCB",
        warn: "#8A5A08",
        "warn-wash": "#F8F1E1",
        "warn-line": "#E6D3A6",
        bad: "#A93A2E",
        "bad-wash": "#F9ECEA",
        "bad-line": "#E9C4BE",
      },
      fontFamily: {
        sans: [
          "Inter Variable",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        "2xs": ["10px", "14px"],
        xs: ["11px", "16px"],
        sm: ["12px", "17px"],
        base: ["13px", "19px"],
        md: ["14px", "20px"],
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
        xs: "2px",
        sm: "4px",
        md: "6px",
        lg: "8px",
      },
      boxShadow: {
        pop: "0 10px 30px -12px rgba(23,25,29,0.18), 0 2px 8px -4px rgba(23,25,29,0.08)",
        toast: "0 8px 24px -10px rgba(23,25,29,0.22)",
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
        indeterminate: "indeterminate 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config
