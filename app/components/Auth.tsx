"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { useLanguage } from "../context/LanguageContext"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { ThemeToggle } from "./ThemeToggle"
import { Eye, EyeOff, LogIn, AlertTriangle } from "lucide-react"
import { useDynamicIsland } from "./DynamicIsland"

export default function Auth() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [envError, setEnvError] = useState<string | null>(null)
  const router = useRouter()
  const { t } = useLanguage()
  const { showNotification } = useDynamicIsland()

  // Initialize Supabase client with error handling
  const supabase = (() => {
    try {
      return createClientComponentClient()
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error)
      return null
    }
  })()

  useEffect(() => {
    // Check if Supabase environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setEnvError(
        "Supabase environment variables are missing. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      )
      return
    }

    if (!supabase) {
      setEnvError("Failed to initialize Supabase client. Check console for details.")
      return
    }

    const checkSession = async () => {
      setLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          // Session exists, check if user is admin
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("company_id, is_super_admin")
            .eq("id", session.user.id)
            .single()

          if (userError) throw userError

          if (userData.is_super_admin) {
            // Store company ID and redirect to dashboard
            sessionStorage.setItem("companyId", userData.company_id)
            router.push("/dashboard")
          }
        }
      } catch (error) {
        console.error("Session check error:", error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [router, supabase])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supabase) {
      showNotification("error", "Supabase client not initialized")
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      // Foydalanuvchi ma'lumotlarini olish (admin rolini tekshirish uchun)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("company_id, is_super_admin") // is_super_admin ni ham olamiz
        .eq("id", user.id)
        .single()

      if (userError) throw userError

      // Admin rolini tekshirish
      if (userData.is_super_admin) {
        // Company ID ni sessionStorage ga saqlash (faqat adminlar uchun)
        sessionStorage.setItem("companyId", userData.company_id)
        router.push("/dashboard")
      } else {
        // Agar admin bo'lmasa, xatolik xabarini chiqarish
        showNotification("error", "Noto'gri login. Siz admin emassiz.")
        // Va hech qayerga yo'naltirmaslik
        return // Funksiyadan chiqish, yo'naltirishni to'xtatish uchun
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("error", error.message)
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="card w-full max-w-md shadow-xl border-t-4 border-t-indigo-600">
          {envError ? (
            <div className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Configuration Error</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{envError}</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t("login")}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{t("attendanceSystem")}</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="email">
                    {t("email")}
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="example@domain.com"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">
                    {t("password")}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="••••••••"
                      className="input pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <LogIn className="w-5 h-5" />
                    )}
                    {t("signIn")}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
