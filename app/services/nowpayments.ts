// NowPayments API service - Updated according to official documentation

const API_BASE_URL = "https://api.nowpayments.io/v1"

// Function to get JWT token
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

// Function to create a subscription plan
export async function createSubscriptionPlan(
  token: string,
  title: string,
  intervalDays = 30,
  amount = 10,
  currency = "USD",
) {
  try {
    const response = await fetch(`${API_BASE_URL}/subscriptions/plans`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        interval_day: intervalDays,
        amount,
        currency: currency.toLowerCase(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Plan creation error:", errorData)
      throw new Error(`Failed to create plan: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error("Error creating subscription plan:", error)
    throw error
  }
}

// Function to update a subscription plan
export async function updateSubscriptionPlan(
  token: string,
  planId: string,
  updates: {
    title?: string
    interval_day?: number
    amount?: number
    currency?: string
  },
) {
  try {
    const response = await fetch(`${API_BASE_URL}/subscriptions/plans/${planId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Plan update error:", errorData)
      throw new Error(`Failed to update plan: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error("Error updating subscription plan:", error)
    throw error
  }
}

// Function to create a subscription
export async function createSubscription(
  token: string,
  apiKey: string,
  subscriptionPlanId: string,
  subPartnerId?: string,
) {
  try {
    const body: any = {
      subscription_plan_id: subscriptionPlanId,
    }

    if (subPartnerId) {
      body.sub_partner_id = subPartnerId
    }

    const response = await fetch(`${API_BASE_URL}/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Subscription creation error:", errorData)
      throw new Error(`Failed to create subscription: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error("Error creating subscription:", error)
    throw error
  }
}

// Function to get subscription details
export async function getSubscription(apiKey: string, subscriptionId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Get subscription error:", errorData)
      throw new Error(`Failed to get subscription: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error("Error getting subscription:", error)
    throw error
  }
}

// Function to create a simple payment (not subscription)
export async function createPayment(apiKey: string, amount: number, currency = "USD", orderId?: string) {
  try {
    const body: any = {
      price_amount: amount,
      price_currency: currency.toLowerCase(),
      pay_currency: "btc", // Default to Bitcoin, can be changed
    }

    if (orderId) {
      body.order_id = orderId
    }

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
    return data.currencies
  } catch (error) {
    console.error("Error getting currencies:", error)
    throw error
  }
}

// Function to estimate payment amount
export async function estimatePayment(apiKey: string, amount: number, currencyFrom = "usd", currencyTo = "btc") {
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
      console.error("Estimate payment error:", errorData)
      throw new Error(`Failed to estimate payment: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error estimating payment:", error)
    throw error
  }
}
