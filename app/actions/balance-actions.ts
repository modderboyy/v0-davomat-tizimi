"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import {
  getNowPaymentsToken,
  createSubPartnerAccount,
  getSubPartnerBalance,
  createSubPartnerDeposit,
  getAvailableCurrencies,
  getMinimumPaymentAmount,
  getEstimatedPrice,
  validateAddress,
  createPayout,
  writeOffSubPartnerAccount,
} from "../services/nowpayments-custody"

// Environment variables
const NOWPAYMENTS_EMAIL = process.env.NOWPAYMENTS_EMAIL || ""
const NOWPAYMENTS_PASSWORD = process.env.NOWPAYMENTS_PASSWORD || ""
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || ""

// Create custody account for company (legacy compatibility)
export async function createCompanySubscriptionPlan(companyId: string, companyName: string) {
  return await createCompanyCustodyAccount(companyId, companyName)
}

// Create custody account for company
export async function createCompanyCustodyAccount(companyId: string, companyName: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    // Get JWT token
    const token = await getNowPaymentsToken(NOWPAYMENTS_EMAIL, NOWPAYMENTS_PASSWORD)

    // Create sub-partner account
    const account = await createSubPartnerAccount(token, companyName)

    // Update company record with custody account ID (string values only)
    const { error } = await supabase
      .from("companies")
      .update({
        custody_account_id: account.id,
        custody_account_name: account.name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", companyId)

    if (error) {
      console.error("Database update error:", error)
      throw error
    }

    return {
      success: true,
      planId: account.id,
      accountId: account.id,
      account,
    }
  } catch (error) {
    console.error("Error creating custody account:", error)
    return { success: false, error: error.message }
  }
}

// Get company balance from NOWPayments
export async function getCompanyBalance(companyId: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    // Get company custody account ID
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("custody_account_id, custody_account_name")
      .eq("id", companyId)
      .single()

    if (companyError) {
      console.error("Company fetch error:", companyError)
      throw companyError
    }

    if (!company.custody_account_id) {
      return {
        success: true,
        balance: 0,
        accountId: null,
        balances: {},
      }
    }

    // Get real balance from NOWPayments
    const balanceData = await getSubPartnerBalance(NOWPAYMENTS_API_KEY, company.custody_account_id)

    // Calculate total USD balance
    let totalUsdBalance = 0
    const balances = balanceData.balances || {}

    // Sum up all balances (convert to USD if needed)
    for (const [currency, balance] of Object.entries(balances)) {
      if (typeof balance === "object" && balance.amount) {
        totalUsdBalance += balance.amount || 0
      }
    }

    return {
      success: true,
      balance: totalUsdBalance,
      accountId: company.custody_account_id,
      balances: balances,
    }
  } catch (error) {
    console.error("Error getting company balance:", error)
    return {
      success: false,
      error: error.message,
      balance: 0,
      accountId: null,
    }
  }
}

// Create deposit payment
export async function createCompanyDepositPayment(companyId: string, amount: number, cryptocurrency = "btc") {
  const supabase = createServerComponentClient({ cookies })

  try {
    // Get company custody account
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("custody_account_id, company_name")
      .eq("id", companyId)
      .single()

    if (companyError) throw companyError

    if (!company.custody_account_id) {
      return { success: false, error: "No custody account found. Please create an account first." }
    }

    // Check minimum amount
    const minAmountData = await getMinimumPaymentAmount(NOWPAYMENTS_API_KEY, "usd", cryptocurrency)
    if (amount < (minAmountData.min_amount || 1)) {
      return {
        success: false,
        error: `Minimum amount is ${minAmountData.min_amount || 1} USD`,
      }
    }

    // Get JWT token
    const token = await getNowPaymentsToken(NOWPAYMENTS_EMAIL, NOWPAYMENTS_PASSWORD)

    // Create deposit
    const deposit = await createSubPartnerDeposit(
      token,
      NOWPAYMENTS_API_KEY,
      company.custody_account_id,
      amount,
      "usd",
      cryptocurrency,
    )

    // Record transaction in database
    const { error: transactionError } = await supabase.from("custody_transactions").insert({
      company_id: companyId,
      custody_account_id: company.custody_account_id,
      transaction_type: "deposit",
      amount: amount,
      currency: "USD",
      crypto_currency: cryptocurrency,
      status: deposit.payment_status || "waiting",
      nowpayments_payment_id: deposit.payment_id?.toString(),
      payment_details: deposit,
    })

    if (transactionError) {
      console.error("Transaction record error:", transactionError)
      // Don't fail the whole operation for this
    }

    return {
      success: true,
      paymentUrl: `https://nowpayments.io/payment/?iid=${deposit.payment_id}`,
      payment: {
        paymentId: deposit.payment_id,
        payAddress: deposit.pay_address,
        payAmount: deposit.pay_amount,
        payCurrency: deposit.pay_currency,
        payinExtraId: deposit.payin_extra_id,
        expirationDate: deposit.expiration_estimate_date,
        status: deposit.payment_status,
      },
    }
  } catch (error) {
    console.error("Error creating deposit payment:", error)
    return { success: false, error: error.message }
  }
}

