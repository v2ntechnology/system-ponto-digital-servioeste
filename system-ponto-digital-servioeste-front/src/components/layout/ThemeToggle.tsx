import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/lib/theme"

export function ThemeToggle() {
  const { resolved, setTheme } = useTheme()
  const next = resolved === "dark" ? "light" : "dark"
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(next)} aria-label={`Mudar para tema ${next === "dark" ? "escuro" : "claro"}`}>
      {resolved === "dark" ? <Sun /> : <Moon />}
    </Button>
  )
}
