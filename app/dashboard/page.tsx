"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import QRScanner from "../components/QRScanner"
import AdminPanel from "../components/AdminPanel"
import { useLanguage } from "../context/LanguageContext"

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(null)
  const [companyId, setCompanyId] = useState(null)
  const [isNewCompany, setIsNewCompany] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { t } = useLanguage()

  useEffect(() => {
    const getUserData = async () => {
      try {
        setLoading(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          setUser(user)
          const { data, error } = await supabase
            .from("users")
            .select("is_super_admin, company_id")
            .eq("id", user.id)
            .single()

          if (error) {
            console.error("Error fetching user data:", error)
            setIsAdmin(false)
            setCompanyId(null)
          } else {
            setIsAdmin(data.is_super_admin)
            setCompanyId(data.company_id)

            // Check if company is new and redirect to setup if needed
            if (data.is_super_admin && data.company_id) {
              const { data: companyData, error: companyError } = await supabase
                .from("companies")
                .select("new")
                .eq("id", data.company_id)
                .single()

              if (!companyError && companyData && companyData.new === true) {
                setIsNewCompany(true)
                router.push("/setup")
                return
              }
            }
          }
        } else {
          router.push("/")
        }
      } catch (error) {
        console.error("Error getting user:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    getUserData()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-indigo-600 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-10 w-10 rounded-full bg-gray-50 dark:bg-gray-900"></div>
          </div>
        </div>
      </div>
    )
  }

  if (isAdmin === null) {
    return null
  }

  return (
    <div className="min-h-screen">
      {isAdmin ? <AdminPanel companyId={companyId} /> : <QRScanner user={user} companyId={companyId} />}
    </div>
  )
}
