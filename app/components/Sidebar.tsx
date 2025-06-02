"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "../context/LanguageContext"
import {
  BarChart2,
  Building,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Lock,
  LogOut,
  Menu,
  Users,
  LayoutDashboard,
  DollarSign,
  MapPin,
  QrCode,
  Archive,
  X,
} from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export default function Sidebar({ activeView, setView, isSubscriptionActive = true }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    attendance: false,
    employees: false,
    company: false,
    analytics: false,
  })
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

  const toggleSection = (section: string) => {
    if (collapsed) return
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleViewChange = (viewId: string) => {
    setView(viewId)
    if (window.innerWidth < 768) {
      setMobileOpen(false)
    }
  }

  const menuSections = [
    {
      id: "main",
      items: [{ id: "dashboard", icon: <LayoutDashboard />, label: t("dashboard") }],
    },
    {
      id: "attendance",
      label: t("attendanceManagement"),
      icon: <ClipboardList />,
      expandable: true,
      items: [
        { id: "attendance", icon: <ClipboardList />, label: t("attendance") },
        { id: "absence", icon: <Calendar />, label: t("attendanceReasons") },
        { id: "blocked", icon: <Lock />, label: t("blocked") },
      ],
    },
    {
      id: "employees",
      label: t("employeeManagement"),
      icon: <Users />,
      expandable: true,
      items: [
        { id: "employees", icon: <Users />, label: t("employees") },
        { id: "archived", icon: <Archive />, label: t("archivedEmployees") },
      ],
    },
    {
      id: "finance",
      label: t("financeManagement"),
      icon: <DollarSign />,
      expandable: true,
      items: [{ id: "balance", icon: <DollarSign />, label: t("balance") }],
    },
    {
      id: "analytics",
      label: t("analytics"),
      icon: <BarChart2 />,
      expandable: true,
      items: [{ id: "chart", icon: <BarChart2 />, label: t("charts") }],
    },
    {
      id: "company",
      label: t("companySettings"),
      icon: <Building />,
      expandable: true,
      items: [
        { id: "company", icon: <Building />, label: t("companyInfo") },
        { id: "location", icon: <MapPin />, label: t("location") },
        { id: "qrcodes", icon: <QrCode />, label: t("qrCodes") },
      ],
    },
  ]

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-40 lg:hidden bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
        onClick={toggleMobileSidebar}
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && !collapsed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={toggleMobileSidebar}></div>
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: collapsed ? "80px" : "280px",
          x: mobileOpen || window.innerWidth >= 1024 ? 0 : collapsed ? -80 : -280,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-xl z-40 border-r border-gray-200 dark:border-gray-700 overflow-hidden`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            {!collapsed && (
              <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold truncate">
                {t("adminPanel")}
              </motion.h2>
            )}
            <button
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              onClick={toggleSidebar}
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
            {menuSections.map((section) => (
              <div key={section.id}>
                {section.expandable ? (
                  <div>
                    {/* Section Header */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      disabled={!isSubscriptionActive && section.id !== "company"}
                      className={`flex items-center justify-between p-3 rounded-lg w-full transition-all duration-200 ${
                        !isSubscriptionActive && section.id !== "company"
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="flex items-center justify-center h-6 w-6 text-indigo-600 dark:text-indigo-400">
                          {section.icon}
                        </span>
                        {!collapsed && <span className="ml-3 font-medium">{section.label}</span>}
                      </div>
                      {!collapsed && (
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${expandedSections[section.id] ? "rotate-180" : ""}`}
                        />
                      )}
                    </button>

                    {/* Section Items */}
                    <AnimatePresence>
                      {(expandedSections[section.id] || collapsed) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className={collapsed ? "space-y-1" : "ml-6 mt-2 space-y-1"}
                        >
                          {section.items.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleViewChange(item.id)}
                              disabled={!isSubscriptionActive && section.id !== "company"}
                              className={`flex items-center p-2 rounded-lg w-full transition-all duration-200 ${
                                activeView === item.id
                                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 shadow-sm"
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                              } ${!isSubscriptionActive && section.id !== "company" ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <span className="flex items-center justify-center h-5 w-5">{item.icon}</span>
                              {!collapsed && <span className="ml-3 text-sm">{item.label}</span>}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  // Non-expandable items
                  section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleViewChange(item.id)}
                      className={`flex items-center p-3 rounded-lg w-full transition-all duration-200 ${
                        activeView === item.id
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 shadow-sm"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <span className="flex items-center justify-center h-6 w-6 text-indigo-600 dark:text-indigo-400">
                        {item.icon}
                      </span>
                      {!collapsed && <span className="ml-3 font-medium">{item.label}</span>}
                    </button>
                  ))
                )}
              </div>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSignOut}
              className="flex items-center p-3 rounded-lg w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
            >
              <span className="flex items-center justify-center h-6 w-6">
                <LogOut />
              </span>
              {!collapsed && <span className="ml-3 font-medium">{t("logout")}</span>}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
