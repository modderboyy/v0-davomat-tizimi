"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useLanguage } from "../context/LanguageContext"
import { Loader2, Users, AlertTriangle } from "lucide-react"
import { useDynamicIsland } from "./DynamicIsland"

export default function AutoEmployeeForm({
  onEmployeeAdded,
  companyId,
  companyName,
  currentEmployeeCount,
  employeeLimit,
}) {
  const [count, setCount] = useState(1)
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const { t } = useLanguage()
  const { showNotification } = useDynamicIsland()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Calculate max allowed employees to add
  const maxAllowed =
    employeeLimit === Number.POSITIVE_INFINITY
      ? 100 // Set a reasonable limit even for unlimited plans
      : Math.max(0, employeeLimit - currentEmployeeCount)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    // Validate count
    if (count <= 0) {
      setError(t("invalidEmployeeCount"))
      return
    }

    // Check if count exceeds max allowed
    if (count > maxAllowed) {
      setError(t("employeeCountExceedsLimit", { max: maxAllowed }))
      return
    }

    // Validate password
    if (!password || password.length < 6) {
      setError(t("passwordTooShort"))
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      // Generate a sanitized company name for email generation
      const sanitizedCompanyName = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 10) // Limit to 10 chars

      // Create employees in batches to avoid timeouts
      const batchSize = 5
      let successCount = 0

      for (let i = 0; i < count; i += batchSize) {
        const batch = Math.min(batchSize, count - i)
        const promises = []

        for (let j = 0; j < batch; j++) {
          const employeeNumber = currentEmployeeCount + i + j + 1
          const name = `${t("employee")} ${employeeNumber}`
          const email = `${sanitizedCompanyName}${employeeNumber}@modderboy.uz`
          const lavozim = t("defaultPosition")

          // Create user in Auth
          const promise = supabase.auth
            .signUp({
              email,
              password,
              options: {
                data: {
                  name,
                  lavozim,
                },
              },
            })
            .then(async ({ data, error }) => {
              if (error) throw error

              if (!data.user) {
                throw new Error(t("userDataNotFoundAfterSignup"))
              }

              // Update user record with company_id
              const { error: updateError } = await supabase
                .from("users")
                .update({
                  lavozim,
                  company_id: companyId,
                  is_super_admin: false,
                })
                .eq("id", data.user.id)

              if (updateError) throw updateError

              // Confirm email
              const { error: confirmError } = await supabase.auth.updateUser({
                email_confirm: true,
              })

              if (confirmError) console.error("Error confirming email:", confirmError)

              successCount++
            })

          promises.push(promise)
        }

        // Wait for batch to complete
        await Promise.allSettled(promises)
      }

      if (successCount > 0) {
        showNotification("success", t("employeesAddedSuccessfully", { count: successCount }))
        onEmployeeAdded()
      } else {
        throw new Error(t("noEmployeesAdded"))
      }
    } catch (error) {
      console.error("Error adding employees:", error)
      setError(error.message || t("errorAddingEmployees"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4">{t("autoAddEmployees")}</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="count">
            {t("employeeCount")}
          </label>
          <input
            type="number"
            id="count"
            value={count}
            onChange={(e) => setCount(Number.parseInt(e.target.value) || 0)}
            min="1"
            max={maxAllowed}
            className="input"
            required
            disabled={isSubmitting || maxAllowed <= 0}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("maxEmployeesToAdd")}: {maxAllowed}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">
            {t("commonPassword")}
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
            disabled={isSubmitting || maxAllowed <= 0}
            minLength={6}
          />
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">{t("passwordWarning")}</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">{t("passwordWarningMessage")}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
          <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">{t("autoEmployeeInfo")}</h4>
          <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <li>{t("autoEmployeeNameFormat")}</li>
            <li>
              {t("autoEmployeeEmailFormat", {
                company: companyName
                  ? `${companyName
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "")
                      .substring(0, 10)}`
                  : "company",
              })}
            </li>
            <li>{t("commonPasswordUsed")}</li>
          </ul>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full flex items-center justify-center gap-2"
          disabled={isSubmitting || maxAllowed <= 0}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("submitting")}
            </>
          ) : (
            <>
              <Users className="w-5 h-5" />
              {t("addEmployees")}
            </>
          )}
        </button>
      </form>
    </div>
  )
}
