"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle, AlertCircle, Info, X, Bell } from "lucide-react"

// Notification types
type NotificationType = "success" | "error" | "info"

// Notification interface
interface Notification {
  id: string
  type: NotificationType
  message: string
  duration?: number
}

// Context interface
interface DynamicIslandContextType {
  showNotification: (type: NotificationType, message: string, duration?: number) => void
  clearNotifications: () => void
}

// Create context
const DynamicIslandContext = createContext<DynamicIslandContextType | undefined>(undefined)

// Provider component
export function DynamicIslandProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [expanded, setExpanded] = useState(false)
  const [islandVisible, setIslandVisible] = useState(false)

  // Show notification
  const showNotification = useCallback((type: NotificationType, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9)
    setNotifications((prev) => [...prev, { id, type, message, duration }])
    setIslandVisible(true)
    setExpanded(true)
  }, [])

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([])
    setExpanded(false)
  }, [])

  // Auto-collapse after all notifications are processed
  useEffect(() => {
    if (notifications.length === 0) {
      setExpanded(false)
    }
  }, [notifications])

  // Auto-remove notifications after duration
  useEffect(() => {
    if (notifications.length === 0) return

    const timeouts = notifications.map((notification) => {
      return setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
      }, notification.duration)
    })

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout))
    }
  }, [notifications])

  // Always show the island with a welcome message if no notifications
  useEffect(() => {
    if (!islandVisible) {
      setIslandVisible(true)
    }
  }, [islandVisible])

  return (
    <DynamicIslandContext.Provider value={{ showNotification, clearNotifications }}>
      {children}
      <AnimatePresence>
        {islandVisible && (
          <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.6 }}
            animate={{
              y: 0,
              opacity: 1,
              scale: expanded ? 1 : 0.8,
              width: expanded ? "auto" : "60px",
              height: expanded ? "auto" : "30px",
              borderRadius: expanded ? "16px" : "20px",
            }}
            exit={{ y: -100, opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black text-white dark:bg-gray-800 shadow-lg overflow-hidden"
            onClick={() => setExpanded(!expanded)}
            style={{
              position: "fixed",
              top: "1rem",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 9999,
            }}
          >
            <div className="relative">
              {expanded ? (
                <div className="p-4 max-w-md">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <Bell className="h-5 w-5 mr-2" />
                      <span className="font-medium">Notifications</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        clearNotifications()
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`p-3 rounded-lg flex items-start ${
                            notification.type === "success"
                              ? "bg-green-900/30"
                              : notification.type === "error"
                                ? "bg-red-900/30"
                                : "bg-blue-900/30"
                          }`}
                        >
                          {notification.type === "success" ? (
                            <CheckCircle className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                          ) : notification.type === "error" ? (
                            <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                          ) : (
                            <Info className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" />
                          )}
                          <span className="text-sm">{notification.message}</span>
                        </motion.div>
                      ))
                    ) : (
                      <div className="p-3 rounded-lg flex items-start bg-blue-900/30">
                        <Info className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" />
                        <span className="text-sm">No new notifications</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full py-1 px-3">
                  <span className="animate-pulse">•••</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DynamicIslandContext.Provider>
  )
}

// Hook to use the context
export function useDynamicIsland() {
  const context = useContext(DynamicIslandContext)
  if (context === undefined) {
    throw new Error("useDynamicIsland must be used within a DynamicIslandProvider")
  }
  return context
}
