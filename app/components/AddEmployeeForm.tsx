"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useLanguage } from "../context/LanguageContext"
import { Save, Loader2, AlertTriangle } from "lucide-react"
import { useDynamicIsland } from "./DynamicIsland"

export default function AddEmployeeForm({ onEmployeeAdded, companyId }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [lavozim, setLavozim] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [employeeCount, setEmployeeCount] = useState(0)
  const [employeeLimit, setEmployeeLimit] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { t } = useLanguage()
  const { showNotification } = useDynamicIsland()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Fetch company data and employee count on component mount
  useEffect(() => {
    const fetchCompanyAndEmployeeData = async () => {
      setIsLoading(true)
      try {
        // Fetch company data to get the plan
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("plan")
          .eq("id", companyId)
          .single()

        if (companyError) throw companyError

        // Get employee limit based on plan
        let limit = 0
        switch (companyData.plan) {
          case 1: // Basic
            limit = 5
            break
          case 2: // Premium
            limit = 125
            break
          case 3: // Bigplan
            limit = Number.POSITIVE_INFINITY // No limit
            break
          default:
            limit = 0 // No employees allowed
        }
        setEmployeeLimit(limit)

        // Count current employees
        const { count, error: countError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("is_super_admin", false)

        if (countError) throw countError
        setEmployeeCount(count || 0)
      } catch (error) {
        console.error("Error fetching company or employee data:", error)
        showNotification("error", t("errorFetchingData"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompanyAndEmployeeData()
  }, [companyId, supabase, showNotification, t])

  // Function to clear the form
  const clearForm = () => {
    setEmail("")
    setPassword("")
    setName("")
    setLavozim("")
  }

  // Function to check if employee limit is reached
  const isEmployeeLimitReached = () => {
    return employeeCount >= employeeLimit
  }

  // Function to remove excess employees if somehow added beyond the limit
  const removeExcessEmployees = async () => {
    try {
      // Get all employees sorted by creation date (newest first)
      const { data: employees, error: fetchError } = await supabase
        .from("users")
        .select("id, created_at")
        .eq("company_id", companyId)
        .eq("is_super_admin", false)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      // If we have more employees than the limit
      if (employees.length > employeeLimit) {
        // Get the excess employees (newest ones)
        const excessEmployees = employees.slice(employeeLimit)

        // Delete each excess employee
        for (const employee of excessEmployees) {
          const { error: deleteError } = await supabase.from("users").delete().eq("id", employee.id)
          if (deleteError) console.error("Error deleting excess employee:", deleteError)
        }

        showNotification("warning", t("excessEmployeesRemoved", { count: excessEmployees.length }))
      }
    } catch (error) {
      console.error("Error removing excess employees:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setError("")

    // Check if employee limit is reached
    if (isEmployeeLimitReached()) {
      setError(t("employeeLimitReached", { limit: employeeLimit }))
      setIsSubmitting(false)
      return
    }

    try {
      // 1. Check if the email already exists in our users table (for any company)
      const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("id, company_id")
        .eq("email", email)
        .maybeSingle()

      // Handle potential database errors during the select query
      if (existingUserError && existingUserError.code !== "PGRST116") {
        console.error("Error checking existing user:", existingUserError)
        throw existingUserError
      }

      // 2. If user is found in the public.users table
      if (existingUser) {
        // If user belongs to a different company, show error
        if (existingUser.company_id !== null && existingUser.company_id !== companyId) {
          setError(t("emailExistsInAnotherCompany"))
          setIsSubmitting(false)
          return
        } else {
          // User exists in this company or is unassigned (company_id is null)
          const updatePayload = { name, lavozim }
          if (existingUser.company_id === null) {
            updatePayload.company_id = companyId
          }

          const { error: updateError } = await supabase.from("users").update(updatePayload).eq("id", existingUser.id)

          if (updateError) {
            console.error("Error updating existing user:", updateError)
            throw updateError
          }

          // Success - Updated existing employee or linked an unassigned user
          clearForm()
          onEmployeeAdded()
          showNotification("success", t("employeeUpdatedSuccessfully"))
          setIsSubmitting(false)
          return
        }
      }

      // 3. If user was NOT found in the public.users table, attempt to create them via Supabase Auth
      if (!password) {
        setError(t("passwordIsRequiredForNewEmployee"))
        setIsSubmitting(false)
        return
      }

      // Attempt to sign up the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            lavozim: lavozim,
          },
        },
      })

      // Handle Auth signup errors
      if (authError) {
        console.error("Error during Auth signup:", authError)
        throw authError
      }

      // Check if user data is available after successful signup
      if (!authData.user) {
        console.error("User data not found after successful Auth signup")
        throw new Error(t("userDataNotFoundAfterSignup"))
      }

      // 4. Update the user record with company_id and other details
      const { error: updateUsersError } = await supabase
        .from("users")
        .update({
          lavozim: lavozim,
          company_id: companyId,
          is_super_admin: false,
        })
        .eq("id", authData.user.id)

      // Check for errors during the update of the public.users table
      if (updateUsersError) {
        console.error("Error updating public.users after signup:", updateUsersError)
        throw new Error(t("errorUpdatingEmployeeDetailsAfterSignup"))
      }

      // 5. Confirm the user's email (skip email verification step flow)
      const { error: updateAuthError } = await supabase.auth.updateUser({
        email_confirm: true,
      })

      if (updateAuthError) {
        console.error("Error setting email_confirm after signup:", updateAuthError)
      }

      // Clear form and notify parent
      clearForm()
      onEmployeeAdded()
      showNotification("success", t("employeeAddedSuccessfully"))

      // Check if we need to remove excess employees (safety check)
      await removeExcessEmployees()
    } catch (error) {
      console.error("Submission error:", error)
      // Display a user-friendly error message
      setError(error.message || t("errorAddingEmployee"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4">{t("addEmployee")}</h3>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Employee limit indicator */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t("employeeCount")}: {employeeCount} / {employeeLimit === Number.POSITIVE_INFINITY ? "∞" : employeeLimit}
            </span>
            {isEmployeeLimitReached() && (
              <span className="text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {t("limitReached")}
              </span>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="name">
                {t("name")}
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                required
                disabled={isSubmitting || isEmployeeLimitReached()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="lavozim">
                {t("position")}
              </label>
              <input
                type="text"
                id="lavozim"
                value={lavozim}
                onChange={(e) => setLavozim(e.target.value)}
                className="input"
                required
                disabled={isSubmitting || isEmployeeLimitReached()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="email">
                {t("email")}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
                disabled={isSubmitting || isEmployeeLimitReached()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">
                {t("password")}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
                disabled={isSubmitting || isEmployeeLimitReached()}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full flex items-center justify-center gap-2"
              disabled={isSubmitting || isEmployeeLimitReached()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {t("addEmployee")}
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
