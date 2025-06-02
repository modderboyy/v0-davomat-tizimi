// NowPayments API service

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
      throw new Error(`Failed to get token: ${response.status}`)
    }

    const data = await response.json()
    return data.token
  } catch (error) {
    console.error("Error getting NowPayments token:", error)
    throw error
  }
}

// Function to create a sub-partner account
export async function createSubPartnerAccount(token: string, companyName: string) {
  try {
    // Ensure company name doesn't exceed 30 characters
    const name = companyName.substring(0, 30)

    const response = await fetch(`${API_BASE_URL}/sub-partner/balance`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create account: ${response.status}`)
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error("Error creating sub-partner account:", error)
    throw error
  }
}

// Function to create a subscription
export async function createSubscription(
  token: string,
  apiKey: string,
  subscriptionPlanId: string,
  subPartnerId: string,
) {
  try {
    const response = await fetch(`${API_BASE_URL}/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription_plan_id: subscriptionPlanId,
        sub_partner_id: subPartnerId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create subscription: ${response.status}`)
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error("Error creating subscription:", error)
    throw error
  }
}

// Function to get sub-partner balance
export async function getSubPartnerBalance(token: string, subPartnerId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/sub-partner/balance/${subPartnerId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get balance: ${response.status}`)
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error("Error getting sub-partner balance:", error)
    throw error
  }
}

// Function to create a deposit link
export async function createDepositLink(token: string, subPartnerId: string, amount: number, currency = "USD") {
  try {
    const response = await fetch(`${API_BASE_URL}/sub-partner/deposit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sub_partner_id: subPartnerId,
        amount,
        currency,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create deposit link: ${response.status}`)
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error("Error creating deposit link:", error)
    throw error
  }
}

// Function to withdraw funds
export async function withdrawFunds(
  token: string,
  subPartnerId: string,
  amount: number,
  currency = "USD",
  address: string,
) {
  try {
    const response = await fetch(`${API_BASE_URL}/sub-partner/withdraw`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sub_partner_id: subPartnerId,
        amount,
        currency,
        address,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to withdraw funds: ${response.status}`)
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error("Error withdrawing funds:", error)
    throw error
  }
}
