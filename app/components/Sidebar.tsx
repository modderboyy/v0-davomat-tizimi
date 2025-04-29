"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "../context/LanguageContext"
import {
  BarChart2,
  Building,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Lock,
  LogOut,
  Menu,
  Users,
  LayoutDashboard,
} from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"

export default function Sidebar({ activeView, setView, isSubscriptionActive = true }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t } = useLanguage()
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true)
        setMobileOpen(false)
      } else {
        setMobileOpen(true)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const menuItems = [
    { id: "dashboard", icon: <LayoutDashboard />, label: t("dashboard") },
    { id: "attendance", icon: <ClipboardList />, label: t("attendance") },
    { id: "absence", icon: <Calendar />, label: t("attendanceReasons") },
    { id: "chart", icon: <BarChart2 />, label: t("charts") },
    { id: "employees", icon: <Users />, label: t("employees") },
    { id: "company", icon: <Building />, label: t("company") },
    { id: "blocked", icon: <Lock />, label: t("blocked") },
  ]

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-40 md:hidden bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md"
        onClick={toggleMobileSidebar}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && !collapsed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={toggleMobileSidebar}></div>
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${mobileOpen ? "sidebar-expanded" : "sidebar-collapsed"} ${collapsed && "sidebar-collapsed"}`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            {!collapsed && (
              <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 truncate">{t("adminPanel")}</h2>
            )}
            <button
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={toggleSidebar}
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setView(item.id)
                      if (window.innerWidth < 768) {
                        setMobileOpen(false)
                      }
                    }}
                    disabled={!isSubscriptionActive && item.id !== "company"}
                    className={`flex items-center p-2 rounded-lg w-full transition-colors ${
                      activeView === item.id
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    } ${!isSubscriptionActive && item.id !== "company" ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span className="flex items-center justify-center h-6 w-6">{item.icon}</span>
                    {!collapsed && <span className="ml-3">{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSignOut}
              className="flex items-center p-2 rounded-lg w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <span className="flex items-center justify-center h-6 w-6">
                <LogOut />
              </span>
              {!collapsed && <span className="ml-3">{t("logout")}</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
