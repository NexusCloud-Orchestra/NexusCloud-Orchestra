import type { Config } from "tailwindcss"

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Base backgrounds */
        night:   "#0B1B32",
        deep:    "#0B1B32",
        paper:   "#FFFDF8",
        surface: "#FAF6ED",
        card:    "#FFFFFF",
        raise:   "#FAF6ED",
        hover:   "#FFF8E7",

        /* Established NexusCloud Palette */
        "regal-navy":   "#142B4A",
        "deep-navy":    "#0B1B32",
        "corn-silk":    "#FFF8E7",
        "royal-gold":   "#C49A3A",
        "antique-gold": "#A77B26",
        "warm-white":   "#FFFDF8",
        ivory:          "#FAF6ED",
        "slate-text":   "#344256",
        "muted-slate":  "#68768A",
        border:         "#E8E0D1",
        success:        "#168568",
        warning:        "#B7791F",
        danger:         "#C43D4B",

        /* Borders */
        line:         "#E8E0D1",
        "line-strong":"#D8CEBE",

        /* Text */
        ink:    "#142B4A",
        "ink-2":"#344256",
        "ink-3":"#68768A",

        /* Brand accent – Regal Navy and Royal Gold */
        brand:         "#142B4A",
        "brand-2":     "#0B1B32",
        "brand-3":     "#C49A3A",
        "accent-soft": "rgba(196,154,58,0.12)",
        "accent-line": "rgba(196,154,58,0.35)",

        /* Gold */
        gold:        "#C49A3A",
        "gold-soft": "rgba(196,154,58,0.12)",

        /* Status */
        ok:          "#168568",
        "ok-wash":   "rgba(22,133,104,0.10)",
        "ok-line":   "rgba(22,133,104,0.30)",
        warn:        "#B7791F",
        "warn-wash": "rgba(183,121,31,0.10)",
        "warn-line": "rgba(183,121,31,0.30)",
        bad:         "#C43D4B",
        "bad-wash":  "rgba(196,61,75,0.10)",
        "bad-line":  "rgba(196,61,75,0.30)",

        /* Legacy compat */
        accent:       "#C49A3A",
        "accent-deep":"#A77B26",
        "accent-wash":"rgba(196,154,58,0.12)",
        "on-accent":  "#FFFFFF",
      },
      fontFamily: {
        sans:     ["Inter", "Instrument Sans", "system-ui", "sans-serif"],
        display:  ["Plus Jakarta Sans", "Inter", "sans-serif"],
        palatino: ["'Palatino Linotype'", "Palatino", "'URW Palladio L'", "'Book Antiqua'", "Georgia", "serif"],
        blackops: ["'Black Ops One'", "cursive"],
        mono:     ["JetBrains Mono", "SFMono-Regular", "Consolas", "monospace"],
      },
      fontSize: {
        "2xs": ["10px", "14px"],
        xs:    ["11px", "16px"],
        sm:    ["12.5px", "18px"],
        base:  ["14px", "21px"],
        md:    ["15px", "22px"],
        lg:    ["16px", "23px"],
        xl:    ["20px", "27px"],
        "2xl": ["26px", "32px"],
        "3xl": ["34px", "40px"],
        "4xl": ["44px", "48px"],
      },
      letterSpacing: {
        kicker: "0.08em",
        tight:  "-0.01em",
        tighter:"-0.02em",
      },
      borderRadius: {
        xs: "4px",
        sm: "10px",
        md: "16px",
        lg: "20px",
        xl: "24px",
      },
      boxShadow: {
        pop:   "0 24px 60px -20px rgba(0,0,0,0.85), 0 2px 10px -4px rgba(0,0,0,0.6)",
        toast: "0 16px 40px -14px rgba(0,0,0,0.8)",
        card:  "0 4px 24px -8px rgba(0,0,0,0.6)",
        xs:    "0 1px 4px rgba(0,0,0,0.3)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "180ms",
        slow: "280ms",
      },
      transitionTimingFunction: {
        out:    "cubic-bezier(0.2, 0, 0, 1)",
        inout:  "cubic-bezier(0.4, 0, 0.2, 1)",
        spring: "cubic-bezier(0.34, 1.3, 0.44, 1)",
      },
      maxWidth: {
        content: "1160px",
        prose:   "68ch",
      },
      keyframes: {
        "fade-rise": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.98) translateY(-2px)" },
          to:   { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(16px)", opacity: "0" },
          to:   { transform: "translateX(0)",    opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to:   { transform: "translateY(0)" },
        },
        draw: {
          from: { strokeDashoffset: "1" },
          to:   { strokeDashoffset: "0" },
        },
        "bar-grow": {
          from: { transform: "scaleX(0)" },
          to:   { transform: "scaleX(1)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.45" },
        },
        rise: {
          from: { opacity: "0", transform: "translateY(18px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        indeterminate: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(250%)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-rise":      "fade-rise 280ms cubic-bezier(0.2, 0, 0, 1) both",
        "fade-in":        "fade-in 180ms cubic-bezier(0.2, 0, 0, 1) both",
        "scale-in":       "scale-in 140ms cubic-bezier(0.2, 0, 0, 1) both",
        "slide-in-right": "slide-in-right 220ms cubic-bezier(0.2, 0, 0, 1) both",
        "slide-up":       "slide-up 240ms cubic-bezier(0.2, 0, 0, 1) both",
        "bar-grow":       "bar-grow 600ms cubic-bezier(0.2, 0, 0, 1) both",
        "pulse-soft":     "pulse-soft 1.6s ease-in-out infinite",
        rise:             "rise 0.9s cubic-bezier(.2,.7,.2,1) both",
        indeterminate:    "indeterminate 1.2s ease-in-out infinite",
        shimmer:          "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config
