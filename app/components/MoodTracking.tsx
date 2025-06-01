"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "../context/LanguageContext"
import { useDynamicIsland } from "./DynamicIsland"
import { Heart, TrendingUp, Users, Smile, Frown, Meh } from "lucide-react"
import { motion } from "framer-motion"

export default function MoodTracking({ companyId }) {
  const [employees, setEmployees] = useState([])
  const [moodData, setMoodData] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [moodStats, setMoodStats] = useState({
    averageMood: 0,
    totalResponses: 0,
    moodDistribution: {},
  })
  const [loading, setLoading] = useState(true)

  const { t } = useLanguage()
  const { showNotification } = useDynamicIsland()
  const supabase = createClientComponentClient()

  const moodEmojis = {
    1: { emoji: "😢", label: t("veryBad"), color: "text-red-500" },
    2: { emoji: "😞", label: t("bad"), color: "text-orange-500" },
    3: { emoji: "😐", label: t("neutral"), color: "text-yellow-500" },
    4: { emoji: "😊", label: t("good"), color: "text-green-500" },
    5: { emoji: "😄", label: t("excellent"), color: "text-blue-500" },
  }

  useEffect(() => {
    fetchEmployees()
    fetchMoodData()
  }, [selectedDate])

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, lavozim")
        .eq("company_id", companyId)
        .eq("is_super_admin", false)
        .eq("archived", false)

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error("Error fetching employees:", error)
      showNotification("error", t("errorFetchingEmployees"))
    }
  }

  const fetchMoodData = async () => {
    try {
      setLoading(true)
      const formattedDate = selectedDate.toISOString().split("T")[0]

      const { data, error } = await supabase
        .from("employee_mood")
        .select("*, users:employee_id(name, lavozim)")
        .eq("company_id", companyId)
        .eq("date", formattedDate)

      if (error) throw error

      setMoodData(data || [])
      calculateMoodStats(data || [])
    } catch (error) {
      console.error("Error fetching mood data:", error)
      showNotification("error", t("errorFetchingMoodData"))
    } finally {
      setLoading(false)
    }
  }

  const calculateMoodStats = (data) => {
    if (data.length === 0) {
      setMoodStats({ averageMood: 0, totalResponses: 0, moodDistribution: {} })
      return
    }

    const totalMood = data.reduce((sum, mood) => sum + mood.mood_score, 0)
    const averageMood = totalMood / data.length

    const distribution = data.reduce((acc, mood) => {
      acc[mood.mood_score] = (acc[mood.mood_score] || 0) + 1
      return acc
    }, {})

    setMoodStats({
      averageMood: averageMood.toFixed(1),
      totalResponses: data.length,
      moodDistribution: distribution,
    })
  }

  const submitMoodForEmployee = async (employeeId, moodScore, moodEmoji, note = "") => {
    try {
      const formattedDate = selectedDate.toISOString().split("T")[0]

      const { error } = await supabase.from("employee_mood").upsert(
        {
          company_id: companyId,
          employee_id: employeeId,
          mood_score: moodScore,
          mood_emoji: moodEmoji,
          mood_note: note,
          date: formattedDate,
        },
        { onConflict: "employee_id,date" },
      )

      if (error) throw error

      showNotification("success", t("moodSubmittedSuccessfully"))
      fetchMoodData()
    } catch (error) {
      console.error("Error submitting mood:", error)
      showNotification("error", t("errorSubmittingMood"))
    }
  }

  const getMoodIcon = (averageMood) => {
    if (averageMood >= 4.5) return <Smile className="h-8 w-8 text-green-500" />
    if (averageMood >= 3.5) return <Meh className="h-8 w-8 text-yellow-500" />
    return <Frown className="h-8 w-8 text-red-500" />
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500" />
            {t("moodTracking")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{t("trackEmployeeMoodAndWellbeing")}</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate.toISOString().split("T")[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="input"
          />
        </div>
      </div>

      {/* Mood Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("averageMood")}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{moodStats.averageMood}</p>
            </div>
            {getMoodIcon(Number.parseFloat(moodStats.averageMood))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("totalResponses")}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{moodStats.totalResponses}</p>
            </div>
            <Users className="h-8 w-8 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("responseRate")}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {employees.length > 0 ? Math.round((moodStats.totalResponses / employees.length) * 100) : 0}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Mood Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-lg font-semibold mb-4">{t("moodDistribution")}</h4>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(moodEmojis).map(([score, { emoji, label, color }]) => (
            <div key={score} className="text-center">
              <div className="text-4xl mb-2">{emoji}</div>
              <div className={`text-sm font-medium ${color}`}>{label}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {moodStats.moodDistribution[score] || 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Employee Mood List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold">{t("employeeMoods")}</h4>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {employees.map((employee) => {
            const employeeMood = moodData.find((mood) => mood.employee_id === employee.id)
            return (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">{employee.name}</h5>
                      <p className="text-sm text-gray-500">{employee.lavozim}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {employeeMood ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{employeeMood.mood_emoji}</span>
                        <div>
                          <p className="text-sm font-medium">
                            {moodEmojis[employeeMood.mood_score]?.label} ({employeeMood.mood_score}/5)
                          </p>
                          {employeeMood.mood_note && <p className="text-xs text-gray-500">{employeeMood.mood_note}</p>}
                        </div>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        {Object.entries(moodEmojis).map(([score, { emoji, label }]) => (
                          <button
                            key={score}
                            onClick={() => submitMoodForEmployee(employee.id, Number.parseInt(score), emoji)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title={label}
                          >
                            <span className="text-2xl">{emoji}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
