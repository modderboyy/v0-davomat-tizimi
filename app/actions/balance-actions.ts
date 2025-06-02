"use server"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { getNowPaymentsToken, createSubscriptionPlan, createPayment, getPaymentStatus } from "../services/nowpayments"

// Environment variables for NowPayments
const NOWPAYMENTS_EMAIL = process.env.NOWPAYMENTS_EMAIL || ""
const NOWPAYMENTS_PASSWORD = process.env.NOWPAYMENTS_PASSWORD || ""
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || ""

// Create a subscription plan for a company
export async function createCompanySubscriptionPlan(companyId: string, companyName: string) {
  const supabase = createClientComponentClient()

  try {
    // Get JWT token
    const token = await getNowPaymentsToken(NOWPAYMENTS_EMAIL, NOWPAYMENTS_PASSWORD)

    // Create subscription plan
    const plan = await createSubscriptionPlan(
      token,
      `${companyName} - Monthly Plan`,
      30, // 30 days interval
      10, // $10 per month
      "USD",
    )

    // Update company record with plan ID
    const { error } = await supabase
      .from("companies")
      .update({
        nowpayments_account_id: plan.id,
        balance_id: plan.id,
      })
      .eq("id", companyId)

    if (error) throw error

    return { success: true, planId: plan.id, plan }
  } catch (error) {
    console.error("Error creating subscription plan:", error)
    return { success: false, error: error.message }
  }
}

// Get company balance (simplified - using database balance)
export async function getCompanyBalance(companyId: string) {
  const supabase = createClientComponentClient()

  try {
    // Get company balance from database
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("nowpayments_account_id, balance")
      .eq("id", companyId)
      .single()

    if (companyError) throw companyError

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

// Create a payment for deposit
export async function createCompanyDepositPayment(companyId: string, amount: number) {
  const supabase = createClientComponentClient()

  try {
    // Create payment using NowPayments
    const payment = await createPayment(NOWPAYMENTS_API_KEY, amount, "USD", `deposit-${companyId}-${Date.now()}`)

    // Record transaction
    const { error: transactionError } = await supabase.from("payment_transactions").insert({
      company_id: companyId,
      amount,
      transaction_type: "deposit",
      status: "pending",
      payment_id: payment.payment_id,
      payment_details: payment,
    })

    if (transactionError) throw transactionError

    return {
      success: true,
      paymentUrl: payment.invoice_url,
      paymentId: payment.payment_id,
      paymentAddress: payment.pay_address,
      payAmount: payment.pay_amount,
      payCurrency: payment.pay_currency,
    }
  } catch (error) {
    console.error("Error creating deposit payment:", error)
    return { success: false, error: error.message }
  }
}

// Check payment status and update balance
export async function checkPaymentStatus(paymentId: string) {
  const supabase = createClientComponentClient()

  try {
    // Get payment status from NowPayments
    const paymentStatus = await getPaymentStatus(NOWPAYMENTS_API_KEY, paymentId)

    // Get transaction from database
    const { data: transaction, error: transactionError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("payment_id", paymentId)
      .single()

    if (transactionError) throw transactionError

    // Update transaction status
    let newStatus = "pending"
    if (paymentStatus.payment_status === "finished") {
      newStatus = "completed"
    } else if (paymentStatus.payment_status === "failed") {
      newStatus = "failed"
    } else if (paymentStatus.payment_status === "expired") {
      newStatus = "failed"
    }

    // Update transaction
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: newStatus,
        payment_details: paymentStatus,
      })
      .eq("payment_id", paymentId)

    if (updateError) throw updateError

    // If payment is completed, update company balance
    if (newStatus === "completed" && transaction.transaction_type === "deposit") {
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("balance")
        .eq("id", transaction.company_id)
        .single()

      if (companyError) throw companyError

      const newBalance = (company.balance || 0) + transaction.amount

      const { error: balanceError } = await supabase
        .from("companies")
        .update({ balance: newBalance })
        .eq("id", transaction.company_id)

      if (balanceError) throw balanceError
    }

    return { success: true, status: newStatus, paymentStatus }
  } catch (error) {
    console.error("Error checking payment status:", error)
    return { success: false, error: error.message }
  }
}

// Process withdrawal (simplified - just update database)
export async function processWithdrawal(companyId: string, amount: number, address: string) {
  const supabase = createClientComponentClient()

  try {
    // Get company balance
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("balance")
      .eq("id", companyId)
      .single()

    if (companyError) throw companyError

    // Check if balance is sufficient
    if ((company.balance || 0) < amount) {
      return { success: false, error: "Insufficient balance" }
    }

    // Record transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("payment_transactions")
      .insert({
        company_id: companyId,
        amount: -amount, // Negative amount for withdrawal
        transaction_type: "withdraw",
        status: "completed", // For demo purposes, mark as completed immediately
        payment_details: { address, note: "Manual withdrawal" },
      })
      .select()
      .single()

    if (transactionError) throw transactionError

    // Update company balance
    const { error: updateError } = await supabase
      .from("companies")
      .update({ balance: (company.balance || 0) - amount })
      .eq("id", companyId)

    if (updateError) throw updateError

    return { success: true, withdrawalId: transaction.id }
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
