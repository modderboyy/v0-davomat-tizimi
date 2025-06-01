"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "../context/LanguageContext"
import { useDynamicIsland } from "./DynamicIsland"
import { Trophy, Award, Star, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

export default function AchievementSystem({ companyId }) {
  const [achievements, setAchievements] = useState([])
  const [employeeAchievements, setEmployeeAchievements] = useState([])
  const [employees, setEmployees] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [stats, setStats] = useState({
    totalAchievements: 0,
    totalPoints: 0,
    topPerformer: null,
  })
  const [loading, setLoading] = useState(true)

  const { t } = useLanguage()
  const { showNotification } = useDynamicIsland()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([fetchAchievements(), fetchEmployees(), fetchEmployeeAchievements()])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("is_active", true)
        .order("points", { ascending: false })

      if (error) throw error
      setAchievements(data || [])
    } catch (error) {
      console.error("Error fetching achievements:", error)
    }
  }

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
    }
  }

  const fetchEmployeeAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from("employee_achievements")
        .select("*, achievements(*), users:employee_id(name, lavozim)")
        .eq("company_id", companyId)
        .order("earned_at", { ascending: false })

      if (error) throw error
      setEmployeeAchievements(data || [])
      calculateStats(data || [])
      calculateLeaderboard(data || [])
    } catch (error) {
      console.error("Error fetching employee achievements:", error)
    }
  }

  const calculateStats = (data) => {
    const totalAchievements = data.length
    const totalPoints = data.reduce((sum, achievement) => sum + (achievement.achievements?.points || 0), 0)

    // Group by employee to find top performer
    const employeePoints = data.reduce((acc, achievement) => {
      const employeeId = achievement.employee_id
      acc[employeeId] = (acc[employeeId] || 0) + (achievement.achievements?.points || 0)
      return acc
    }, {})

    const topPerformerId = Object.keys(employeePoints).reduce(
      (a, b) => (employeePoints[a] > employeePoints[b] ? a : b),
      null,
    )

    const topPerformer = employees.find((emp) => emp.id === topPerformerId)

    setStats({
      totalAchievements,
      totalPoints,
      topPerformer,
    })
  }

  const calculateLeaderboard = (data) => {
    const employeePoints = data.reduce((acc, achievement) => {
      const employeeId = achievement.employee_id
      const employeeName = achievement.users?.name || "Unknown"
      const employeePosition = achievement.users?.lavozim || ""

      if (!acc[employeeId]) {
        acc[employeeId] = {
          id: employeeId,
          name: employeeName,
          position: employeePosition,
          points: 0,
          achievementCount: 0,
        }
      }

      acc[employeeId].points += achievement.achievements?.points || 0
      acc[employeeId].achievementCount += 1

      return acc
    }, {})

    const leaderboardArray = Object.values(employeePoints)
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)

    setLeaderboard(leaderboardArray)
  }

  const awardAchievement = async (employeeId, achievementId) => {
    try {
      const { error } = await supabase.from("employee_achievements").insert({
        company_id: companyId,
        employee_id: employeeId,
        achievement_id: achievementId,
      })

      if (error) throw error

      showNotification("success", t("achievementAwarded"))
      fetchEmployeeAchievements()
    } catch (error) {
      console.error("Error awarding achievement:", error)
      showNotification("error", t("errorAwardingAchievement"))
    }
  }

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />
      case 1:
        return <Award className="h-6 w-6 text-gray-400" />
      case 2:
        return <Star className="h-6 w-6 text-orange-500" />
      default:
        return <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
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
            <Trophy className="h-6 w-6 text-yellow-500" />
            {t("achievementSystem")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{t("recognizeAndCelebrateEmployeeAchievements")}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("totalAchievements")}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalAchievements}</p>
            </div>
            <Award className="h-8 w-8 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("totalPoints")}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalPoints}</p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("topPerformer")}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.topPerformer?.name || t("none")}</p>
            </div>
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Achievements */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold">{t("availableAchievements")}</h4>
          </div>
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">{achievement.name}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 px-2 py-1 rounded">
                        {achievement.category}
                      </span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-1 rounded">
                        {achievement.points} {t("points")}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("leaderboard")}
            </h4>
          </div>
          <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
            {leaderboard.map((employee, index) => (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getRankIcon(index)}
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">{employee.name}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{employee.position}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {employee.points} {t("points")}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {employee.achievementCount} {t("achievements")}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold">{t("recentAchievements")}</h4>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {employeeAchievements.slice(0, 10).map((achievement) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6"
            >
              <div className="flex items-center space-x-4">
                <span className="text-3xl">{achievement.achievements?.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium text-gray-900 dark:text-white">{achievement.users?.name}</h5>
                    <span className="text-sm text-gray-500">{t("earned")}</span>
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">
                      {achievement.achievements?.name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {achievement.achievements?.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-1 rounded">
                      +{achievement.achievements?.points} {t("points")}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(achievement.earned_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
