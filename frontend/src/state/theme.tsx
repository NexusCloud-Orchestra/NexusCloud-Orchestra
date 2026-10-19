import { createContext, useContext, useEffect, useState, useMemo, useRef } from "react"
import type { ReactNode } from "react"
import { useAuth } from "./auth"

export type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  isDark: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export const THEME_STORAGE_KEY = "nexuscloud-theme"

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const prevStatusRef = useRef(status)

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light"
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === "dark") return "dark"
    return "light" // Dashboard defaults to light, user preference can switch to dark
  })

  // Whenever user logs out (status becomes "anonymous"), reset theme to "light".
  // Also, when user transitions to "authenticated" after being logged out (logged in again),
  // guarantee that the dashboard starts in "light" theme.
  useEffect(() => {
    if (status === "anonymous") {
      setThemeState("light")
      try {
        localStorage.removeItem(THEME_STORAGE_KEY)
        localStorage.setItem(THEME_STORAGE_KEY, "light")
      } catch (_) {}
    } else if (status === "authenticated" && prevStatusRef.current === "anonymous") {
      setThemeState("light")
      try {
        localStorage.removeItem(THEME_STORAGE_KEY)
        localStorage.setItem(THEME_STORAGE_KEY, "light")
      } catch (_) {}
    }
    prevStatusRef.current = status
  }, [status])

  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    if (theme === "dark") {
      root.classList.add("dark")
      root.setAttribute("data-theme", "dark")
      root.style.colorScheme = "dark"
      if (body) {
        body.classList.add("dark")
        body.setAttribute("data-theme", "dark")
      }
    } else {
      root.classList.remove("dark")
      root.setAttribute("data-theme", "light")
      root.style.colorScheme = "light"
      if (body) {
        body.classList.remove("dark")
        body.setAttribute("data-theme", "light")
      }
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch (_) {
      // Ignore private mode storage quota errors
    }
  }, [theme])

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme)
  }

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"))
  }

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme,
      toggleTheme,
    }),
    [theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
