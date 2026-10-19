import base from "../../tailwind.config.ts"

const colors = {
  night: "background", deep: "brand-strong", paper: "background",
  "brand-ink": "brand-ink",
  surface: "surface", raise: "surface-muted", line: "border",
  "line-strong": "border-strong", ink: "text-primary",
  "ink-2": "text-secondary", "ink-3": "text-muted",
  accent: "accent-text", "accent-deep": "accent-strong",
  "accent-wash": "accent-soft", "accent-line": "accent-border",
  "on-accent": "surface", ok: "success", "ok-wash": "success-soft",
  "ok-line": "success-border", warn: "warning", "warn-wash": "warning-soft",
  "warn-line": "warning-border", bad: "danger", "bad-wash": "danger-soft",
  "bad-line": "danger-border", brand: "brand-primary", gold: "accent-gold",
  "royal-gold": "accent-gold", sand: "divider-sand",
  "donut-track": "donut-track",
}

export default {
  ...base,
  darkMode: "class",
  theme: {
    ...base.theme,
    extend: {
      ...base.theme.extend,
      colors: Object.fromEntries(Object.entries(colors).map(([name, token]) =>
        [name, `rgb(var(--color-${token}) / <alpha-value>)`],
      )),
      fontFamily: {
        ...base.theme.extend.fontFamily,
        sans: ["'Alora'", "Lora", "'Palatino Linotype'", "Palatino", "'Book Antiqua'", "Georgia", "serif"],
        alora: ["'Alora'", "Lora", "'Palatino Linotype'", "Palatino", "serif"],
        display: ["'Palatino Linotype'", "'Alora'", "Palatino", "serif"],
        palatino: ["'Palatino Linotype'", "Palatino", "'URW Palladio L'", "'Book Antiqua'", "Georgia", "serif"],
        brand: ["'Black Ops One'", "'BlackOpsOne'", "cursive"],
        blackops: ["'Black Ops One'", "'BlackOpsOne'", "cursive"],
      },
      fontSize: {
        ...base.theme.extend.fontSize,
      },
      boxShadow: {
        pop: "0 20px 64px -18px rgb(20 43 74 / .20)",
        toast: "0 8px 30px rgb(20 43 74 / .12)",
        glow: "0 0 0 1px rgb(196 154 58 / .25)",
      },
    },
  },
}
