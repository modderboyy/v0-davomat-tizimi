"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "../context/LanguageContext"
import { AlertTriangle, Check, ExternalLink, X, CalendarDays } from "lucide-react"

export default function CompanyInfo({ companyId, isSubscriptionActive = true }) {
  const [companyData, setCompanyData] = useState(null)
  const [employeeCount, setEmployeeCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true)
        // Kompaniya ma'lumotlarini olish (plan ustuni ham olinadi)
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select("*") // Barcha ustunlarni oladi
          .eq("id", companyId)
          .single()

        if (companyError) throw companyError
        if (!company) throw new Error("Company not found") // Qo'shimcha tekshiruv

        // Xodimlar sonini olish
        const { count, error: countError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("is_super_admin", false)

        if (countError) throw countError

        setCompanyData(company)
        setEmployeeCount(count || 0)
      } catch (error) {
        console.error("Error fetching company data:", error)
        setCompanyData(null) // Xatolik bo'lsa, datani null qilish
      } finally {
        setLoading(false)
      }
    }

    if (companyId) {
      fetchCompanyData()
    } else {
      setLoading(false) // Agar companyId yo'q bo'lsa, loadingni to'xtatish
    }
  }, [companyId, supabase])

  // Funksiya nomini o'zgartirdik va endi 'plan' qiymatini qabul qiladi
  const getPlanName = (planValue) => {
    switch (planValue) {
      case 1:
        return t("basic")
      case 2:
        return t("premium")
      case 3:
        return t("bigplan")
      default:
        return t("basic") // Default to basic instead of free
    }
  }

  // Bu funksiya endi 'plan' qiymatiga bog'liq
  const getEmployeeLimit = (planValue) => {
    switch (planValue) {
      case 1:
        return 5
      case 2:
        return 125
      case 3:
        return "∞"
      default:
        return 25 // Default to basic limit
    }
  }

  // Bu funksiya endi 'plan' qiymatiga bog'liq
  const getFeatures = (planValue) => {
    const features = [
      { name: t("gpsTracking"), available: [1, 2, 3] },
      { name: t("basicReports"), available: [1, 2, 3] },
      { name: t("excelExports"), available: [1, 2, 3] },
      { name: t("advancedAntiSpoofing"), available: [2, 3] },
      { name: t("customPlan"), available: [3] },
    ]

    return features.map((feature) => ({
      ...feature,
      isAvailable: feature.available.includes(planValue),
    }))
  }

  if (loading) {
    return (
      <div className="card flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!companyData) {
    return (
      <div className="card p-8">
        <p className="text-center text-gray-500 dark:text-gray-400">{t("noCompanyData")}</p>
      </div>
    )
  }

  // 'plan' ustunidan qiymat olamiz, agar yo'q bo'lsa yoki null bo'lsa 1 (Basic) deb olamiz
  const planValue = companyData.plan === null || companyData.plan === undefined ? 1 : companyData.plan
  // 'subscription' ustuni endi davomiylikni (oy) bildiradi
  const subscriptionDuration = companyData.subscription // Bu null yoki undefined bo'lishi mumkin

  const planName = getPlanName(planValue)
  const employeeLimit = getEmployeeLimit(planValue)
  const features = getFeatures(planValue)

  // Subscription inactive message
  if (!isSubscriptionActive) {
    return (
      <div className="card">
        <h3 className="text-xl font-semibold mb-6">{t("company")}</h3>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                {t("subscriptionInactive")}
              </h4>
              <p className="text-yellow-700 dark:text-yellow-400">{t("subscriptionInactiveMessage")}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("companyName")}</h4>
              <p className="text-lg font-semibold">{companyData.company_name || t("notSet")}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("planLevel")}</h4>
              <div className="flex items-center">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                    planValue === 1
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                      : planValue === 2
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" // planValue === 3
                  }`}
                >
                  {planName}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                <CalendarDays className="h-4 w-4 mr-1.5" /> {t("subscriptionDuration")}
              </h4>
              <p className="text-lg font-semibold">
                {subscriptionDuration !== null && subscriptionDuration !== undefined && subscriptionDuration > 0
                  ? `${subscriptionDuration} ${t("months")}`
                  : t("notSet")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 flex flex-col sm:flex-row gap-4">
          <a
            href="#"
            className="btn btn-primary flex items-center justify-center gap-2"
            onClick={(e) => {
              e.preventDefault()
              alert("Bu funksiya hali mavjud emas.")
            }}
          >
            {t("renewSubscription")}
            <ExternalLink className="h-4 w-4" />
          </a>
          <a
            href="#"
            className="btn btn-outline flex items-center justify-center gap-2"
            onClick={(e) => {
              e.preventDefault()
              alert("Bu funksiya hali mavjud emas.")
            }}
          >
            {t("contactSupport")}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-6">{t("company")}</h3>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Chap ustun */}
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("companyName")}</h4>
            <p className="text-lg font-semibold">{companyData.company_name || t("notSet")}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("planLevel")}</h4>
            <div className="flex items-center">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                  planValue === 1
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    : planValue === 2
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" // planValue === 3
                }`}
              >
                {planName}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center">
              <CalendarDays className="h-4 w-4 mr-1.5" /> {t("subscriptionDuration")}
            </h4>
            <p className="text-lg font-semibold">
              {subscriptionDuration !== null && subscriptionDuration !== undefined && subscriptionDuration > 0
                ? `${subscriptionDuration} ${t("months")}`
                : t("notSet")}
            </p>
            {(subscriptionDuration === null || subscriptionDuration === undefined || subscriptionDuration <= 0) && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{t("durationNotSetWarning")}</p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("employeeLimit")}</h4>
            <div className="flex flex-col">
              <div className="flex items-center mb-1">
                <span className="text-lg font-semibold">
                  {employeeCount} / {employeeLimit}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{t("usedEmployees")}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className={`h-2.5 rounded-full ${
                    planValue === 1 ? "bg-blue-600" : planValue === 2 ? "bg-purple-600" : "bg-green-600" // planValue === 3
                  }`}
                  style={{
                    width: `${
                      employeeLimit === "∞" ? 100 : Math.min(100, (employeeCount / Number(employeeLimit || 1)) * 100)
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* O'ng ustun (Funksiyalar) */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t("features")}</h4>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center">
                {feature.isAvailable ? (
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                ) : (
                  <X className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    feature.isAvailable ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tugmalar */}
      <div className="mt-8 border-t pt-6 flex flex-col sm:flex-row gap-4">
        <a
          href="#"
          className="btn btn-primary flex items-center justify-center gap-2"
          onClick={(e) => {
            e.preventDefault()
            alert("Bu funksiya hali mavjud emas.")
          }}
        >
          {t("upgradeSubscription")}
          <ExternalLink className="h-4 w-4" />
        </a>
        <a
          href="#"
          className="btn btn-outline flex items-center justify-center gap-2"
          onClick={(e) => {
            e.preventDefault()
            alert("Bu funksiya hali mavjud emas.")
          }}
        >
          {t("contactSupport")}
        </a>
      </div>
    </div>
  )
}
