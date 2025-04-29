"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useTheme } from "next-themes"
import { useLanguage } from "../context/LanguageContext"

export default function EmployeeChart({ attendanceData }) {
  const { theme } = useTheme()
  const { language } = useLanguage()

  const translations = {
    totalEmployees: {
      uz: "Jami xodimlar",
      en: "Total Employees",
      ru: "Всего сотрудников",
    },
    present: {
      uz: "Kelganlar",
      en: "Present",
      ru: "Присутствуют",
    },
    late: {
      uz: "Kechikkanlar",
      en: "Late",
      ru: "Опоздавшие",
    },
    onTime: {
      uz: "Vaqtida kelganlar",
      en: "On Time",
      ru: "Вовремя",
    },
    earlyLeave: {
      uz: "Ertachi ketganlar",
      en: "Early Leave",
      ru: "Ушли рано",
    },
    onTimeLeave: {
      uz: "Vaqtida ketganlar",
      en: "Left On Time",
      ru: "Ушли вовремя",
    },
    overview: {
      uz: "Umumiy",
      en: "Overview",
      ru: "Обзор",
    },
    details: {
      uz: "Batafsil",
      en: "Details",
      ru: "Детали",
    },
  }

  const t = (key) => translations[key][language] || key

  const totalEmployees = attendanceData.length
  const presentEmployees = attendanceData.filter((record) => record.kelish_vaqti).length
  const lateEmployees = attendanceData.filter((record) => record.isLate).length
  const onTimeEmployees = presentEmployees - lateEmployees
  const earlyLeaveEmployees = attendanceData.filter((record) => record.isEarlyLeave).length
  const onTimeLeaveEmployees = presentEmployees - earlyLeaveEmployees

  const chartData = [
    {
      name: t("overview"),
      [t("totalEmployees")]: totalEmployees,
      [t("present")]: presentEmployees,
    },
    {
      name: t("details"),
      [t("late")]: lateEmployees,
      [t("onTime")]: onTimeEmployees,
      [t("earlyLeave")]: earlyLeaveEmployees,
      [t("onTimeLeave")]: onTimeLeaveEmployees,
    },
  ]

  const colors = {
    [t("totalEmployees")]: "#6366F1",
    [t("present")]: "#8B5CF6",
    [t("late")]: "#EC4899",
    [t("onTime")]: "#10B981",
    [t("earlyLeave")]: "#F59E0B",
    [t("onTimeLeave")]: "#3B82F6",
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#374151" : "#e5e7eb"} />
        <XAxis type="number" stroke={theme === "dark" ? "#e5e7eb" : "#374151"} />
        <YAxis dataKey="name" type="category" stroke={theme === "dark" ? "#e5e7eb" : "#374151"} width={80} />
        <Tooltip
          contentStyle={{
            backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
            color: theme === "dark" ? "#e5e7eb" : "#374151",
            border: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`,
          }}
        />
        <Legend />
        {Object.keys(colors).map((key) => (
          <Bar key={key} dataKey={key} fill={colors[key]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
