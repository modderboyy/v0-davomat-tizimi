"use client"

import type React from "react"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "../context/LanguageContext"
import { useDynamicIsland } from "./DynamicIsland"
import { Building, Loader2 } from "lucide-react"

export default function JoinCompany({ userId }: { userId: string }) {
  const [companyId, setCompanyId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { t } = useLanguage()
  const { showNotification } = useDynamicIsland()
  const supabase = createClientComponentClient()

  const handleJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!companyId.trim()) {
      setError(t("pleaseEnterCompanyId"))
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      // Check if company exists
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id, company_name")
        .eq("id", companyId)
        .single()

      if (companyError) {
        setError(t("companyNotFound"))
        return
      }

      // Check if user already has a pending request
      const { data: existingRequest, error: requestError } = await supabase
        .from("join_requests")
        .select("*")
        .eq("user_id", userId)
        .eq("company_id", companyId)
        .maybeSingle()

      if (existingRequest) {
        if (existingRequest.status === "pending") {
          setError(t("pendingRequestExists"))
          return
        } else if (existingRequest.status === "approved") {
          setError(t("alreadyJoinedCompany"))
          return
        }
      }

      // Create join request
      const { error: insertError } = await supabase.from("join_requests").insert({
        user_id: userId,
        company_id: companyId,
        status: "pending",
      })

      if (insertError) throw insertError

      setSuccess(t("joinRequestSent", { company: company.company_name }))
      showNotification("success", t("joinRequestSent", { company: company.company_name }))
      setCompanyId("")
    } catch (error) {
      console.error("Error sending join request:", error)
      setError(t("errorSendingJoinRequest"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-4">
        <Building className="h-6 w-6 text-indigo-600 mr-2" />
        <h2 className="text-xl font-semibold">{t("joinCompany")}</h2>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6">{t("joinCompanyDescription")}</p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-700 rounded-md dark:bg-green-900/30 dark:border-green-800 dark:text-green-400">
          {success}
        </div>
      )}

      <form onSubmit={handleJoinRequest} className="space-y-4">
        <div>
          <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("companyId")}
          </label>
          <input
            type="text"
            id="companyId"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="input"
            placeholder={t("enterCompanyId")}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Building className="h-5 w-5" />}
          {t("sendJoinRequest")}
        </button>
      </form>
    </div>
  )
}
