// NOWPayments Custody API service - Complete implementation

const API_BASE_URL = "https://api.nowpayments.io/v1"

// Get JWT token for custody operations
export async function getNowPaymentsToken(email: string, password: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Token error response:", errorData)
      throw new Error(`Failed to get token: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data.token
  } catch (error) {
    console.error("Error getting NowPayments token:", error)
    throw error
  }
}

// Create sub-partner account (custody account for company)
export async function createSubPartnerAccount(token: string, companyName: string) {
  try {
    // Ensure company name doesn't exceed 30 characters and is unique
    const name = `${companyName.substring(0, 20)}_${Date.now().toString().slice(-6)}`

    const response = await fetch(`${API_BASE_URL}/sub-partner/balance`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Sub-partner creation error:", errorData)
      throw new Error(`Failed to create sub-partner account: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error("Error creating sub-partner account:", error)
    throw error
  }
}

// Get sub-partner balance (real balance from NOWPayments)
export async function getSubPartnerBalance(apiKey: string, subPartnerId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/sub-partner/balance/${subPartnerId}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Get balance error:", errorData)
      throw new Error(`Failed to get balance: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error("Error getting sub-partner balance:", error)
    throw error
  }
}

// Create deposit payment for sub-partner
export async function createSubPartnerDeposit(
  token: string,
  apiKey: string,
  subPartnerId: string,
  amount: number,
  currency = "usd",
  payCurrency = "btc",
) {
  try {
    const response = await fetch(`${API_BASE_URL}/sub-partner/deposit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sub_partner_id: subPartnerId,
        price_amount: amount,
        price_currency: currency.toLowerCase(),
        pay_currency: payCurrency.toLowerCase(),
        ipn_callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/nowpayments`,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Deposit creation error:", errorData)
      throw new Error(`Failed to create deposit: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error("Error creating sub-partner deposit:", error)
    throw error
  }
}

// Create payment for sub-partner
export async function createSubPartnerPayment(
  token: string,
  apiKey: string,
  subPartnerId: string,
  amount: number,
  currency = "usd",
  payCurrency = "btc",
) {
  try {
    const response = await fetch(`${API_BASE_URL}/sub-partner/payment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sub_partner_id: subPartnerId,
        price_amount: amount,
        price_currency: currency.toLowerCase(),
        pay_currency: payCurrency.toLowerCase(),
        ipn_callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/nowpayments`,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Payment creation error:", errorData)
      throw new Error(`Failed to create payment: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error("Error creating sub-partner payment:", error)
    throw error
  }
}

// Get available currencies with minimum amounts
export async function getAvailableCurrencies(apiKey: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/currencies`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Get currencies error:", errorData)
      throw new Error(`Failed to get currencies: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data.currencies || []
  } catch (error) {
    console.error("Error getting currencies:", error)
    throw error
  }
}

// Get minimum payment amount
export async function getMinimumPaymentAmount(apiKey: string, currencyFrom: string, currencyTo: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/min-amount?currency_from=${currencyFrom}&currency_to=${currencyTo}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Get minimum amount error:", errorData)
      throw new Error(`Failed to get minimum amount: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error getting minimum payment amount:", error)
    throw error
  }
}

// Get estimated price
export async function getEstimatedPrice(apiKey: string, amount: number, currencyFrom = "usd", currencyTo = "btc") {
  try {
    const response = await fetch(
      `${API_BASE_URL}/estimate?amount=${amount}&currency_from=${currencyFrom}&currency_to=${currencyTo}`,
      {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Estimate price error:", errorData)
      throw new Error(`Failed to estimate price: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error estimating price:", error)
    throw error
  }
}

// Validate withdrawal address
export async function validateAddress(apiKey: string, address: string, currency: string, extraId?: string) {
  try {
    const body: any = {
      address,
      currency: currency.toLowerCase(),
    }

    if (extraId) body.extra_id = extraId

    const response = await fetch(`${API_BASE_URL}/payout/validate-address`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Address validation error:", errorData)
      return { valid: false, error: errorData }
    }

    const data = await response.json()
    return { valid: data.status !== false, data }
  } catch (error) {
    console.error("Error validating address:", error)
    return { valid: false, error: error.message }
  }
}

// Create payout (withdrawal)
export async function createPayout(
  token: string,
  apiKey: string,
  address: string,
  currency: string,
  amount: number,
  extraId?: string,
) {
  try {
    const withdrawal: any = {
      address,
      currency: currency.toLowerCase(),
      amount,
    }

    if (extraId) withdrawal.extra_id = extraId

    const response = await fetch(`${API_BASE_URL}/payout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        withdrawals: [withdrawal],
        ipn_callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/nowpayments`,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Payout creation error:", errorData)
      throw new Error(`Failed to create payout: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error creating payout:", error)
    throw error
  }
}

// Get payment status
export async function getPaymentStatus(apiKey: string, paymentId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/payment/${paymentId}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Get payment status error:", errorData)
      throw new Error(`Failed to get payment status: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error getting payment status:", error)
    throw error
  }
}

// Get sub-partner transfers
export async function getSubPartnerTransfers(token: string, subPartnerId: string, limit = 10, page = 0) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sub-partner/transfers?sub_partner_id=${subPartnerId}&limit=${limit}&page=${page}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Get transfers error:", errorData)
      throw new Error(`Failed to get transfers: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error getting sub-partner transfers:", error)
    throw error
  }
}

// Write off from sub-partner account (for withdrawals)
export async function writeOffSubPartnerAccount(token: string, subPartnerId: string, amount: number, currency: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/sub-partner/write-off`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sub_partner_id: subPartnerId,
        amount,
        currency: currency.toLowerCase(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Write-off error:", errorData)
      throw new Error(`Failed to write off: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error("Error writing off sub-partner account:", error)
    throw error
  }
}
