"use client"

import { PieChart as RechartsePieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts"
import { useTheme } from "next-themes"
import { useLanguage } from "../context/LanguageContext"

export default function PieChart({ attendanceData }) {
  const { theme } = useTheme()
  const { language } = useLanguage()

  const translations = {
    onTime: {
      uz: "Vaqtida kelganlar",
      en: "On Time",
      ru: "Вовремя",
    },
    late: {
      uz: "Kechikkanlar",
      en: "Late",
      ru: "Опоздавшие",
    },
    absent: {
      uz: "Kelmaganlar",
      en: "Absent",
      ru: "Отсутствуют",
    },
  }

  const t = (key) => translations[key][language] || key

  const totalEmployees = attendanceData.length
  const presentEmployees = attendanceData.filter((record) => record.kelish_vaqti).length
  const lateEmployees = attendanceData.filter((record) => record.isLate).length
  const onTimeEmployees = presentEmployees - lateEmployees
  const absentEmployees = totalEmployees - presentEmployees

  const data = [
    { name: t("onTime"), value: onTimeEmployees },
    { name: t("late"), value: lateEmployees },
    { name: t("absent"), value: absentEmployees },
  ]

  const COLORS = ["#10B981", "#F59E0B", "#EF4444"]

  const RADIAN = Math.PI / 180
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsePieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={150}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
            color: theme === "dark" ? "#e5e7eb" : "#374151",
            border: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`,
          }}
        />
        <Legend />
      </RechartsePieChart>
    </ResponsiveContainer>
  )
}
