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
  getSubPartnerTransfers,
} from "../services/nowpayments-custody"

// Environment variables
const NOWPAYMENTS_EMAIL = process.env.NOWPAYMENTS_EMAIL || ""
const NOWPAYMENTS_PASSWORD = process.env.NOWPAYMENTS_PASSWORD || ""
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || ""

// Create custody account for company
export async function createCompanyCustodyAccount(companyId: string, companyName: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    // Get JWT token
    const token = await getNowPaymentsToken(NOWPAYMENTS_EMAIL, NOWPAYMENTS_PASSWORD)

    // Create sub-partner account
    const account = await createSubPartnerAccount(token, companyName)

    // Update company record with custody account ID
    const { error } = await supabase
      .from("companies")
      .update({
        custody_account_id: account.id,
        custody_account_name: account.name,
      })
      .eq("id", companyId)

    if (error) throw error

    return { success: true, account }
  } catch (error) {
    console.error("Error creating custody account:", error)
    return { success: false, error: error.message }
  }
}

// Get real company balance from NOWPayments
export async function getCompanyRealBalance(companyId: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    // Get company custody account ID
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("custody_account_id")
      .eq("id", companyId)
      .single()

    if (companyError) throw companyError

    if (!company.custody_account_id) {
      return { success: false, error: "No custody account found for this company" }
    }

    // Get real balance from NOWPayments
    const balanceData = await getSubPartnerBalance(NOWPAYMENTS_API_KEY, company.custody_account_id)

    return {
      success: true,
      balances: balanceData.balances,
      subPartnerId: balanceData.subPartnerId,
    }
  } catch (error) {
    console.error("Error getting company real balance:", error)
    return { success: false, error: error.message }
  }
}

// Get available cryptocurrencies with real data from API
export async function getAvailableCryptocurrencies() {
  try {
    const currencies = await getAvailableCurrencies(NOWPAYMENTS_API_KEY)
    return { success: true, currencies }
  } catch (error) {
    console.error("Error getting available cryptocurrencies:", error)
    return { success: false, error: error.message }
  }
}

// Get minimum amounts and fees for specific currency pair
export async function getCurrencyLimitsAndFees(currencyFrom: string, currencyTo: string) {
  try {
    const minAmount = await getMinimumPaymentAmount(NOWPAYMENTS_API_KEY, currencyFrom, currencyTo)
    return { success: true, minAmount }
  } catch (error) {
    console.error("Error getting currency limits:", error)
    return { success: false, error: error.message }
  }
}

// Create real deposit for company
export async function createCompanyRealDeposit(companyId: string, amount: number, cryptocurrency: string) {
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
      return { success: false, error: "No custody account found for this company" }
    }

    // Check minimum amount
    const minAmountData = await getMinimumPaymentAmount(NOWPAYMENTS_API_KEY, "usd", cryptocurrency)
    if (amount < minAmountData.min_amount) {
      return {
        success: false,
        error: `Minimum amount is ${minAmountData.min_amount} USD`,
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
      amount,
      currency: "USD",
      crypto_currency: cryptocurrency,
      status: deposit.payment_status || "waiting",
      nowpayments_payment_id: deposit.payment_id,
      payment_details: deposit,
    })

    if (transactionError) throw transactionError

    return {
      success: true,
      deposit: {
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
    console.error("Error creating real deposit:", error)
    return { success: false, error: error.message }
  }
}

// Create real withdrawal for company
export async function createCompanyRealWithdrawal(
  companyId: string,
  amount: number,
  cryptocurrency: string,
  address: string,
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
      return { success: false, error: "No custody account found for this company" }
    }

    // Validate address
    const addressValidation = await validateAddress(NOWPAYMENTS_API_KEY, address, cryptocurrency, extraId)
    if (!addressValidation.valid) {
      return { success: false, error: "Invalid withdrawal address" }
    }

    // Get real balance to check if sufficient
    const balanceData = await getSubPartnerBalance(NOWPAYMENTS_API_KEY, company.custody_account_id)
    const currencyBalance = balanceData.balances[cryptocurrency.toLowerCase()]

    if (!currencyBalance || currencyBalance.amount < amount) {
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
      amount: -amount,
      currency: cryptocurrency.toUpperCase(),
      crypto_currency: cryptocurrency,
      status: "pending",
      withdrawal_address: address,
      withdrawal_extra_id: extraId,
      payment_details: payout,
    })

    if (transactionError) throw transactionError

    return {
      success: true,
      withdrawal: payout.withdrawals[0],
    }
  } catch (error) {
    console.error("Error creating real withdrawal:", error)
    return { success: false, error: error.message }
  }
}

// Get real transaction history from NOWPayments
export async function getCompanyRealTransactions(companyId: string) {
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
      return { success: false, error: "No custody account found for this company" }
    }

    // Get JWT token
    const token = await getNowPaymentsToken(NOWPAYMENTS_EMAIL, NOWPAYMENTS_PASSWORD)

    // Get transfers from NOWPayments
    const transfersData = await getSubPartnerTransfers(token, company.custody_account_id)

    // Get local transactions
    const { data: localTransactions, error: localError } = await supabase
      .from("custody_transactions")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })

    if (localError) throw localError

    return {
      success: true,
      realTransfers: transfersData,
      localTransactions: localTransactions || [],
    }
  } catch (error) {
    console.error("Error getting real transactions:", error)
    return { success: false, error: error.message }
  }
}

// Get estimated price for deposit
export async function getDepositEstimate(amount: number, cryptocurrency: string) {
  try {
    const estimate = await getEstimatedPrice(NOWPAYMENTS_API_KEY, amount, "usd", cryptocurrency)
    return { success: true, estimate }
  } catch (error) {
    console.error("Error getting deposit estimate:", error)
    return { success: false, error: error.message }
  }
}
