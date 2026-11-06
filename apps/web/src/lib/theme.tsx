import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "light" | "dark" | "system"
type Ctx = { theme: Theme; resolved: "light" | "dark"; setTheme: (t: Theme) => void }

const ThemeContext = createContext<Ctx | null>(null)
const KEY = "ponto-tema"
const media = () => window.matchMedia("(prefers-color-scheme: dark)")

function readStored(): Theme {
  try {
    const v = localStorage.getItem(KEY)
    return v === "light" || v === "dark" ? v : "system"
  } catch {
    return "system"
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStored)
  const [systemDark, setSystemDark] = useState(() => media().matches)
  const resolved = theme === "system" ? (systemDark ? "dark" : "light") : theme

  useEffect(() => {
    const m = media()
    const onChange = () => setSystemDark(m.matches)
    m.addEventListener("change", onChange)
    return () => m.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark")
  }, [resolved])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    try {
      localStorage.setItem(KEY, t)
    } catch {
      /* navegador sem storage */
    }
  }

  return <ThemeContext.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme fora do ThemeProvider")
  return ctx
}
