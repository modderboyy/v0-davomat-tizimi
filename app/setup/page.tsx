"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { useLanguage } from "../context/LanguageContext"
import { ThemeToggle } from "../components/ThemeToggle"
import { LanguageSwitcher } from "../components/LanguageSwitcher"
import { useDynamicIsland } from "../components/DynamicIsland"
import { Check, MapPin, Building, Palette, AlertTriangle, Info, X } from "lucide-react"

export default function SetupPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyData, setCompanyData] = useState(null)
  const [companyId, setCompanyId] = useState(null)
  const [companyName, setCompanyName] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [distance, setDistance] = useState("100") // Default 100 meters
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState("")
  const [showLocationGuide, setShowLocationGuide] = useState(false)

  const router = useRouter()
  const { t, language, setLanguage } = useLanguage()
  const { showNotification } = useDynamicIsland()
  const supabase = createClientComponentClient()

  // Kompaniya ma'lumotlarini olish
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true)

        // Avval sessiyani tekshiramiz
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          // Agar sessiya bo'lmasa, login sahifasiga yo'naltirish
          router.push("/")
          return
        }

        // Foydalanuvchi ma'lumotlarini olish
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("company_id, is_super_admin")
          .eq("id", session.user.id)
          .single()

        if (userError) {
          throw userError
        }

        if (!userData.is_super_admin) {
          // Agar admin bo'lmasa, dashboard sahifasiga yo'naltirish
          router.push("/dashboard")
          return
        }

        setCompanyId(userData.company_id)

        // Kompaniya ma'lumotlarini olish
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("id", userData.company_id)
          .single()

        if (companyError) {
          throw companyError
        }

        // Agar kompaniya yangi emas bo'lsa, dashboard sahifasiga yo'naltirish
        if (company.new === false) {
          router.push("/dashboard")
          return
        }

        setCompanyData(company)
        setCompanyName(company.company_name || "")

        // Joylashuv ma'lumotlarini olish
        const { data: locationData } = await supabase
          .from("location")
          .select("*")
          .eq("company_id", userData.company_id)
          .maybeSingle()

        if (locationData) {
          setLatitude(locationData.latitude.toString())
          setLongitude(locationData.longitude.toString())
          setDistance(locationData.distance.toString())
        }
      } catch (error) {
        console.error("Error fetching company data:", error)
        setError(t("errorFetchingCompanyData"))
      } finally {
        setLoading(false)
      }
    }

    fetchCompanyData()
  }, [supabase, router, t])

  // Setup jarayonini yakunlash
  const completeSetup = async () => {
    try {
      setSaving(true)
      setError("")

      // Kompaniya nomini yangilash
      if (companyName.trim() === "") {
        setError(t("companyNameRequired"))
        return
      }

      const { error: companyUpdateError } = await supabase
        .from("companies")
        .update({
          company_name: companyName,
          new: false, // Setup yakunlandi
        })
        .eq("id", companyId)

      if (companyUpdateError) {
        throw companyUpdateError
      }

      // Joylashuv ma'lumotlarini saqlash
      if (latitude && longitude && distance) {
        const latNum = Number.parseFloat(latitude)
        const lonNum = Number.parseFloat(longitude)
        const distNum = Number.parseInt(distance, 10)

        if (isNaN(latNum) || isNaN(lonNum) || isNaN(distNum)) {
          setError(t("invalidLocationData"))
          return
        }

        const locationObject = {
          company_id: companyId,
          latitude: latNum,
          longitude: lonNum,
          distance: distNum,
        }

        // Mavjud joylashuvni tekshirish
        const { data: existingLocation } = await supabase
          .from("location")
          .select("id")
          .eq("company_id", companyId)
          .maybeSingle()

        if (existingLocation) {
          // Mavjud joylashuvni yangilash
          const { error: locationUpdateError } = await supabase
            .from("location")
            .update(locationObject)
            .eq("id", existingLocation.id)

          if (locationUpdateError) {
            throw locationUpdateError
          }
        } else {
          // Yangi joylashuv yaratish
          const { error: locationInsertError } = await supabase.from("location").insert(locationObject)

          if (locationInsertError) {
            throw locationInsertError
          }
        }
      } else {
        setError(t("locationDataRequired"))
        return
      }

      // Muvaffaqiyatli yakunlandi
      showNotification("success", t("setupCompleted"))
      router.push("/dashboard")
    } catch (error) {
      console.error("Error completing setup:", error)
      setError(t("errorCompletingSetup"))
    } finally {
      setSaving(false)
    }
  }

  // Keyingi qadamga o'tish
  const goToNextStep = () => {
    if (currentStep === 1 && companyName.trim() === "") {
      setError(t("companyNameRequired"))
      return
    }

    if (currentStep === 3 && (!latitude || !longitude || !distance)) {
      setError(t("locationDataRequired"))
      return
    }

    setError("")
    setCurrentStep((prev) => Math.min(prev + 1, 4))
  }

  // Oldingi qadamga qaytish
  const goToPreviousStep = () => {
    setError("")
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("setupYourCompany")}</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{t("setupDescription")}</p>
          </div>

          {/* Progress steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step < currentStep
                        ? "bg-green-500 text-white"
                        : step === currentStep
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {step < currentStep ? <Check className="h-5 w-5" /> : step}
                  </div>
                  <span
                    className={`text-xs mt-2 ${
                      step <= currentStep ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {step === 1
                      ? t("companyName")
                      : step === 2
                        ? t("appearance")
                        : step === 3
                          ? t("location")
                          : t("finish")}
                  </span>
                </div>
              ))}
            </div>
            <div className="relative mt-2">
              <div className="absolute top-0 left-0 h-1 bg-gray-200 dark:bg-gray-700 w-full"></div>
              <div
                className="absolute top-0 left-0 h-1 bg-indigo-600 transition-all duration-300"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-md dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Step content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 transition-all duration-300 animate-fade-in">
            {/* Step 1: Company Name */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <Building className="h-6 w-6 text-indigo-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t("companyName")}</h2>
                </div>

                <p className="text-gray-600 dark:text-gray-400">{t("companyNameDescription")}</p>

                <div>
                  <label
                    htmlFor="companyName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {t("companyName")}
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="input"
                    placeholder={t("enterCompanyName")}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Appearance */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <Palette className="h-6 w-6 text-indigo-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t("appearance")}</h2>
                </div>

                <p className="text-gray-600 dark:text-gray-400">{t("appearanceDescription")}</p>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("theme")}</h3>
                    <div className="flex items-center">
                      <ThemeToggle />
                      <span className="ml-2 text-gray-600 dark:text-gray-400">{t("toggleTheme")}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("language")}</h3>
                    <div className="flex items-center">
                      <LanguageSwitcher />
                      <span className="ml-2 text-gray-600 dark:text-gray-400">{t("selectLanguage")}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <MapPin className="h-6 w-6 text-indigo-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t("location")}</h2>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">{t("locationImportanceWarning")}</p>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400">{t("locationSetupDescription")}</p>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="latitude"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
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
                    <label
                      htmlFor="longitude"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
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
                    <label
                      htmlFor="distance"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
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

                  <button
                    onClick={() => setShowLocationGuide(true)}
                    className="text-indigo-600 dark:text-indigo-400 text-sm flex items-center hover:underline"
                  >
                    <Info className="h-4 w-4 mr-1" />
                    {t("howToGetCoordinates")}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Finish */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <Check className="h-6 w-6 text-indigo-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t("finishSetup")}</h2>
                </div>

                <p className="text-gray-600 dark:text-gray-400">{t("finishSetupDescription")}</p>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">{t("setupSummary")}</h3>
                  <ul className="space-y-2 text-green-700 dark:text-green-400">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2" />
                      <span>
                        {t("companyName")}: <strong>{companyName}</strong>
                      </span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2" />
                      <span>
                        {t("theme")}:{" "}
                        <strong>{t(document.documentElement.classList.contains("dark") ? "dark" : "light")}</strong>
                      </span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2" />
                      <span>
                        {t("language")}: <strong>{t(language)}</strong>
                      </span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2" />
                      <span>
                        {t("location")}:{" "}
                        <strong>
                          {latitude}, {longitude}
                        </strong>{" "}
                        ({distance} {t("meters")})
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <button
              onClick={goToPreviousStep}
              className={`btn btn-outline ${currentStep === 1 ? "invisible" : ""}`}
              disabled={currentStep === 1}
            >
              {t("previous")}
            </button>

            {currentStep < 4 ? (
              <button onClick={goToNextStep} className="btn btn-primary">
                {t("next")}
              </button>
            ) : (
              <button onClick={completeSetup} className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {t("saving")}
                  </>
                ) : (
                  t("completeSetup")
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* === Location Guide Popup === */}
      {showLocationGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative animate-fade-in-up">
            {/* Close button */}
            <button
              onClick={() => setShowLocationGuide(false)}
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
                <button onClick={() => setShowLocationGuide(false)} className="btn btn-primary">
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
