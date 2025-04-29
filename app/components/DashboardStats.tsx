"use client"

import { useTheme } from "next-themes"
import { useLanguage } from "../context/LanguageContext"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function DashboardStats({ attendanceTrend }) {
  const { theme } = useTheme()
  const { language } = useLanguage()

  // Format dates for display
  const formattedData = attendanceTrend.map((item) => {
    const date = new Date(item.date)
    const formattedDate = date.toLocaleDateString(language === "en" ? "en-US" : language === "ru" ? "ru-RU" : "uz-UZ", {
      weekday: "short",
      day: "numeric",
    })

    return {
      ...item,
      formattedDate,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#374151" : "#e5e7eb"} />
        <XAxis dataKey="formattedDate" stroke={theme === "dark" ? "#e5e7eb" : "#374151"} tick={{ fontSize: 12 }} />
        <YAxis stroke={theme === "dark" ? "#e5e7eb" : "#374151"} tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
            color: theme === "dark" ? "#e5e7eb" : "#374151",
            border: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`,
          }}
          formatter={(value) => [value, "Employees"]}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} name="Employees Present" />
      </BarChart>
    </ResponsiveContainer>
  )
}
