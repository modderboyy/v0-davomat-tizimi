"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "../context/LanguageContext"
import { useDynamicIsland } from "./DynamicIsland"
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  ExternalLink,
} from "lucide-react"
import {
  createCompanyPaymentAccount,
  getCompanyBalance,
  createCompanyDepositLink,
  processWithdrawal,
  getTransactionHistory,
} from "../actions/balance-actions"

export default function BalanceManagement({ companyId }: { companyId: string }) {
  const [balance, setBalance] = useState(0)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawAddress, setWithdrawAddress] = useState("")
  const [depositLink, setDepositLink] = useState<string | null>(null)
  const [processingDeposit, setProcessingDeposit] = useState(false)
  const [processingWithdraw, setProcessingWithdraw] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { t } = useLanguage()
  const { showNotification } = useDynamicIsland()
  const supabase = createClientComponentClient()

  // Fetch balance and transaction history
  const fetchBalanceData = async () => {
    setLoading(true)
    try {
      // Get balance
      const balanceResult = await getCompanyBalance(companyId)
      if (balanceResult.success) {
        setBalance(balanceResult.balance)
        setAccountId(balanceResult.accountId)
      } else {
        setError(balanceResult.error)
      }

      // Get transaction history
      const transactionsResult = await getTransactionHistory(companyId)
      if (transactionsResult.success) {
        setTransactions(transactionsResult.transactions)
      }
    } catch (error) {
      console.error("Error fetching balance data:", error)
      setError("Failed to load balance data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBalanceData()
  }, [companyId])

  // Create payment account if not exists
  const handleCreateAccount = async () => {
    try {
      setLoading(true)

      // Get company name
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("company_name")
        .eq("id", companyId)
        .single()

      if (companyError) throw companyError

      const result = await createCompanyPaymentAccount(companyId, company.company_name)

      if (result.success) {
        showNotification("success", t("paymentAccountCreated"))
        setAccountId(result.accountId)
        fetchBalanceData()
      } else {
        showNotification("error", result.error)
      }
    } catch (error) {
      console.error("Error creating payment account:", error)
      showNotification("error", t("errorCreatingPaymentAccount"))
    } finally {
      setLoading(false)
    }
  }

  // Handle deposit
  const handleDeposit = async () => {
    try {
      setProcessingDeposit(true)
      setError(null)

      const amount = Number.parseFloat(depositAmount)
      if (isNaN(amount) || amount <= 0) {
        setError(t("invalidAmount"))
        return
      }

      const result = await createCompanyDepositLink(companyId, amount)

      if (result.success) {
        setDepositLink(result.depositLink)
        showNotification("success", t("depositLinkCreated"))
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error("Error creating deposit:", error)
      setError(t("errorCreatingDeposit"))
    } finally {
      setProcessingDeposit(false)
    }
  }

  // Handle withdraw
  const handleWithdraw = async () => {
    try {
      setProcessingWithdraw(true)
      setError(null)

      const amount = Number.parseFloat(withdrawAmount)
      if (isNaN(amount) || amount <= 0) {
        setError(t("invalidAmount"))
        return
      }

      if (!withdrawAddress.trim()) {
        setError(t("invalidAddress"))
        return
      }

      if (amount > balance) {
        setError(t("insufficientBalance"))
        return
      }

      const result = await processWithdrawal(companyId, amount, withdrawAddress)

      if (result.success) {
        showNotification("success", t("withdrawalProcessed"))
        setShowWithdrawModal(false)
        fetchBalanceData()
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error("Error processing withdrawal:", error)
      setError(t("errorProcessingWithdrawal"))
    } finally {
      setProcessingWithdraw(false)
    }
  }

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showNotification("success", t("copiedToClipboard"))
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Format amount with sign
  const formatAmount = (amount: number, type: string) => {
    if (type === "withdraw") {
      return `-$${Math.abs(amount).toFixed(2)}`
    }
    return `+$${amount.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("balanceManagement")}</h2>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Balance Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                {t("currentBalance")}
              </h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">${balance.toFixed(2)}</p>

              {accountId && (
                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span className="mr-2">{t("accountId")}:</span>
                  <span className="font-mono">{accountId}</span>
                  <button
                    onClick={() => copyToClipboard(accountId)}
                    className="ml-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {!accountId ? (
                <button
                  onClick={handleCreateAccount}
                  className="btn btn-primary flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                  {t("createPaymentAccount")}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowDepositModal(true)}
                    className="btn btn-primary flex items-center justify-center gap-2"
                  >
                    <ArrowDownLeft className="h-5 w-5" />
                    {t("deposit")}
                  </button>
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    className="btn btn-outline flex items-center justify-center gap-2"
                  >
                    <ArrowUpRight className="h-5 w-5" />
                    {t("withdraw")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">{t("transactionHistory")}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("date")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("type")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("amount")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("status")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("paymentId")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.transaction_type === "deposit"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        }`}
                      >
                        {transaction.transaction_type === "deposit" ? (
                          <ArrowDownLeft className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        )}
                        {t(transaction.transaction_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span
                        className={
                          transaction.transaction_type === "deposit"
                            ? "text-green-600 dark:text-green-400"
                            : "text-blue-600 dark:text-blue-400"
                        }
                      >
                        {formatAmount(transaction.amount, transaction.transaction_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : transaction.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {transaction.status === "completed" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : transaction.status === "pending" ? (
                          <Clock className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {t(transaction.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {transaction.payment_id || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {t("noTransactionsFound")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{t("deposit")}</h3>

            {depositLink ? (
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">{t("depositLinkCreated")}</p>

                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg break-all">
                  <a
                    href={depositLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
                  >
                    {depositLink.substring(0, 50)}...
                    <ExternalLink className="h-4 w-4 ml-1 flex-shrink-0" />
                  </a>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => copyToClipboard(depositLink)}
                    className="btn btn-outline flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {t("copyLink")}
                  </button>

                  <button
                    onClick={() => {
                      window.open(depositLink, "_blank")
                    }}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t("openLink")}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowDepositModal(false)
                    setDepositLink(null)
                    setDepositAmount("")
                  }}
                  className="btn btn-outline w-full mt-4"
                >
                  {t("close")}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="depositAmount"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {t("amount")} (USD)
                  </label>
                  <input
                    type="number"
                    id="depositAmount"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="input"
                    placeholder="100.00"
                    min="1"
                    step="0.01"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDepositModal(false)
                      setDepositAmount("")
                      setError(null)
                    }}
                    className="btn btn-outline"
                  >
                    {t("cancel")}
                  </button>

                  <button
                    onClick={handleDeposit}
                    className="btn btn-primary flex items-center gap-2"
                    disabled={processingDeposit || !depositAmount}
                  >
                    {processingDeposit ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4" />
                    )}
                    {t("createDepositLink")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{t("withdraw")}</h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="withdrawAmount"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t("amount")} (USD)
                </label>
                <input
                  type="number"
                  id="withdrawAmount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="input"
                  placeholder="100.00"
                  min="1"
                  max={balance}
                  step="0.01"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t("availableBalance")}: ${balance.toFixed(2)}
                </p>
              </div>

              <div>
                <label
                  htmlFor="withdrawAddress"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t("cryptoAddress")}
                </label>
                <input
                  type="text"
                  id="withdrawAddress"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="input"
                  placeholder="0x..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("withdrawAddressDescription")}</p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowWithdrawModal(false)
                    setWithdrawAmount("")
                    setWithdrawAddress("")
                    setError(null)
                  }}
                  className="btn btn-outline"
                >
                  {t("cancel")}
                </button>

                <button
                  onClick={handleWithdraw}
                  className="btn btn-primary flex items-center gap-2"
                  disabled={
                    processingWithdraw ||
                    !withdrawAmount ||
                    !withdrawAddress ||
                    Number.parseFloat(withdrawAmount) > balance
                  }
                >
                  {processingWithdraw ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                  {t("processWithdrawal")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
