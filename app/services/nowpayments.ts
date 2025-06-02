// NowPayments API service - Updated with correct endpoints and crypto support

const API_BASE_URL = "https://api.nowpayments.io/v1"

// Supported cryptocurrencies with minimum amounts
export const SUPPORTED_CRYPTOCURRENCIES = {
  btc: { name: "Bitcoin", symbol: "BTC", minAmount: 0.0001, network: "btc" },
  eth: { name: "Ethereum", symbol: "ETH", minAmount: 0.001, network: "eth" },
  usdt: { name: "Tether (ERC20)", symbol: "USDT", minAmount: 1, network: "eth" },
  usdttrc20: { name: "Tether (TRC20)", symbol: "USDT", minAmount: 1, network: "trx" },
  ltc: { name: "Litecoin", symbol: "LTC", minAmount: 0.001, network: "ltc" },
  trx: { name: "TRON", symbol: "TRX", minAmount: 1, network: "trx" },
  bnb: { name: "BNB", symbol: "BNB", minAmount: 0.001, network: "bsc" },
  ada: { name: "Cardano", symbol: "ADA", minAmount: 1, network: "ada" },
  dot: { name: "Polkadot", symbol: "DOT", minAmount: 0.1, network: "dot" },
  matic: { name: "Polygon", symbol: "MATIC", minAmount: 1, network: "matic" },
}

// Function to get available currencies
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

// Function to get estimated price
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

// Function to create a payment
export async function createPayment(
  apiKey: string,
  priceAmount: number,
  priceCurrency = "usd",
  payCurrency = "btc",
  orderId?: string,
  orderDescription?: string,
  ipnCallbackUrl?: string,
) {
  try {
    const body: any = {
      price_amount: priceAmount,
      price_currency: priceCurrency.toLowerCase(),
      pay_currency: payCurrency.toLowerCase(),
    }

    if (orderId) body.order_id = orderId
    if (orderDescription) body.order_description = orderDescription
    if (ipnCallbackUrl) body.ipn_callback_url = ipnCallbackUrl

    const response = await fetch(`${API_BASE_URL}/payment`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Payment creation error:", errorData)
      throw new Error(`Failed to create payment: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error creating payment:", error)
    throw error
  }
}

// Function to get payment status
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

// Function to get list of payments
export async function getPaymentsList(apiKey: string, limit = 10, page = 0, sortBy = "created_at", orderBy = "desc") {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString(),
      sortBy,
      orderBy,
    })

    const response = await fetch(`${API_BASE_URL}/payment/?${params}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Get payments list error:", errorData)
      throw new Error(`Failed to get payments list: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error getting payments list:", error)
    throw error
  }
}

// Function to validate minimum amount for cryptocurrency
export function validateMinimumAmount(currency: string, amount: number): boolean {
  const crypto = SUPPORTED_CRYPTOCURRENCIES[currency.toLowerCase()]
  if (!crypto) return false
  return amount >= crypto.minAmount
}

// Function to get minimum amount for cryptocurrency
export function getMinimumAmount(currency: string): number {
  const crypto = SUPPORTED_CRYPTOCURRENCIES[currency.toLowerCase()]
  return crypto ? crypto.minAmount : 0
}

// Function to format crypto amount
export function formatCryptoAmount(amount: number, currency: string): string {
  const crypto = SUPPORTED_CRYPTOCURRENCIES[currency.toLowerCase()]
  if (!crypto) return amount.toString()

  // Different precision for different currencies
  if (["btc", "eth", "ltc"].includes(currency.toLowerCase())) {
    return amount.toFixed(8)
  } else if (["usdt", "usdttrc20"].includes(currency.toLowerCase())) {
    return amount.toFixed(2)
  } else {
    return amount.toFixed(4)
  }
}
