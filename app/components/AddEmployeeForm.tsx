"use client"

import type React from "react"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "../context/LanguageContext"
import { Save, Loader2 } from "lucide-react"
// Import the useDynamicIsland hook
import { useDynamicIsland } from "./DynamicIsland"

export default function AddEmployeeForm({ onEmployeeAdded, companyId }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [lavozim, setLavozim] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const { t } = useLanguage()

  // Add this after the useState declarations
  const { showNotification } = useDynamicIsland()

  const supabase = createClientComponentClient()

  // Function to clear the form
  const clearForm = () => {
    setEmail(""); setPassword(""); setName(""); setLavozim("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setError("")

    try {
      // 1. Check if the email already exists in our users table (for any company)
      // Use maybeSingle() to handle cases where the user exists in Auth but not public.users yet (if trigger is slow or missing)
      const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("id, company_id")
        .eq("email", email)
        .maybeSingle();

      // Handle potential database errors during the select query
      if (existingUserError && existingUserError.code !== "PGRST116") { // PGRST116 means "no rows found" for single()
        console.error("Error checking existing user:", existingUserError);
        throw existingUserError;
      }

      // 2. If user is found in the public.users table
      if (existingUser) {
        // If user belongs to a different company, show error
        // We check company_id !== null because a null company_id means the user exists in users
        // but hasn't been assigned to a company yet, which we can allow updating/assigning.
        if (existingUser.company_id !== null && existingUser.company_id !== companyId) {
          setError(t("emailExistsInAnotherCompany"));
          setIsSubmitting(false); // Stop submitting
          return; // Stop here
        } else {
          // User exists in this company or is unassigned (company_id is null)
          // Update their name, position, and potentially set company_id if it was null
          const updatePayload = { name, lavozim };
          if (existingUser.company_id === null) {
             updatePayload.company_id = companyId;
          }
          // Note: We don't update the password here via public.users

          const { error: updateError } = await supabase
            .from("users")
            .update(updatePayload)
            .eq("id", existingUser.id); // Update by the existing user's ID

          if (updateError) {
            console.error("Error updating existing user:", updateError);
            throw updateError;
          }

          // Success - Updated existing employee or linked an unassigned user
          clearForm();
          onEmployeeAdded();
          showNotification("success", t("employeeUpdatedSuccessfully")); // Or a different message
          setIsSubmitting(false); // Stop submitting
          return; // Processing for existing user is complete
        }
      }

      // 3. If user was NOT found in the public.users table, attempt to create them via Supabase Auth
      // This path is for genuinely new users (not found in public.users by email)
      // If user exists in Auth but somehow wasn't in public.users, signUp will return an error,
      // which is handled in the catch block.
      if (!password) { // Password is required for signUp
         setError(t("passwordIsRequiredForNewEmployee"));
         setIsSubmitting(false); // Stop submitting
         return;
      }

      // Attempt to sign up the user in Supabase Auth
      // Pass name and lavozim in data options - trigger might use these
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            lavozim: lavozim, // Include lavozim here too
          },
        },
      });

      // Handle Auth signup errors (e.g., "User already registered" if they exist in Auth but not public.users)
      if (authError) {
        console.error("Error during Auth signup:", authError);
        throw authError;
      }

      // Check if user data is available after successful signup
      if (!authData.user) {
        // This case is rare after a successful signUp unless something is fundamentally wrong
        console.error("User data not found after successful Auth signup");
        throw new Error(t("userDataNotFoundAfterSignup"));
      }

      // 4. If signup succeeded (user is brand new in Auth),
      // we expect a trigger to have created a row in public.users.
      // Now, UPDATE that row using the new user's Auth ID to set missing details.
      // This handles cases where the trigger didn't set lavozim, company_id, etc.
      const { error: updateUsersError } = await supabase
        .from("users")
        .update({
          lavozim: lavozim, // Set the correct lavozim
          company_id: companyId, // Set the correct company_id
          is_super_admin: false, // Ensure they're not an admin by default
          // No need to set 'name' or 'email' here if trigger already handles them,
          // but explicitly setting company_id and lavozim is key.
        })
        .eq("id", authData.user.id); // Update the row based on the new Auth user's ID

      // Check for errors during the update of the public.users table
      if (updateUsersError) {
         console.error("Error updating public.users after signup:", updateUsersError);
         // Decide how critical this is. If the user is created in Auth but linking fails,
         // they might not appear correctly in the company's list. Throwing an error is safer.
         throw new Error(t("errorUpdatingEmployeeDetailsAfterSignup"));
      }
      
      // 5. Confirm the user's email (skip email verification step flow)
      // Note: This bypasses the email confirmation flow. Be sure this is desired.
      const { error: updateAuthError } = await supabase.auth.updateUser({
         email_confirm: true,
      });

      if (updateAuthError) {
         console.error("Error setting email_confirm after signup:", updateAuthError);
         // Decide if this error is critical enough to stop the process.
         // The user is created and linked, but the confirmation flag might be wrong.
         // For now, we'll log it but let the process succeed as the main goal is met.
         // Depending on app logic, you might throw here.
         // throw updateAuthError; // Uncomment this line if this error should stop the process
      }


      // Clear form and notify parent
      clearForm();
      onEmployeeAdded();
      showNotification("success", t("employeeAddedSuccessfully"));

    } catch (error) {
      console.error("Submission error:", error);
      // Display a user-friendly error message
      setError(error.message || t("errorAddingEmployee"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4">{t("addEmployee")}</h3>

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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            required // Password is required for creating a new employee via Auth
            disabled={isSubmitting}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary w-full flex items-center justify-center gap-2"
          disabled={isSubmitting}
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
    </div>
  )
}

// Add these translation keys to your language context file (e.g., en.json, uz.json)
// "emailExistsInAnotherCompany": "This email is already registered with another company.",
// "employeeAddedSuccessfully": "Employee added successfully!",
// "employeeUpdatedSuccessfully": "Employee details updated successfully!",
// "userDataNotFoundAfterSignup": "Error: User data not found after signup.",
// "passwordIsRequiredForNewEmployee": "Password is required to add a new employee.",
// "errorUpdatingEmployeeDetailsAfterSignup": "There was an error updating employee details after creation."
// "errorAddingEmployee": "There was an error adding the employee." (This might exist but ensure a generic fallback is available)
