"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "../context/LanguageContext"
import { useDynamicIsland } from "./DynamicIsland"
import { Users, Plus, MessageSquare, Settings, Send, Paperclip } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function TeamSpaces({ companyId }) {
  const [spaces, setSpaces] = useState([])
  const [selectedSpace, setSelectedSpace] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [showCreateSpace, setShowCreateSpace] = useState(false)
  const [newSpace, setNewSpace] = useState({ name: "", description: "", color: "#6366F1", isPrivate: false })
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  const { t } = useLanguage()
  const { showNotification } = useDynamicIsland()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchSpaces()
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (selectedSpace) {
      fetchMessages()
      const subscription = supabase
        .channel(`team_messages:${selectedSpace.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "team_messages",
            filter: `space_id=eq.${selectedSpace.id}`,
          },
          () => {
            fetchMessages()
          },
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [selectedSpace])

  const fetchSpaces = async () => {
    try {
      const { data, error } = await supabase
        .from("team_spaces")
        .select("*, team_space_members(*)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setSpaces(data || [])
    } catch (error) {
      console.error("Error fetching spaces:", error)
      showNotification("error", t("errorFetchingSpaces"))
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("company_id", companyId)
        .eq("is_super_admin", false)
        .eq("archived", false)

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error("Error fetching employees:", error)
    }
  }

  const fetchMessages = async () => {
    if (!selectedSpace) return

    try {
      const { data, error } = await supabase
        .from("team_messages")
        .select("*, users:user_id(name)")
        .eq("space_id", selectedSpace.id)
        .order("created_at", { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
      showNotification("error", t("errorFetchingMessages"))
    }
  }

  const createSpace = async () => {
    try {
      const { data, error } = await supabase
        .from("team_spaces")
        .insert({
          company_id: companyId,
          name: newSpace.name,
          description: newSpace.description,
          color: newSpace.color,
          is_private: newSpace.isPrivate,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single()

      if (error) throw error

      // Add creator as admin member
      await supabase.from("team_space_members").insert({
        space_id: data.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        role: "admin",
      })

      setSpaces([data, ...spaces])
      setNewSpace({ name: "", description: "", color: "#6366F1", isPrivate: false })
      setShowCreateSpace(false)
      showNotification("success", t("spaceCreatedSuccessfully"))
    } catch (error) {
      console.error("Error creating space:", error)
      showNotification("error", t("errorCreatingSpace"))
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSpace) return

    try {
      const { error } = await supabase.from("team_messages").insert({
        space_id: selectedSpace.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        message: newMessage,
        message_type: "text",
      })

      if (error) throw error

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      showNotification("error", t("errorSendingMessage"))
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-200px)] flex">
      {/* Spaces Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("teamSpaces")}
            </h3>
            <button
              onClick={() => setShowCreateSpace(true)}
              className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {spaces.map((space) => (
            <motion.div
              key={space.id}
              whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.1)" }}
              onClick={() => setSelectedSpace(space)}
              className={`p-4 cursor-pointer border-b border-gray-200 dark:border-gray-700 ${
                selectedSpace?.id === space.id ? "bg-indigo-50 dark:bg-indigo-900/20" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: space.color }} />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{space.name}</h4>
                  <p className="text-sm text-gray-500 truncate">{space.description}</p>
                </div>
                <div className="text-xs text-gray-400">
                  {space.team_space_members?.length || 0} {t("members")}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedSpace ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedSpace.color }} />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{selectedSpace.name}</h3>
                    <p className="text-sm text-gray-500">{selectedSpace.description}</p>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Settings className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                    {message.users?.name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{message.users?.name}</span>
                      <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                      <p className="text-gray-900 dark:text-white">{message.message}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Paperclip className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder={t("typeMessage")}
                  className="flex-1 input"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t("selectTeamSpace")}</h3>
              <p className="text-gray-500">{t("chooseSpaceToStartChatting")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Space Modal */}
      <AnimatePresence>
        {showCreateSpace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold mb-4">{t("createTeamSpace")}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("spaceName")}</label>
                  <input
                    type="text"
                    value={newSpace.name}
                    onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                    className="input"
                    placeholder={t("enterSpaceName")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("description")}</label>
                  <textarea
                    value={newSpace.description}
                    onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
                    className="input h-20"
                    placeholder={t("spaceDescription")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("color")}</label>
                  <input
                    type="color"
                    value={newSpace.color}
                    onChange={(e) => setNewSpace({ ...newSpace, color: e.target.value })}
                    className="w-full h-10 rounded border border-gray-300"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={newSpace.isPrivate}
                    onChange={(e) => setNewSpace({ ...newSpace, isPrivate: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600"
                  />
                  <label htmlFor="isPrivate" className="ml-2 text-sm">
                    {t("privateSpace")}
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowCreateSpace(false)} className="btn btn-outline">
                  {t("cancel")}
                </button>
                <button onClick={createSpace} className="btn btn-primary">
                  {t("createSpace")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
