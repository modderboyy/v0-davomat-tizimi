"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "../context/LanguageContext"
import { useDynamicIsland } from "./DynamicIsland"
import { UserPlus, Check, X, Loader2, Clock } from "lucide-react"

export default function JoinRequestsManager({ companyId }: { companyId: string }) {
  const [joinRequests, setJoinRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const { t } = useLanguage()
  const { showNotification } = useDynamicIsland()
  const supabase = createClientComponentClient()

  // Fetch join requests
  const fetchJoinRequests = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("join_requests")
        .select(`
          id,
          status,
          created_at,
          users:user_id (id, name, email, lavozim)
        `)
        .eq("company_id", companyId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (error) throw error

      setJoinRequests(data || [])
    } catch (error) {
      console.error("Error fetching join requests:", error)
      showNotification("error", t("errorFetchingJoinRequests"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJoinRequests()
  }, [companyId])

  // Handle approve request
  const handleApprove = async (requestId: string, userId: string) => {
    try {
      setProcessingId(requestId)

      // Update join request status
      const { error: updateError } = await supabase
        .from("join_requests")
        .update({ status: "approved" })
        .eq("id", requestId)

      if (updateError) throw updateError

      // Update user's company_id
      const { error: userError } = await supabase.from("users").update({ company_id: companyId }).eq("id", userId)

      if (userError) throw userError

      showNotification("success", t("joinRequestApproved"))
      fetchJoinRequests()
    } catch (error) {
      console.error("Error approving join request:", error)
      showNotification("error", t("errorApprovingJoinRequest"))
    } finally {
      setProcessingId(null)
    }
  }

  // Handle reject request
  const handleReject = async (requestId: string) => {
    try {
      setProcessingId(requestId)

      const { error } = await supabase.from("join_requests").update({ status: "rejected" }).eq("id", requestId)

      if (error) throw error

      showNotification("success", t("joinRequestRejected"))
      fetchJoinRequests()
    } catch (error) {
      console.error("Error rejecting join request:", error)
      showNotification("error", t("errorRejectingJoinRequest"))
    } finally {
      setProcessingId(null)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <UserPlus className="h-6 w-6 text-indigo-600 mr-2" />
          <h2 className="text-xl font-semibold">{t("joinRequests")}</h2>
        </div>

        <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-indigo-900 dark:text-indigo-300">
          {joinRequests.length} {t("pending")}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : joinRequests.length > 0 ? (
        <div className="space-y-4">
          {joinRequests.map((request) => (
            <div
              key={request.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{request.users.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{request.users.email}</p>
                  <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(request.created_at)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleReject(request.id)}
                    className="btn btn-outline btn-sm flex items-center gap-1"
                    disabled={processingId === request.id}
                  >
                    {processingId === request.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    {t("reject")}
                  </button>

                  <button
                    onClick={() => handleApprove(request.id, request.users.id)}
                    className="btn btn-primary btn-sm flex items-center gap-1"
                    disabled={processingId === request.id}
                  >
                    {processingId === request.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                    {t("approve")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{t("noJoinRequests")}</p>
        </div>
      )}
    </div>
  )
}
