"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-9 h-9"></div>
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 relative"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 transition-all dark:absolute dark:opacity-0" />
      <Moon className="absolute h-5 w-5 transition-all opacity-0 dark:static dark:opacity-100" />
    </button>
  )
}
