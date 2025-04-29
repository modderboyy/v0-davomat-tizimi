"use client"

import { useState } from "react"
import { useLanguage } from "../context/LanguageContext"
import { Globe } from "lucide-react"

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const toggleDropdown = () => setIsOpen(!isOpen)
  const closeDropdown = () => setIsOpen(false)

  const handleLanguageChange = (lang: "uz" | "en" | "ru") => {
    setLanguage(lang)
    closeDropdown()
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        aria-label="Change language"
      >
        <Globe className="h-5 w-5" />
        <span className="uppercase">{language}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => handleLanguageChange("uz")}
              className={`${
                language === "uz" ? "bg-gray-100 dark:bg-gray-700" : ""
              } w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700`}
              role="menuitem"
            >
              O'zbekcha
            </button>
            <button
              onClick={() => handleLanguageChange("en")}
              className={`${
                language === "en" ? "bg-gray-100 dark:bg-gray-700" : ""
              } w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700`}
              role="menuitem"
            >
              English
            </button>
            <button
              onClick={() => handleLanguageChange("ru")}
              className={`${
                language === "ru" ? "bg-gray-100 dark:bg-gray-700" : ""
              } w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700`}
              role="menuitem"
            >
              Русский
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
