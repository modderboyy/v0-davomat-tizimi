"use client"

import type React from "react"

import { useState } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { useLanguage } from "../context/LanguageContext"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, FileText, DollarSign, TrendingUp, Filter } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: string
  status: "pending" | "approved" | "rejected"
}

const ExpenseManagement = () => {
  const { t } = useLanguage()
  const supabase = useSupabaseClient()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [newExpense, setNewExpense] = useState({
    amount: "",
    category: "",
    description: "",
  })

  // Sample expense categories
  const categories = ["office_supplies", "travel", "meals", "equipment", "software", "other"]

  // Sample expenses data
  const sampleExpenses: Expense[] = [
    {
      id: "1",
      amount: 125.5,
      category: "office_supplies",
      description: "Office stationery and supplies",
      date: "2025-05-28",
      status: "approved",
    },
    {
      id: "2",
      amount: 450.0,
      category: "travel",
      description: "Business trip to client meeting",
      date: "2025-05-25",
      status: "pending",
    },
    {
      id: "3",
      amount: 75.25,
      category: "meals",
      description: "Team lunch meeting",
      date: "2025-05-22",
      status: "approved",
    },
  ]

  // Load expenses on component mount
  useState(() => {
    setExpenses(sampleExpenses)
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewExpense({ ...newExpense, [name]: value })
  }

  const handleCategoryChange = (value: string) => {
    setNewExpense({ ...newExpense, category: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // In a real implementation, this would be a Supabase insert
      const newId = (expenses.length + 1).toString()
      const expense: Expense = {
        id: newId,
        amount: Number.parseFloat(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description,
        date: new Date().toISOString().split("T")[0],
        status: "pending",
      }

      setExpenses([expense, ...expenses])
      setNewExpense({ amount: "", category: "", description: "" })
      toast({
        title: t("expense_submitted"),
        description: t("expense_review_message"),
      })
    } catch (error) {
      console.error("Error submitting expense:", error)
      toast({
        title: t("error"),
        description: t("expense_submit_error"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("expense_management")}</h2>
          <p className="text-muted-foreground">{t("expense_management_description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            {t("export_report")}
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            {t("filter")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("total_expenses")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{t("month_to_date")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("pending_approvals")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.filter((e) => e.status === "pending").length}</div>
            <p className="text-xs text-muted-foreground">{t("requires_review")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("approved_expenses")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {expenses
                .filter((e) => e.status === "approved")
                .reduce((sum, expense) => sum + expense.amount, 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{t("month_to_date")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("submit_expense")}</CardTitle>
            <CardDescription>{t("submit_expense_description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">{t("amount")}</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-9"
                    value={newExpense.amount}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">{t("category")}</Label>
                <Select value={newExpense.category} onValueChange={handleCategoryChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_category")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {t(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t("description")}</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder={t("expense_description_placeholder")}
                  value={newExpense.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {loading ? t("submitting") : t("submit_expense")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("recent_expenses")}</CardTitle>
            <CardDescription>{t("recent_expenses_description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("amount")}</TableHead>
                  <TableHead>{t("category")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.slice(0, 5).map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell>${expense.amount.toFixed(2)}</TableCell>
                    <TableCell>{t(expense.category)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          expense.status === "approved"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : expense.status === "rejected"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        }`}
                      >
                        {t(expense.status)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              {t("view_all_expenses")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default ExpenseManagement
