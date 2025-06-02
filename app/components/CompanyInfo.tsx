"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "../context/LanguageContext"
import {
  AlertTriangle,
  ExternalLink,
  X,
  CalendarDays,
  Download,
  MapPin,
  Info,
  Edit2,
  Printer,
  DollarSign,
  CreditCard,
  Users,
  Clock,
} from "lucide-react"
import { useRouter } from "next/navigation"

// First, import the JoinRequestsManager component
import JoinRequestsManager from "./JoinRequestsManager"

export default function CompanyInfo({ companyId, isSubscriptionActive = true }) {
  const [companyData, setCompanyData] = useState(null)
  const [employeeCount, setEmployeeCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showUpgradePopup, setShowUpgradePopup] = useState(false)
  const [showLocationPopup, setShowLocationPopup] = useState(false)
  const [showLocationGuide, setShowLocationGuide] = useState(false)
  const [latestAppLink, setLatestAppLink] = useState(null)
  const [locationData, setLocationData] = useState(null)
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [distance, setDistance] = useState("")
  const [isNewCompany, setIsNewCompany] = useState(false)
  const [activeTab, setActiveTab] = useState("info")
  const [qrCodeData, setQrCodeData] = useState(null)
  const [loadingQRCodes, setLoadingQRCodes] = useState(false)
  const [qrCodeError, setQrCodeError] = useState("")
  const [transactions, setTransactions] = useState([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [transactionError, setTransactionError] = useState("")

  const { t } = useLanguage()
  const supabase = createClientComponentClient()
  const router = useRouter()

  // Calculate subscription status and employee limits
  const calculateSubscriptionStatus = (latestSubsDate) => {
    if (!latestSubsDate) return { isActive: false, expiresOn: null, daysLeft: 0 }

    const subsDate = new Date(latestSubsDate)
    const expiresOn = new Date(subsDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
    const now = new Date()
    const daysLeft = Math.ceil((expiresOn - now) / (24 * 60 * 60 * 1000))

    return {
      isActive: daysLeft > 0,
      expiresOn,
      daysLeft: Math.max(0, daysLeft),
    }
  }

  const calculateEmployeeLimits = (balance) => {
    const freeEmployees = 3
    const costPerEmployee = 0.8
    const additionalEmployees = Math.floor(balance / costPerEmployee)
    const totalLimit = freeEmployees + additionalEmployees

    return {
      freeEmployees,
      additionalEmployees,
      totalLimit,
      costPerEmployee,
    }
  }

  const generatePaymentToken = () => {
    // Generate a simple token (in production, use a more secure method)
    return btoa(`${companyId}_${Date.now()}_${Math.random()}`)
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 32)
  }

  const handleTopUpBalance = () => {
    const token = generatePaymentToken()
    const paymentUrl = `https://davomatpay.vercel.app/paycompany?company_id=${companyId}&token=${token}`
    window.open(paymentUrl, "_blank")
  }

  useEffect(() => {
    const fetchCompanyDataAndLink = async () => {
      setLoading(true)
      setError("")

      try {
        // 1. Fetch company data
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("id", companyId)
          .single()

        if (companyError) {
          console.error("Supabase error fetching company:", companyError)
          throw companyError
        }
        if (!company) throw new Error(t("companyNotFound"))

        // 2. Fetch employee count
        const { count, error: countError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("is_super_admin", false)

        if (countError) {
          console.error("Supabase error fetching employee count:", countError)
          throw countError
        }

        // 3. Fetch latest app link
        const { data: updateData, error: updateError } = await supabase
          .from("updates")
          .select("update_link")
          .order("number", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (updateError && updateError.code !== "PGRST116") {
          console.error("Error fetching latest update link:", updateError)
          setLatestAppLink(null)
        } else if (updateData && updateData.update_link) {
          setLatestAppLink(updateData.update_link)
        } else {
          setLatestAppLink(null)
        }

        // 4. Fetch location data
        const { data: locationData, error: locationError } = await supabase
          .from("location")
          .select("*")
          .eq("company_id", companyId)
          .maybeSingle()

        if (locationError && locationError.code !== "PGRST116") {
          console.error("Error fetching location data:", locationError)
        } else if (locationData) {
          setLocationData(locationData)
          setLatitude(locationData.latitude || "")
          setLongitude(locationData.longitude || "")
          setDistance(locationData.distance ? locationData.distance.toString() : "")
        }

        setCompanyData(company)
        setEmployeeCount(count || 0)
        setIsNewCompany(company.new || false)

        if (company.new === true && window.location.pathname !== "/setup") {
          router.push("/setup")
        }
      } catch (error) {
        console.error("Overall Error during fetch:", error)
        setError(error.message || t("errorFetchingData"))
        setCompanyData(null)
        setEmployeeCount(0)
        setLatestAppLink(null)
        setLocationData(null)
      } finally {
        setLoading(false)
      }
    }

    if (companyId) {
      fetchCompanyDataAndLink()
    } else {
      setLoading(false)
      setError(t("noCompanyIdProvided"))
      setCompanyData(null)
      setEmployeeCount(0)
      setLatestAppLink(null)
      setLocationData(null)
    }
  }, [companyId, supabase, t, router])

  // Fetch QR code data when the QR codes tab is selected
  useEffect(() => {
    const fetchQRCodes = async () => {
      if (activeTab !== "qrcodes" || !isSubscriptionActive) return

      setLoadingQRCodes(true)
      setQrCodeError("")

      try {
        const { data, error } = await supabase
          .from("qrcodes")
          .select("*")
          .eq("id", "a13f425f-9da9-43f2-86c9-0da0763110cb")
          .single()

        if (error) throw error

        if (data) {
          setQrCodeData(data)
        } else {
          setQrCodeError(t("noQRCodesFound"))
        }
      } catch (error) {
        console.error("Error fetching QR codes:", error)
        setQrCodeError(t("errorLoadingQRCodes"))
      } finally {
        setLoadingQRCodes(false)
      }
    }

    fetchQRCodes()
  }, [activeTab, isSubscriptionActive, supabase, t])

  // Fetch transactions when balance tab is selected
  useEffect(() => {
    const fetchTransactions = async () => {
      if (activeTab !== "balance") return

      setLoadingTransactions(true)
      setTransactionError("")

      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(10)

        if (error) throw error

        setTransactions(data || [])
      } catch (error) {
        console.error("Error fetching transactions:", error)
        setTransactionError(t("errorLoadingTransactions"))
      } finally {
        setLoadingTransactions(false)
      }
    }

    fetchTransactions()
  }, [activeTab, companyId, supabase, t])

  const handleDownloadQRCode = (qrCodeUrl, label) => {
    const link = document.createElement("a")
    link.href = qrCodeUrl
    link.download = `${label}_qrcode.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrintQRCode = (qrCodeUrl, label) => {
    const printWindow = window.open("", "_blank")

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${label} QR Code</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                font-family: Arial, sans-serif;
              }
              .container {
                text-align: center;
              }
              h2 {
                margin-bottom: 20px;
              }
              img {
                max-width: 300px;
                height: auto;
              }
              @media print {
                button {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>${label}</h2>
              <img src="${qrCodeUrl}" alt="${label} QR Code" />
              <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background-color: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer;">
                ${t("printQRCode")}
              </button>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const showRenewalPopup = () => {
    setShowUpgradePopup(true)
    setError("")
  }

  const handleClosePopup = () => {
    setShowUpgradePopup(false)
    setError("")
  }

  const handleOpenLocationPopup = () => {
    setShowLocationPopup(true)
  }

  const handleCloseLocationPopup = () => {
    setShowLocationPopup(false)
    if (locationData) {
      setLatitude(locationData.latitude || "")
      setLongitude(locationData.longitude || "")
      setDistance(locationData.distance ? locationData.distance.toString() : "")
    }
  }

  const handleOpenLocationGuide = () => {
    setShowLocationGuide(true)
  }

  const handleCloseLocationGuide = () => {
    setShowLocationGuide(false)
  }

  const handleDownloadClick = () => {
    if (latestAppLink) {
      console.log("Opening download link:", latestAppLink)
      window.open(latestAppLink, "_blank")
    } else {
      setError(t("downloadLinkNotAvailableMessage"))
      console.error("Download link is not available.")
    }
  }

  const handleSaveLocation = async () => {
    try {
      const latNum = Number.parseFloat(latitude)
      const lonNum = Number.parseFloat(longitude)
      const distNum = Number.parseInt(distance, 10)

      if (isNaN(latNum) || isNaN(lonNum)) {
        setError(t("invalidCoordinates"))
        return
      }

      if (isNaN(distNum) || distNum <= 0) {
        setError(t("invalidDistance"))
        return
      }

      const locationObject = {
        company_id: companyId,
        latitude: latNum,
        longitude: lonNum,
        distance: distNum,
      }

      let result
      if (locationData?.id) {
        result = await supabase.from("location").update(locationObject).eq("id", locationData.id)
      } else {
        result = await supabase.from("location").insert(locationObject)
      }

      if (result.error) {
        throw result.error
      }

      const { data: newLocationData, error: fetchError } = await supabase
        .from("location")
        .select("*")
        .eq("company_id", companyId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      setLocationData(newLocationData)
      setShowLocationPopup(false)
      setError("")
      alert(t("locationSavedSuccessfully"))
    } catch (error) {
      console.error("Error saving location:", error)
      setError(t("errorSavingLocation"))
    }
  }

  if (loading) {
    return (
      <div className="card flex items-center justify-center p-8 min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error && !companyData) {
    return (
      <div className="card p-8">
        <p className="text-center text-red-500 dark:text-red-400">{error}</p>
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

  // Calculate subscription and employee limits based on new logic
  const subscriptionStatus = calculateSubscriptionStatus(companyData.latest_subs_date)
  const employeeLimits = calculateEmployeeLimits(companyData.balance || 0)
  const balance = companyData.balance || 0

  // Check if employees should be disabled due to insufficient balance
  const requiredBalance = Math.max(0, (employeeCount - employeeLimits.freeEmployees) * employeeLimits.costPerEmployee)
  const employeesDisabled = !subscriptionStatus.isActive || balance < requiredBalance

  const renderSubscriptionInactiveMessage = () => (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
            {subscriptionStatus.isActive ? t("insufficientBalance") : t("subscriptionExpired")}
          </h4>
          <p className="text-yellow-700 dark:text-yellow-400">
            {subscriptionStatus.isActive ? t("employeesDisabled") : t("subscriptionInactiveMessage")}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-6">{t("company")}</h3>

      {error && !showUpgradePopup && !showLocationPopup && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {employeesDisabled && renderSubscriptionInactiveMessage()}

      {/* Tab buttons */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === "info"
              ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("info")}
        >
          {t("companyInfo")}
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === "balance"
              ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("balance")}
        >
          {t("balance")}
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === "location"
              ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("location")}
        >
          {t("location")}
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === "qrcodes"
              ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("qrcodes")}
        >
          {t("qrCodes")}
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === "joinRequests"
              ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("joinRequests")}
        >
          {t("joinRequests")}
        </button>
      </div>

      {/* Info Tab Content */}
      {activeTab === "info" && (
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("companyName")}</h4>
              <p className="text-lg font-semibold">{companyData.company_name || t("notSet")}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                <CalendarDays className="h-4 w-4 mr-1.5" /> {t("subscriptionExpiresOn")}
              </h4>
              <p className="text-lg font-semibold">
                {subscriptionStatus.expiresOn ? subscriptionStatus.expiresOn.toLocaleDateString() : t("notSet")}
              </p>
              <p className={`text-sm ${subscriptionStatus.isActive ? "text-green-600" : "text-red-600"}`}>
                {subscriptionStatus.isActive
                  ? `${subscriptionStatus.daysLeft} ${t("daysLeft")}`
                  : t("subscriptionExpired")}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("employeeLimit")}</h4>
              <div className="flex flex-col">
                <div className="flex items-center mb-1">
                  <span className="text-lg font-semibold">
                    {employeeCount} / {employeeLimits.totalLimit}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{t("usedEmployees")}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {employeeLimits.freeEmployees} {t("freeEmployees")} + {employeeLimits.additionalEmployees}{" "}
                  {t("additionalEmployees")} (${employeeLimits.costPerEmployee} {t("perEmployee")})
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="h-2.5 rounded-full bg-indigo-600"
                    style={{
                      width: `${Math.min(100, (employeeCount / employeeLimits.totalLimit) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t("balanceInfo")}</h4>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">${balance.toFixed(2)}</span>
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t("currentBalance")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Balance Tab Content */}
      {activeTab === "balance" && (
        <div className="space-y-6">
          {/* Balance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">{t("balance")}</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">${balance.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{t("employeeLimit")}</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{employeeLimits.totalLimit}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {employeeLimits.freeEmployees} + {employeeLimits.additionalEmployees}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {t("subscriptionExpiresOn")}
                  </p>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                    {subscriptionStatus.daysLeft} {t("daysLeft")}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Top Up Button */}
          <div className="flex justify-center">
            <button onClick={handleTopUpBalance} className="btn btn-primary flex items-center gap-2 px-8 py-3 text-lg">
              <CreditCard className="h-5 w-5" />
              {t("topUpBalance")}
            </button>
          </div>

          {/* Transactions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold">{t("transactions")}</h4>
            </div>

            {loadingTransactions ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">{t("loadingTransactions")}</span>
              </div>
            ) : transactionError ? (
              <div className="p-6">
                <p className="text-red-600 dark:text-red-400">{transactionError}</p>
              </div>
            ) : transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("date")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("description")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("amount")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {transaction.description || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={transaction.type === "credit" ? "text-green-600" : "text-red-600"}>
                            {transaction.type === "credit" ? "+" : "-"}${Math.abs(transaction.amount).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.status === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : transaction.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {t(transaction.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">{t("noTransactions")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location Tab Content */}
      {activeTab === "location" && (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">{t("locationImportanceMessage")}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-indigo-500" />
              {t("companyLocation")}
            </h4>

            {locationData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("latitude")}</h5>
                    <p className="text-lg font-mono">{locationData.latitude}</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("longitude")}</h5>
                    <p className="text-lg font-mono">{locationData.longitude}</p>
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("workingRadius")}</h5>
                  <p className="text-lg">
                    {locationData.distance} {t("meters")}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button
                    onClick={handleOpenLocationPopup}
                    className="btn btn-primary flex items-center justify-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    {t("editLocation")}
                  </button>
                  <button
                    onClick={handleOpenLocationGuide}
                    className="btn btn-outline flex items-center justify-center gap-2"
                  >
                    <Info className="h-4 w-4" />
                    {t("locationGuide")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">{t("noLocationSet")}</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleOpenLocationPopup}
                    className="btn btn-primary flex items-center justify-center gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    {t("setLocation")}
                  </button>
                  <button
                    onClick={handleOpenLocationGuide}
                    className="btn btn-outline flex items-center justify-center gap-2"
                  >
                    <Info className="h-4 w-4" />
                    {t("locationGuide")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Join Requests Tab Content */}
      {activeTab === "joinRequests" && (
        <div className="space-y-6">
          <JoinRequestsManager companyId={companyId} />
        </div>
      )}

      {/* QR Codes Tab Content */}
      {activeTab === "qrcodes" && (
        <div className="space-y-6">
          {employeesDisabled ? (
            renderSubscriptionInactiveMessage()
          ) : loadingQRCodes ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">{t("loadingQRCodes")}</span>
            </div>
          ) : qrCodeError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-400">{qrCodeError}</p>
            </div>
          ) : qrCodeData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Kelish QR Code */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-center">{t("arrivalQRCode")}</h3>
                <div className="flex flex-col items-center">
                  {qrCodeData.kelish_qrcode && (
                    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeData.kelish_qrcode)}`}
                        alt="Kelish QR Code"
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() =>
                        handleDownloadQRCode(
                          `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData.kelish_qrcode)}`,
                          "Kelish",
                        )
                      }
                      className="btn btn-primary flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {t("downloadQRCode")}
                    </button>
                    <button
                      onClick={() =>
                        handlePrintQRCode(
                          `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData.kelish_qrcode)}`,
                          t("arrivalQRCode"),
                        )
                      }
                      className="btn btn-outline flex items-center gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      {t("printQRCode")}
                    </button>
                  </div>
                </div>
              </div>

              {/* Ketish QR Code */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-center">{t("departureQRCode")}</h3>
                <div className="flex flex-col items-center">
                  {qrCodeData.ketish_qrcode && (
                    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeData.ketish_qrcode)}`}
                        alt="Ketish QR Code"
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() =>
                        handleDownloadQRCode(
                          `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData.ketish_qrcode)}`,
                          "Ketish",
                        )
                      }
                      className="btn btn-primary flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {t("downloadQRCode")}
                    </button>
                    <button
                      onClick={() =>
                        handlePrintQRCode(
                          `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData.ketish_qrcode)}`,
                          t("departureQRCode"),
                        )
                      }
                      className="btn btn-outline flex items-center gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      {t("printQRCode")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-700 dark:text-yellow-400">{t("noQRCodesFound")}</p>
            </div>
          )}
        </div>
      )}

      {/* Tugmalar */}
      <div className="mt-8 border-t pt-6 flex flex-col sm:flex-row gap-4">
        <button onClick={showRenewalPopup} className="btn btn-primary flex items-center justify-center gap-2">
          {t("renewSubscription")}
          <ExternalLink className="h-4 w-4" />
        </button>
        <a
          href="https://t.me/modderboy"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline flex items-center justify-center gap-2"
        >
          {t("contactSupport")}
        </a>
      </div>

      {/* === Upgrade/Renew Popup === */}
      {showUpgradePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm relative animate-fade-in-up">
            <button
              onClick={handleClosePopup}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label={t("close")}
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t("renewSubscriptionTitle")}
            </h3>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">{t("renewSubscriptionMessage")}</p>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {latestAppLink ? (
              <button
                onClick={handleDownloadClick}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <Download className="h-5 w-5" />
                {t("downloadAppButton")}
              </button>
            ) : (
              <p className="text-sm text-yellow-700 dark:text-yellow-400 text-center">
                {t("downloadLinkNotAvailableMessage")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* === Location Popup === */}
      {showLocationPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative animate-fade-in-up">
            <button
              onClick={handleCloseLocationPopup}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label={t("close")}
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {locationData ? t("editLocation") : t("setLocation")}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("latitude")}
                </label>
                <input
                  type="text"
                  id="latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="input"
                  placeholder="41.2995"
                />
              </div>

              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("longitude")}
                </label>
                <input
                  type="text"
                  id="longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="input"
                  placeholder="69.2401"
                />
              </div>

              <div>
                <label htmlFor="distance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("workingRadius")} ({t("meters")})
                </label>
                <input
                  type="number"
                  id="distance"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="input"
                  placeholder="100"
                  min="1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("distanceDescription")}</p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={handleCloseLocationPopup} className="btn btn-outline">
                  {t("cancel")}
                </button>
                <button onClick={handleSaveLocation} className="btn btn-primary">
                  {t("save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === Location Guide Popup === */}
      {showLocationGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative animate-fade-in-up">
            <button
              onClick={handleCloseLocationGuide}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label={t("close")}
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t("locationGuide")}</h3>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">{t("locationGuideImportance")}</p>
              </div>

              <h4 className="font-medium text-gray-900 dark:text-gray-100">{t("howToGetCoordinates")}</h4>

              <ol className="list-decimal pl-5 space-y-3 text-gray-700 dark:text-gray-300">
                <li>{t("locationGuideStep1")}</li>
                <li>{t("locationGuideStep2")}</li>
                <li>{t("locationGuideStep3")}</li>
                <li>{t("locationGuideStep4")}</li>
                <li>{t("locationGuideStep5")}</li>
              </ol>

              <div className="mt-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{t("aboutWorkingRadius")}</h4>
                <p className="text-gray-700 dark:text-gray-300">{t("workingRadiusExplanation")}</p>
              </div>

              <div className="flex justify-end mt-4">
                <button onClick={handleCloseLocationGuide} className="btn btn-primary">
                  {t("understood")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
