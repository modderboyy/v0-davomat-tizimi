"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "../context/LanguageContext"
import { AlertTriangle, Check, ExternalLink, X, CalendarDays, Download } from "lucide-react"

export default function CompanyInfo({ companyId, isSubscriptionActive = true }) { // openAndroidApp prop olib tashlandi, chunki endi to'g'ridan-to'g'ri ishlatilmaydi
  const [companyData, setCompanyData] = useState(null)
  const [employeeCount, setEmployeeCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("") // Fetch uchun ham error state qo'shildi
  const [showUpgradePopup, setShowUpgradePopup] = useState(false) // Popup ko'rsatish state'i
  const [latestAppLink, setLatestAppLink] = useState(null) // Eng so'nggi app linki uchun state

  const { t } = useLanguage()
  const supabase = createClientComponentClient()

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

        if (companyError) throw companyError
        if (!company) throw new Error(t("companyNotFound")) // Translationga o'tkazildi

        // 2. Xodimlar sonini olish
        const { count, error: countError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("is_super_admin", false) // Faqat xodimlarni hisoblash

        if (countError) throw countError

        // 3. Eng so'nggi dastur yuklab olish linkini olish
        const { data: updateData, error: updateError } = await supabase
          .from("updates")
          .select("update_link")
          .order("number", { ascending: false }) // 'number' ustuni bo'yicha kamayish tartibida
          .limit(1) // Eng birinchi (eng katta number) qatorni olish
          .maybeSingle() // Faqat bitta natija kutiladi, topilmasa null qaytaradi

        // Agar xato bo'lsa (lekin topilmasa PGRST116), linkni null qoldiramiz
        if (updateError && updateError.code !== "PGRST116") {
           console.error("Error fetching latest update link:", updateError);
           // Linkni null qoldiramiz, lekin asosiy ma'lumotlar yuklandi
           setLatestAppLink(null);
        } else if (updateData && updateData.update_link) {
           setLatestAppLink(updateData.update_link); // Link topilsa saqlash
        } else {
           setLatestAppLink(null); // Link topilmasa null qilish
        }


        setCompanyData(company)
        setEmployeeCount(count || 0)

      } catch (error) {
        console.error("Error fetching company data:", error)
        setError(error.message || t("errorFetchingData")) // Xatoni statega yozish
        setCompanyData(null) // Xatolik bo'lsa, datani null qilish
        setEmployeeCount(0); // Xatolik bo'lsa, countni 0 qilish
        setLatestAppLink(null); // Xatolik bo'lsa, linkni null qilish
      } finally {
        setLoading(false)
      }
    }

    if (companyId) {
      fetchCompanyDataAndLink()
    } else {
      setLoading(false) // Agar companyId yo'q bo'lsa, loadingni to'xtatish
      setError(t("noCompanyIdProvided")); // companyId yo'q bo'lsa xato berish
      setCompanyData(null);
      setEmployeeCount(0);
      setLatestAppLink(null);
    }
  }, [companyId, supabase, t]) // t ham dependencyga qo'shildi, chunki error message undan foydalanadi

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
  const handleUpgradeClick = () => {
    setShowUpgradePopup(true);
     // Popup ochilganda ichidagi xatoni tozalash
    // setError(""); // Agar popup ichida o'ziga xos xato bo'lmasa, buni ishlatishingiz mumkin
  }

  // Popupni yopish funksiyasi
  const handleClosePopup = () => {
    setShowUpgradePopup(false);
    setError(""); // Popup yopilganda xatoni tozalash
  }

  // Yuklab olish tugmasi bosilganda
  const handleDownloadClick = () => {
    if (latestAppLink) {
      window.open(latestAppLink, '_blank'); // Linkni yangi tabda ochish
      // handleClosePopup(); // Xohlasangiz yuklab olish linki ochilgandan keyin popupni yopishingiz mumkin
    } else {
      // Agar link topilmagan bo'lsa, xato ko'rsatish
      setError(t("downloadLinkNotAvailable")); // Bu xato popup ichida ko'rinadi
    }
  }


  if (loading) {
    return (
      <div className="card flex items-center justify-center p-8 min-h-[300px]"> {/* min-h qo'shildi */}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

   // Agar loading tugadi, error mavjud va companyData yo'q bo'lsa (ma'lumot yuklash umuman muvaffaqiyatsiz bo'ldi)
   if (error && !companyData) {
     return (
       <div className="card p-8">
         <p className="text-center text-red-500 dark:text-red-400">{error}</p>
       </div>
     );
   }


  // Agar loading tugadi, lekin companyData yo'q (masalan, companyId null bo'lsa va error set bo'lsa)
  // Yuqoridagi shart xato bo'lganda ishlaydi, bu esa xato bo'lmasa ishlaydi.
  // Bu kamdan-kam hol, lekin ehtiyot chorasi sifatida qoldirildi.
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

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-6">{t("company")}</h3>

      {/* General Error message (could be from initial fetch error or download link error attempt) */}
      {/* Popup ichida alohida error handle qilingani sababli, bu asosan initial fetch xatosi uchun qoladi */}
      {error && !showUpgradePopup && ( // Agar popup ochiq bo'lsa, errorni asosiy sahifada ko'rsatmaymiz
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Obuna faol emasligi haqida xabar */}
      {!isSubscriptionActive && (
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
      )}


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

      {/* Tugmalar */}
      <div className="mt-8 border-t pt-6 flex flex-col sm:flex-row gap-4">
         {/* Tugma endi popupni ochadi */}
         {/* isSubscriptionActive false bo'lsa 'renew' matni, aks holda 'upgrade' matni */}
         <button onClick={handleUpgradeClick} className="btn btn-primary flex items-center justify-center gap-2">
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
      {showUpgradePopup && (
         <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm relative">
               {/* Close button */}
               <button
                  onClick={handleClosePopup}
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-200"
                  aria-label={t("close")}
               >
                  <X className="h-5 w-5" />
               </button>

               {/* Popup Content */}
               <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t("upgradePopupTitle")}</h3>

               {/* Popup message */}
               <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
                 {t("upgradePopupMessage")}
               </p>

               {/* Error message within popup */}
               {error && ( // Popup ichida ham xato ko'rsatish
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

    </div>
  )
}

// ==========================================================================
// Add these new translation keys to your language context file (e.g., en.json, uz.json)
// ==========================================================================

// "companyNotFound": "Company not found.", // New error message
// "errorFetchingData": "Error loading data. Please try again.", // Generic fetch error
// "noCompanyIdProvided": "Company ID not provided.", // New error message
// "durationNotSetWarning": "Subscription duration is not set.", // Warning if duration is missing
"upgradePopupTitle": "Upgrade or Renew Subscription", // Title for the popup
 "upgradePopupMessage": "To upgrade or renew your subscription plan, please open the Attendance app on your Android device and use the 'Upgrade Subscription' button inside the app.", // Popup message with instructions
 "downloadAppButton": "Download Attendance App", // Text for the download button
 "downloadLinkNotAvailable": "App download link is not available.", // Error if link fetch fails (used internally/dev console)
// "downloadLinkNotAvailableMessage": "The app download link is currently unavailable. Please contact support.", // Message in popup if link is missing
// "close": "Close", // Aria label for close button


// And ensure existing keys are present:
// "basic": "Basic",
// "premium": "Premium",
// "bigplan": "Big Plan", // Or whatever you call plan 3
// "company": "Company",
// "companyName": "Company Name",
// "planLevel": "Plan Level",
// "subscriptionDuration": "Subscription Duration",
// "months": "months", // Make sure pluralization is handled if needed, otherwise simple 'months' is fine
// "notSet": "Not Set",
// "employeeLimit": "Employee Limit",
// "usedEmployees": "used employees",
// "features": "Features",
// "gpsTracking": "GPS Tracking",
// "basicReports": "Basic Reports",
// "excelExports": "Excel Exports",
// "advancedAntiSpoofing": "Advanced Anti-Spoofing",
// "customPlan": "Custom Plan",
// "avatarUpload": "Avatar Upload",
// "upgradeSubscription": "Upgrade Subscription",
// "renewSubscription": "Renew Subscription",
// "contactSupport": "Contact Support",
// "subscriptionInactive": "Subscription Inactive",
// "subscriptionInactiveMessage": "Your company's subscription is currently inactive. Please renew to continue using all features.",