// Process withdrawal
export async function processWithdrawal(
  companyId: string,
  amount: number,
  address: string,
  cryptocurrency = "btc",
  extraId?: string,
) {
  const supabase = createServerComponentClient({ cookies })

  try {
    // Get company custody account
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("custody_account_id")
      .eq("id", companyId)
      .single()

    if (companyError) throw companyError

    if (!company.custody_account_id) {
      return { success: false, error: "No custody account found" }
    }

    // Validate address
    const addressValidation = await validateAddress(NOWPAYMENTS_API_KEY, address, cryptocurrency, extraId)
    if (!addressValidation.valid) {
      return { success: false, error: "Invalid withdrawal address" }
    }

    // Get real balance to check if sufficient
    const balanceData = await getSubPartnerBalance(NOWPAYMENTS_API_KEY, company.custody_account_id)
    const currencyBalance = balanceData.balances[cryptocurrency.toLowerCase()]

    if (!currencyBalance || (currencyBalance.amount || 0) < amount) {
      return { success: false, error: "Insufficient balance" }
    }

    // Get JWT token
    const token = await getNowPaymentsToken(NOWPAYMENTS_EMAIL, NOWPAYMENTS_PASSWORD)

    // Write off from sub-partner account first
    await writeOffSubPartnerAccount(token, company.custody_account_id, amount, cryptocurrency)

    // Create payout
    const payout = await createPayout(token, NOWPAYMENTS_API_KEY, address, cryptocurrency, amount, extraId)

    // Record transaction in database
    const { error: transactionError } = await supabase.from("custody_transactions").insert({
      company_id: companyId,
      custody_account_id: company.custody_account_id,
      transaction_type: "withdrawal",
      amount: amount, // Store as positive number
      currency: cryptocurrency.toUpperCase(),
      crypto_currency: cryptocurrency,
      status: "pending",
      withdrawal_address: address,
      withdrawal_extra_id: extraId,
      payment_details: payout,
    })

    if (transactionError) {
      console.error("Transaction record error:", transactionError)
    }

    return {
      success: true,
      withdrawal: payout.withdrawals?.[0] || payout,
    }
  } catch (error) {
    console.error("Error processing withdrawal:", error)
    return { success: false, error: error.message }
  }
}

// Get transaction history
export async function getTransactionHistory(companyId: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    // Get local transactions
    const { data: transactions, error } = await supabase
      .from("custody_transactions")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error

    return {
      success: true,
      transactions: transactions || [],
    }
  } catch (error) {
    console.error("Error getting transaction history:", error)
    return { success: false, error: error.message, transactions: [] }
  }
}

// Get available cryptocurrencies
export async function getAvailableCryptocurrencies() {
  try {
    const currencies = await getAvailableCurrencies(NOWPAYMENTS_API_KEY)
    return { success: true, currencies: currencies || [] }
  } catch (error) {
    console.error("Error getting available cryptocurrencies:", error)
    return { success: false, error: error.message, currencies: [] }
  }
}

// Get minimum amounts and fees
export async function getCurrencyLimitsAndFees(currencyFrom: string, currencyTo: string) {
  try {
    const minAmount = await getMinimumPaymentAmount(NOWPAYMENTS_API_KEY, currencyFrom, currencyTo)
    return { success: true, minAmount }
  } catch (error) {
    console.error("Error getting currency limits:", error)
    return { success: false, error: error.message }
  }
}

// Get deposit estimate
export async function getDepositEstimate(amount: number, cryptocurrency: string) {
  try {
    const estimate = await getEstimatedPrice(NOWPAYMENTS_API_KEY, amount, "usd", cryptocurrency)
    return { success: true, estimate }
  } catch (error) {
    console.error("Error getting deposit estimate:", error)
    return { success: false, error: error.message }
  }
}
