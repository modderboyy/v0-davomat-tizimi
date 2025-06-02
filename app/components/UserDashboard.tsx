"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "../context/LanguageContext"
import { useDynamicIsland } from "./DynamicIsland"
import JoinCompany from "./JoinCompany"
import { User, Building, Calendar } from "lucide-react"

export default function UserDashboard({ userId }: { userId: string }) {
  const [userData, setUserData] = useState(null)
  const [joinRequests, setJoinRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const { t } = useLanguage()
  const { showNotification } = useDynamicIsland()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)

        // Fetch user data
        const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

        if (userError) throw userError

        setUserData(user)

        // Fetch user's join requests
        const { data: requests, error: requestsError } = await supabase
          .from("join_requests")
          .select(`
            id,
            status,
            created_at,
            companies:company_id (id, company_name)
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        if (requestsError) throw requestsError

        setJoinRequests(requests || [])
      } catch (error) {
        console.error("Error fetching user data:", error)
        showNotification("error", t("errorFetchingData"))
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId, supabase, t, showNotification])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* User Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <User className="h-6 w-6 text-indigo-600 mr-2" />
            <h1 className="text-2xl font-bold">
              {t("welcome")}, {userData?.name}!
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("email")}</p>
              <p className="font-medium">{userData?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("position")}</p>
              <p className="font-medium">{userData?.lavozim || t("notSet")}</p>
            </div>
          </div>

          {!userData?.company_id && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-700 dark:text-blue-300 text-sm">{t("noCompanyAssigned")}</p>
            </div>
          )}
        </div>

        {/* Join Company Section */}
        {!userData?.company_id && <JoinCompany userId={userId} />}

        {/* Join Requests History */}
        {joinRequests.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <Building className="h-6 w-6 text-indigo-600 mr-2" />
              <h2 className="text-xl font-semibold">{t("joinRequestHistory")}</h2>
            </div>

            <div className="space-y-4">
              {joinRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{request.companies.company_name}</h3>
                      <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(request.created_at)}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}
                    >
                      {t(request.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Company Dashboard Link */}
        {userData?.company_id && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">{t("companyDashboard")}</h2>
                <p className="text-gray-600 dark:text-gray-400">{t("accessCompanyFeatures")}</p>
              </div>
              <a href="/dashboard" className="btn btn-primary flex items-center gap-2">
                <Building className="h-5 w-5" />
                {t("openDashboard")}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
