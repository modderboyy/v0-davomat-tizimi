"use server"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { getNowPaymentsToken, createSubPartnerAccount, createDepositLink, withdrawFunds } from "../services/nowpayments"

// Environment variables for NowPayments
const NOWPAYMENTS_EMAIL = process.env.NOWPAYMENTS_EMAIL || "diyorbekxme@gmail.com"
const NOWPAYMENTS_PASSWORD = process.env.NOWPAYMENTS_PASSWORD || "#Diyor2010#"
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || ""

// Create a NowPayments account for a company
export async function createCompanyPaymentAccount(companyId: string, companyName: string) {
  const supabase = createClientComponentClient()

  try {
    // Get JWT token
    const token = await getNowPaymentsToken(NOWPAYMENTS_EMAIL, NOWPAYMENTS_PASSWORD)

    // Create sub-partner account
    const account = await createSubPartnerAccount(token, companyName)

    // Update company record with account ID
    const { error } = await supabase
      .from("companies")
      .update({
        nowpayments_account_id: account.id,
        balance_id: account.id,
      })
      .eq("id", companyId)

    if (error) throw error

    return { success: true, accountId: account.id }
  } catch (error) {
    console.error("Error creating payment account:", error)
    return { success: false, error: error.message }
  }
}

// Get company balance
export async function getCompanyBalance(companyId: string) {
  const supabase = createClientComponentClient()

  try {
    // Get company account ID
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("nowpayments_account_id, balance")
      .eq("id", companyId)
      .single()

    if (companyError) throw companyError

    if (!company.nowpayments_account_id) {
      return { success: false, error: "No payment account found for this company" }
    }

    // For now, return the balance from the database
    // In a production environment, you would fetch the real-time balance from NowPayments
    return {
      success: true,
      balance: company.balance || 0,
      accountId: company.nowpayments_account_id,
    }
  } catch (error) {
    console.error("Error getting company balance:", error)
    return { success: false, error: error.message }
  }
}

// Create a deposit link
export async function createCompanyDepositLink(companyId: string, amount: number) {
  const supabase = createClientComponentClient()

  try {
    // Get company account ID
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("nowpayments_account_id")
      .eq("id", companyId)
      .single()

    if (companyError) throw companyError

    if (!company.nowpayments_account_id) {
      return { success: false, error: "No payment account found for this company" }
    }

    // Get JWT token
    const token = await getNowPaymentsToken(NOWPAYMENTS_EMAIL, NOWPAYMENTS_PASSWORD)

    // Create deposit link
    const depositData = await createDepositLink(token, company.nowpayments_account_id, amount)

    // Record transaction
    const { error: transactionError } = await supabase.from("payment_transactions").insert({
      company_id: companyId,
      amount,
      transaction_type: "deposit",
      status: "pending",
      payment_id: depositData.id,
      payment_details: depositData,
    })

    if (transactionError) throw transactionError

    return { success: true, depositLink: depositData.payment_url, paymentId: depositData.id }
  } catch (error) {
    console.error("Error creating deposit link:", error)
    return { success: false, error: error.message }
  }
}

// Process withdrawal
export async function processWithdrawal(companyId: string, amount: number, address: string) {
  const supabase = createClientComponentClient()

  try {
    // Get company account ID
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("nowpayments_account_id, balance")
      .eq("id", companyId)
      .single()

    if (companyError) throw companyError

    if (!company.nowpayments_account_id) {
      return { success: false, error: "No payment account found for this company" }
    }

    // Check if balance is sufficient
    if ((company.balance || 0) < amount) {
      return { success: false, error: "Insufficient balance" }
    }

    // Get JWT token
    const token = await getNowPaymentsToken(NOWPAYMENTS_EMAIL, NOWPAYMENTS_PASSWORD)

    // Process withdrawal
    const withdrawalData = await withdrawFunds(token, company.nowpayments_account_id, amount, "USD", address)

    // Record transaction
    const { error: transactionError } = await supabase.from("payment_transactions").insert({
      company_id: companyId,
      amount: -amount, // Negative amount for withdrawal
      transaction_type: "withdraw",
      status: "pending",
      payment_id: withdrawalData.id,
      payment_details: withdrawalData,
    })

    if (transactionError) throw transactionError

    // Update company balance (this would be handled by webhooks in production)
    const { error: updateError } = await supabase
      .from("companies")
      .update({ balance: (company.balance || 0) - amount })
      .eq("id", companyId)

    if (updateError) throw updateError

    return { success: true, withdrawalId: withdrawalData.id }
  } catch (error) {
    console.error("Error processing withdrawal:", error)
    return { success: false, error: error.message }
  }
}

// Get transaction history
export async function getTransactionHistory(companyId: string) {
  const supabase = createClientComponentClient()

  try {
    const { data, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, transactions: data || [] }
  } catch (error) {
    console.error("Error getting transaction history:", error)
    return { success: false, error: error.message }
  }
}
