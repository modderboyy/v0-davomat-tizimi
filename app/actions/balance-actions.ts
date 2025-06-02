"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import {
  createPayment,
  getPaymentStatus,
  getEstimatedPrice,
  SUPPORTED_CRYPTOCURRENCIES,
  validateMinimumAmount,
  getMinimumAmount,
} from "../services/nowpayments"

// Create a subscription plan for a company (legacy function for compatibility)
export async function createCompanySubscriptionPlan(companyId: string, companyName: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    // For now, just create a basic company record update
    // This function exists for compatibility with existing code
    const { error } = await supabase
      .from("companies")
      .update({
        nowpayments_account_id: `plan_${companyId}_${Date.now()}`,
        balance_id: `balance_${companyId}_${Date.now()}`,
      })
      .eq("id", companyId)

    if (error) throw error

    return {
      success: true,
      planId: `plan_${companyId}_${Date.now()}`,
      plan: {
        id: `plan_${companyId}_${Date.now()}`,
        title: `${companyName} - Monthly Plan`,
        interval_day: 30,
        amount: 10,
        currency: "USD",
      },
    }
  } catch (error) {
    console.error("Error creating subscription plan:", error)
    return { success: false, error: error.message }
  }
}

// Environment variables for NowPayments
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || ""

// Get company balance
export async function getCompanyBalance(companyId: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("balance")
      .eq("id", companyId)
      .single()

    if (companyError) throw companyError

    return {
      success: true,
      balance: company.balance || 0,
    }
  } catch (error) {
    console.error("Error getting company balance:", error)
    return { success: false, error: error.message }
  }
}

// Create a payment for deposit
export async function createCompanyDepositPayment(companyId: string, amount: number, cryptocurrency = "btc") {
  const supabase = createServerComponentClient({ cookies })

  try {
    // Validate minimum amount
    if (!validateMinimumAmount(cryptocurrency, amount)) {
      const minAmount = getMinimumAmount(cryptocurrency)
      return {
        success: false,
        error: `Minimum amount for ${cryptocurrency.toUpperCase()} is ${minAmount}`,
      }
    }

    // Get estimated price first
    const estimate = await getEstimatedPrice(NOWPAYMENTS_API_KEY, amount, "usd", cryptocurrency)

    // Create payment using NowPayments
    const payment = await createPayment(
      NOWPAYMENTS_API_KEY,
      amount,
      "usd",
      cryptocurrency,
      `deposit-${companyId}-${Date.now()}`,
      `Deposit for company ${companyId}`,
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/nowpayments`,
    )

    // Record transaction
    const { error: transactionError } = await supabase.from("payment_transactions").insert({
      company_id: companyId,
      amount,
      currency: "USD",
      transaction_type: "deposit",
      status: payment.payment_status || "waiting",
      payment_id: payment.payment_id,
      payment_details: {
        ...payment,
        estimated_amount: estimate.estimated_amount,
        pay_currency: cryptocurrency,
      },
    })

    if (transactionError) throw transactionError

    return {
      success: true,
      payment: {
        paymentId: payment.payment_id,
        paymentStatus: payment.payment_status,
        payAddress: payment.pay_address,
        payAmount: payment.pay_amount,
        payCurrency: payment.pay_currency,
        priceAmount: payment.price_amount,
        priceCurrency: payment.price_currency,
        expirationDate: payment.expiration_estimate_date,
        payinExtraId: payment.payin_extra_id,
        network: payment.network,
      },
    }
  } catch (error) {
    console.error("Error creating deposit payment:", error)
    return { success: false, error: error.message }
  }
}

// Check payment status and update balance
export async function checkPaymentStatus(paymentId: string) {
  const supabase = createServerComponentClient({ cookies })

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

    // Map NowPayments status to our status
    const newStatus = paymentStatus.payment_status

    // Update transaction
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: newStatus,
        payment_details: paymentStatus,
      })
      .eq("payment_id", paymentId)

    if (updateError) throw updateError

    // If payment is finished, update company balance
    if (newStatus === "finished" && transaction.transaction_type === "deposit") {
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

// Process withdrawal
export async function processWithdrawal(companyId: string, amount: number, cryptocurrency: string, address: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    // Validate minimum amount
    if (!validateMinimumAmount(cryptocurrency, amount)) {
      const minAmount = getMinimumAmount(cryptocurrency)
      return {
        success: false,
        error: `Minimum amount for ${cryptocurrency.toUpperCase()} is ${minAmount}`,
      }
    }

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
        amount: -amount,
        currency: "USD",
        transaction_type: "withdraw",
        status: "finished", // For demo purposes
        payment_details: {
          address,
          cryptocurrency,
          note: "Manual withdrawal",
        },
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
  const supabase = createServerComponentClient({ cookies })

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

// Get supported cryptocurrencies
export async function getSupportedCryptocurrencies() {
  return {
    success: true,
    cryptocurrencies: SUPPORTED_CRYPTOCURRENCIES,
  }
}

// Get estimated price for amount
export async function getEstimatedCryptoPrice(amount: number, cryptocurrency: string) {
  try {
    const estimate = await getEstimatedPrice(NOWPAYMENTS_API_KEY, amount, "usd", cryptocurrency)
    return {
      success: true,
      estimate,
    }
  } catch (error) {
    console.error("Error getting estimated price:", error)
    return { success: false, error: error.message }
  }
}
