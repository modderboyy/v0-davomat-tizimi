"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "../context/LanguageContext"
import { useDynamicIsland } from "./DynamicIsland"
import { Heart, Activity, Moon, Zap } from "lucide-react"
import { motion } from "framer-motion"

export default function WellnessTracking({ companyId }) {
  const [employees, setEmployees] = useState([])
  const [wellnessData, setWellnessData] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [wellnessStats, setWellnessStats] = useState({
    averageStress: 0,
    averageEnergy: 0,
    averageWorkLifeBalance: 0,
    averageSleep: 0,
  })
  const [loading, setLoading] = useState(true)

  const { t } = useLanguage()
  const { showNotification } = useDynamicIsland()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchEmployees()
    fetchWellnessData()
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

  const fetchWellnessData = async () => {
    try {
      setLoading(true)
      const formattedDate = selectedDate.toISOString().split("T")[0]

      const { data, error } = await supabase
        .from("wellness_metrics")
        .select("*, users:employee_id(name, lavozim)")
        .eq("company_id", companyId)
        .eq("date", formattedDate)

      if (error) throw error

      setWellnessData(data || [])
      calculateWellnessStats(data || [])
    } catch (error) {
      console.error("Error fetching wellness data:", error)
      showNotification("error", t("errorFetchingWellnessData"))
    } finally {
      setLoading(false)
    }
  }

  const calculateWellnessStats = (data) => {
    if (data.length === 0) {
      setWellnessStats({
        averageStress: 0,
        averageEnergy: 0,
        averageWorkLifeBalance: 0,
        averageSleep: 0,
      })
      return
    }

    const totals = data.reduce(
      (acc, metric) => ({
        stress: acc.stress + (metric.stress_level || 0),
        energy: acc.energy + (metric.energy_level || 0),
        workLife: acc.workLife + (metric.work_life_balance || 0),
        sleep: acc.sleep + (metric.sleep_hours || 0),
      }),
      { stress: 0, energy: 0, workLife: 0, sleep: 0 },
    )

    setWellnessStats({
      averageStress: (totals.stress / data.length).toFixed(1),
      averageEnergy: (totals.energy / data.length).toFixed(1),
      averageWorkLifeBalance: (totals.workLife / data.length).toFixed(1),
      averageSleep: (totals.sleep / data.length).toFixed(1),
    })
  }

  const submitWellnessData = async (employeeId, metrics) => {
    try {
      const formattedDate = selectedDate.toISOString().split("T")[0]

      const { error } = await supabase.from("wellness_metrics").upsert(
        {
          company_id: companyId,
          employee_id: employeeId,
          date: formattedDate,
          ...metrics,
        },
        { onConflict: "employee_id,date" },
      )

      if (error) throw error

      showNotification("success", t("wellnessDataSubmitted"))
      fetchWellnessData()
    } catch (error) {
      console.error("Error submitting wellness data:", error)
      showNotification("error", t("errorSubmittingWellnessData"))
    }
  }

  const getMetricColor = (value, type) => {
    if (type === "stress") {
      if (value <= 2) return "text-green-500"
      if (value <= 3) return "text-yellow-500"
      return "text-red-500"
    } else {
      if (value >= 4) return "text-green-500"
      if (value >= 3) return "text-yellow-500"
      return "text-red-500"
    }
  }

  const getMetricIcon = (type) => {
    switch (type) {
      case "stress":
        return <Heart className="h-5 w-5" />
      case "energy":
        return <Zap className="h-5 w-5" />
      case "workLife":
        return <Activity className="h-5 w-5" />
      case "sleep":
        return <Moon className="h-5 w-5" />
      default:
        return <Activity className="h-5 w-5" />
    }
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
            <Activity className="h-6 w-6 text-green-500" />
            {t("wellnessTracking")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{t("monitorEmployeeWellbeingAndHealth")}</p>
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

      {/* Wellness Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("averageStress")}</p>
              <p className={`text-3xl font-bold ${getMetricColor(wellnessStats.averageStress, "stress")}`}>
                {wellnessStats.averageStress}/5
              </p>
            </div>
            <Heart className={`h-8 w-8 ${getMetricColor(wellnessStats.averageStress, "stress")}`} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("averageEnergy")}</p>
              <p className={`text-3xl font-bold ${getMetricColor(wellnessStats.averageEnergy, "energy")}`}>
                {wellnessStats.averageEnergy}/5
              </p>
            </div>
            <Zap className={`h-8 w-8 ${getMetricColor(wellnessStats.averageEnergy, "energy")}`} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("workLifeBalance")}</p>
              <p className={`text-3xl font-bold ${getMetricColor(wellnessStats.averageWorkLifeBalance, "workLife")}`}>
                {wellnessStats.averageWorkLifeBalance}/5
              </p>
            </div>
            <Activity className={`h-8 w-8 ${getMetricColor(wellnessStats.averageWorkLifeBalance, "workLife")}`} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("averageSleep")}</p>
              <p className="text-3xl font-bold text-blue-500">{wellnessStats.averageSleep}h</p>
            </div>
            <Moon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Employee Wellness Data */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold">{t("employeeWellnessData")}</h4>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {employees.map((employee) => {
            const employeeWellness = wellnessData.find((data) => data.employee_id === employee.id)
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

                  {employeeWellness ? (
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">{t("stress")}</p>
                        <p className={`text-lg font-bold ${getMetricColor(employeeWellness.stress_level, "stress")}`}>
                          {employeeWellness.stress_level}/5
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">{t("energy")}</p>
                        <p className={`text-lg font-bold ${getMetricColor(employeeWellness.energy_level, "energy")}`}>
                          {employeeWellness.energy_level}/5
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">{t("workLife")}</p>
                        <p
                          className={`text-lg font-bold ${getMetricColor(employeeWellness.work_life_balance, "workLife")}`}
                        >
                          {employeeWellness.work_life_balance}/5
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">{t("sleep")}</p>
                        <p className="text-lg font-bold text-blue-500">{employeeWellness.sleep_hours}h</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">{t("noDataForToday")}</div>
                  )}
                </div>

                {employeeWellness?.notes && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{employeeWellness.notes}</p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
