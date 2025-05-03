"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "../context/LanguageContext"
import {
  AlertTriangle,
  Check,
  ExternalLink,
  X,
  CalendarDays,
  Download,
  MapPin,
  Info,
  Edit2,
  Printer,
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function CompanyInfo({ companyId, isSubscriptionActive = true }) {
  const [companyData, setCompanyData] = useState(null)
  const [employeeCount, setEmployeeCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("") // Fetch va popup ichidagi xatolar uchun umumiy state
  const [showUpgradePopup, setShowUpgradePopup] = useState(false) // Popup ko'rsatish state'i
  const [showLocationPopup, setShowLocationPopup] = useState(false) // Joylashuv popup state'i
  const [showLocationGuide, setShowLocationGuide] = useState(false) // Joylashuv qo'llanmasi popup state'i
  const [latestAppLink, setLatestAppLink] = useState(null) // Eng so'nggi app linki uchun state
  const [locationData, setLocationData] = useState(null) // Joylashuv ma'lumotlari
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [distance, setDistance] = useState("")
  const [isNewCompany, setIsNewCompany] = useState(false)
  const [activeTab, setActiveTab] = useState("info") // "info" yoki "location"
  const [qrCodeData, setQrCodeData] = useState(null)
  const [loadingQRCodes, setLoadingQRCodes] = useState(false)
  const [qrCodeError, setQrCodeError] = useState("")

  const { t } = useLanguage()
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const fetchCompanyDataAndLink = async () => {
      setLoading(true)
      setError("") // Fetch boshlanishida xatoni tozalash

      try {
        // 1. Kompaniya ma'lumotlarini olish (plan va subscription ustunlari ham olinadi)
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select("*") // Barcha ustunlarni oladi
          .eq("id", companyId)
          .single()

        if (companyError) {
          console.error("Supabase error fetching company:", companyError)
          throw companyError // Xato qaytarsa, keyingi qadamlarni to'xtatish
        }
        if (!company) throw new Error(t("companyNotFound")) // Qo'shimcha tekshiruv, translationga o'tkazildi

        // 2. Xodimlar sonini olish
        const { count, error: countError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("is_super_admin", false) // Faqat xodimlarni hisoblash

        if (countError) {
          console.error("Supabase error fetching employee count:", countError)
          throw countError // Xato qaytarsa, keyingi qadamlarni to'xtatish
        }

        // 3. Eng so'nggi dastur yuklab olish linkini olish
        // maybeSingle() ishlatamiz, chunki 'updates' jadvali bo'sh bo'lishi mumkin
        const { data: updateData, error: updateError } = await supabase
          .from("updates")
          .select("update_link")
          .order("number", { ascending: false }) // 'number' ustuni bo'yicha kamayish tartibida
          .limit(1) // Eng birinchi (eng katta number) qatorni olish
          .maybeSingle() // Faqat bitta natija kutiladi, topilmasa null qaytaradi

        // updateError.code === "PGRST116" - bu "no rows found" degani, bu holda xato emas
        if (updateError && updateError.code !== "PGRST116") {
          console.error("Error fetching latest update link:", updateError)
          // Linkni null qoldiramiz, lekin asosiy ma'lumotlar yuklandi, shuning uchun umumiy xato stateiga yozmaymiz
          setLatestAppLink(null)
        } else if (updateData && updateData.update_link) {
          setLatestAppLink(updateData.update_link) // Link topilsa saqlash
        } else {
          setLatestAppLink(null) // Link topilmasa null qilish
        }

        // 4. Joylashuv ma'lumotlarini olish
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

        // Hamma ma'lumotlar muvaffaqiyatli olindi
        setCompanyData(company)
        setEmployeeCount(count || 0)
        setIsNewCompany(company.new || false)

        // Agar yangi kompaniya bo'lsa va setup sahifasida bo'lmasa, setup sahifasiga yo'naltirish
        if (company.new === true && window.location.pathname !== "/setup") {
          router.push("/setup")
        }
      } catch (error) {
        console.error("Overall Error during fetch:", error)
        // Xatolik ro'y bersa, barcha datani null/0 qilish va xato xabarini saqlash
        setError(error.message || t("errorFetchingData"))
        setCompanyData(null)
        setEmployeeCount(0)
        setLatestAppLink(null) // Fetch xatosida linkni ham null qilish
        setLocationData(null)
      } finally {
        setLoading(false)
      }
    }

    if (companyId) {
      fetchCompanyDataAndLink()
    } else {
      setLoading(false) // Agar companyId yo'q bo'lsa, loadingni to'xtatish
      setError(t("noCompanyIdProvided")) // companyId yo'q bo'lsa xato berish
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

  const handleDownloadQRCode = (qrCodeUrl, label) => {
    // Create a temporary link element
    const link = document.createElement("a")
    link.href = qrCodeUrl
    link.download = `${label}_qrcode.png`

    // Append to the document, click it, and remove it
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

  // Funksiya nomini o'zgartirdik va endi 'plan' qiymatini qabul qiladi
  const getPlanName = (planValue) => {
    switch (planValue) {
      case 1:
        return t("basic")
      case 2:
        return t("premium")
      case 3:
        return t("bigplan") // plans/bigplan
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
        return "∞" // Infinity
      default:
        return 5 // Default to basic limit
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
      { name: t("avatarUpload"), available: [2, 3] }, // Added avatar upload feature for premium plans
    ]

    return features.map((feature) => ({
      ...feature,
      isAvailable: feature.available.includes(planValue),
    }))
  }

  // Popupni ochish funksiyasi
  const showRenewalPopup = () => {
    setShowUpgradePopup(true)
    setError("") // Clear any previous errors
  }

  // Popupni yopish funksiyasi
  const handleClosePopup = () => {
    setShowUpgradePopup(false)
    setError("") // Popup yopilganda xatoni tozalash
  }

  // Joylashuv popupni ochish
  const handleOpenLocationPopup = () => {
    setShowLocationPopup(true)
  }

  // Joylashuv popupni yopish
  const handleCloseLocationPopup = () => {
    setShowLocationPopup(false)
    // Agar o'zgarishlar saqlanmagan bo'lsa, eski qiymatlarni qaytarish
    if (locationData) {
      setLatitude(locationData.latitude || "")
      setLongitude(locationData.longitude || "")
      setDistance(locationData.distance ? locationData.distance.toString() : "")
    }
  }

  // Joylashuv qo'llanmasi popupni ochish
  const handleOpenLocationGuide = () => {
    setShowLocationGuide(true)
  }

  // Joylashuv qo'llanmasi popupni yopish
  const handleCloseLocationGuide = () => {
    setShowLocationGuide(false)
  }

  // Yuklab olish tugmasi bosilganda
  const handleDownloadClick = () => {
    if (latestAppLink) {
      console.log("Opening download link:", latestAppLink)
      window.open(latestAppLink, "_blank") // Linkni yangi tabda ochish
    } else {
      // Agar link topilmagan bo'lsa, xato ko'rsatish (popup ichida)
      setError(t("downloadLinkNotAvailableMessage"))
      console.error("Download link is not available.")
    }
  }

  // Joylashuv ma'lumotlarini saqlash
  const handleSaveLocation = async () => {
    try {
      // Latitude va longitude raqam ekanligini tekshirish
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
        // Mavjud joylashuvni yangilash
        result = await supabase.from("location").update(locationObject).eq("id", locationData.id)
      } else {
        // Yangi joylashuv yaratish
        result = await supabase.from("location").insert(locationObject)
      }

      if (result.error) {
        throw result.error
      }

      // Ma'lumotlarni yangilash
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

  // Agar loading tugadi, error mavjud va companyData yo'q bo'lsa (ma'lumot yuklash umuman muvaffaqiyatsiz bo'ldi)
  // Bu holatda faqat xato xabarini ko'rsatamiz.
  if (error && !companyData) {
    return (
      <div className="card p-8">
        <p className="text-center text-red-500 dark:text-red-400">{error}</p>
      </div>
    )
  }

  // Agar loading tugadi, error yo'q, lekin companyData ham yo'q (bu companyId mavjud emasligini tekshirgandagi holat bo'lishi mumkin)
  // Yuqoridagi shart error bo'lganda ishlaydi. Bu shart esa error *yo'q* bo'lganda companyData mavjud emasligini tekshiradi.
  // companyId null bo'lganda setError set qilinadi, shuning uchun bu blokga tushish kamdan-kam holat.
  // Lekin ehtiyot chorasi sifatida qoldirildi.
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

  const renderSubscriptionInactiveMessage = () => (
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
  )

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-6">{t("company")}</h3>

      {/* General Error message (asosan initial fetch xatosi uchun) */}
      {/* Agar popup ochiq bo'lsa, errorni asosiy sahifada ko'rsatmaymiz, chunki u popup ichida ko'rinadi */}
      {error && !showUpgradePopup && !showLocationPopup && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Obuna faol emasligi haqida xabar */}
      {!isSubscriptionActive && renderSubscriptionInactiveMessage()}

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
      </div>

      {/* Info Tab Content */}
      {activeTab === "info" && (
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
                    {employeeCount} / {employeeLimit === "∞" ? "∞" : employeeLimit}
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
      {/* QR Codes Tab Content */}
      {activeTab === "qrcodes" && (
        <div className="space-y-6">
          {!isSubscriptionActive ? (
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
        {/* Tugma endi popupni ochadi */}
        {/* isSubscriptionActive false bo'lsa 'renew' matni, aks holda 'upgrade' matni */}
        <button onClick={showRenewalPopup} className="btn btn-primary flex items-center justify-center gap-2">
          {isSubscriptionActive ? t("upgradeSubscription") : t("renewSubscription")}
          <ExternalLink className="h-4 w-4" /> {/* Bu icon pop upga olib borishni bildiradi */}
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
      {/* Popup ko'rsatish showUpgradePopup state'iga bog'liq */}
      {showUpgradePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm relative animate-fade-in-up">
            {/* Close button */}
            <button
              onClick={handleClosePopup}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label={t("close")}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Popup Content */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t("renewSubscriptionTitle")}
            </h3>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">{t("renewSubscriptionMessage")}</p>

            {/* Error message within popup (specifically for download link issue) */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Download Button */}
            {/* Link mavjud bo'lgandagina tugmani ko'rsatish */}
            {latestAppLink ? (
              <button
                onClick={handleDownloadClick}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <Download className="h-5 w-5" />
                {t("downloadAppButton")}
              </button>
            ) : (
              // Agar link topilmagan bo'lsa, boshqa xabar ko'rsatish
              <p className="text-sm text-yellow-700 dark:text-yellow-400 text-center">
                {t("downloadLinkNotAvailableMessage")} {/* Yangi translation key */}
              </p>
            )}
          </div>
        </div>
      )}
      {/* === End Upgrade/Renew Popup === */}

      {/* === Location Popup === */}
      {showLocationPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative animate-fade-in-up">
            {/* Close button */}
            <button
              onClick={handleCloseLocationPopup}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label={t("close")}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Popup Content */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {locationData ? t("editLocation") : t("setLocation")}
            </h3>

            {/* Error message */}
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
      {/* === End Location Popup === */}

      {/* === Location Guide Popup === */}
      {showLocationGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative animate-fade-in-up">
            {/* Close button */}
            <button
              onClick={handleCloseLocationGuide}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label={t("close")}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Popup Content */}
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
      {/* === End Location Guide Popup === */}
    </div>
  )
}
