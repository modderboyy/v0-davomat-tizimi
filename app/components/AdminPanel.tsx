"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import * as XLSX from "xlsx"
import EmployeeChart from "./EmployeeChart"
import { ThemeToggle } from "./ThemeToggle"
import { registerLocale, setDefaultLocale } from "react-datepicker"
import uz from "date-fns/locale/uz"
import {
  Download,
  Save,
  HelpCircle,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react"
import "react-toastify/dist/ReactToastify.css"
import PieChart from "./PieChart"
import { useLanguage } from "../context/LanguageContext"
import { LanguageSwitcher } from "./LanguageSwitcher"
import Sidebar from "./Sidebar"
import CompanyInfo from "./CompanyInfo"
import { useDynamicIsland } from "./DynamicIsland"
import DashboardStats from "./DashboardStats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import EmployeeManagement from "./EmployeeManagement"

registerLocale("uz", uz)
setDefaultLocale("uz")

export default function AdminPanel({ companyId }: { companyId: string }) {
  const [employees, setEmployees] = useState([])
  const [reasons, setReasons] = useState({})
  const [attendanceData, setAttendanceData] = useState([])
  const [view, setView] = useState("dashboard")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [blockedUsers, setBlockedUsers] = useState([])
  const [companyData, setCompanyData] = useState(null)
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [employeeLimit, setEmployeeLimit] = useState(0)
  const [isPremium, setIsPremium] = useState(false)
  const [dashboardStats, setDashboardStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
    averageWorkHours: 0,
    attendanceTrend: [],
    balance: 0,
    subscriptionDaysLeft: 0,
  })
  const supabase = createClientComponentClient()
  const { t, language } = useLanguage()
  const { showNotification } = useDynamicIsland()

  // Calculate subscription status and employee limits based on new logic
  const calculateSubscriptionStatus = (latestSubsDate) => {
    if (!latestSubsDate) return { isActive: false, expiresOn: null, daysLeft: 0 }

    const subsDate = new Date(latestSubsDate)
    const expiresOn = new Date(subsDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
    const now = new Date()
    const daysLeft = Math.ceil((expiresOn - now) / (24 * 60 * 60 * 1000))

    return {
      isActive: daysLeft > 0,
      expiresOn,
      daysLeft: Math.max(0, daysLeft),
    }
  }

  const calculateEmployeeLimits = (balance) => {
    const freeEmployees = 3
    const costPerEmployee = 0.8
    const additionalEmployees = Math.floor(balance / costPerEmployee)
    const totalLimit = freeEmployees + additionalEmployees

    return {
      freeEmployees,
      additionalEmployees,
      totalLimit,
      costPerEmployee,
    }
  }

  // Fetch company data to check subscription status
  const fetchCompanyData = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from("companies").select("*").eq("id", companyId).single()

      if (error) throw error

      setCompanyData(data)

      // Calculate subscription status
      const subscriptionStatus = calculateSubscriptionStatus(data.latest_subs_date)
      const employeeLimits = calculateEmployeeLimits(data.balance || 0)

      // Check if subscription is active and balance is sufficient
      const requiredBalance = Math.max(
        0,
        (employees.length - employeeLimits.freeEmployees) * employeeLimits.costPerEmployee,
      )
      const isActive = subscriptionStatus.isActive && (data.balance || 0) >= requiredBalance

      setIsSubscriptionActive(isActive)
      setIsPremium(data.plan >= 2)
      setEmployeeLimit(employeeLimits.totalLimit)

      // Update dashboard stats
      setDashboardStats((prev) => ({
        ...prev,
        balance: data.balance || 0,
        subscriptionDaysLeft: subscriptionStatus.daysLeft,
      }))
    } catch (error) {
      console.error("Error fetching company data:", error)
      showNotification("error", "Kompaniya ma'lumotlarini yuklashda xatolik yuz berdi")
      setIsSubscriptionActive(false)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, companyId, showNotification, employees.length])

  const fetchEmployees = useCallback(async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, lavozim, archived")
      .eq("is_super_admin", false)
      .eq("company_id", companyId)

    if (error) {
      console.error("Error fetching employees:", error)
      showNotification("error", "Xodimlarni yuklashda xatolik yuz berdi")
    } else {
      setEmployees(data)
    }
  }, [supabase, companyId, showNotification])

  const fetchAttendanceData = useCallback(
    async (date) => {
      if (!employees.length) return

      const formattedDate = date.toISOString().split("T")[0]

      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from("davomat")
        .select(`*, users:xodim_id (name, email, lavozim)`)
        .eq("kelish_sana", formattedDate)
        .eq("company_id", companyId)

      if (attendanceError) {
        console.error("Error fetching attendance data:", attendanceError)
        showNotification("error", "Davomat ma'lumotlarini yuklashda xatolik yuz berdi")
      }

      const reasonsMap = {}
      const { data: reasonsData, error: reasonsError } = await supabase
        .from("davomat_sababi")
        .select("*")
        .eq("sana", formattedDate)
        .eq("company_id", companyId)

      if (reasonsError) {
        console.error("Error fetching reasons:", reasonsError)
      } else {
        reasonsData.forEach((item) => {
          reasonsMap[item.xodim_id] = item.sabab
        })
        setReasons(reasonsMap)
      }

      const fullAttendanceData = employees.map((employee) => {
        const attendanceRecord = attendanceRecords?.find((record) => record.xodim_id === employee.id) || {}
        const kelishVaqti = attendanceRecord.kelish_vaqti ? new Date(attendanceRecord.kelish_vaqti) : null
        const ketishVaqti = attendanceRecord.ketish_vaqti ? new Date(attendanceRecord.ketish_vaqti) : null

        const arrivalMinutes = kelishVaqti ? kelishVaqti.getHours() * 60 + kelishVaqti.getMinutes() : -1

        let arrivalStatus = "green"
        if (arrivalMinutes >= 9 * 60 && arrivalMinutes < 10 * 60) {
          arrivalStatus = "yellow"
        } else if (arrivalMinutes >= 10 * 60) {
          arrivalStatus = "red"
        }

        const isEarlyLeave = ketishVaqti && ketishVaqti.getHours() * 60 + ketishVaqti.getMinutes() < 18 * 60

        let totalWorkTime = "-"
        let totalWorkMinutes = 0
        if (kelishVaqti && ketishVaqti) {
          const diff = ketishVaqti.getTime() - kelishVaqti.getTime()
          const hours = Math.floor(diff / 3600000)
          const minutes = Math.floor((diff % 3600000) / 60000)
          totalWorkTime = `${hours}:${minutes.toString().padStart(2, "0")}`
          totalWorkMinutes = hours * 60 + minutes
        }

        return {
          ...attendanceRecord,
          users: { name: employee.name, email: employee.email, lavozim: employee.lavozim },
          xodim_id: employee.id,
          sabab: reasonsMap[employee.id] || "",
          kelish_vaqti: kelishVaqti,
          ketish_vaqti: ketishVaqti,
          arrivalStatus,
          isEarlyLeave,
          totalWorkTime,
          totalWorkMinutes,
          isLate: arrivalStatus === "yellow" || arrivalStatus === "red",
        }
      })

      setAttendanceData(fullAttendanceData)

      // Update dashboard stats for today
      if (formattedDate === new Date().toISOString().split("T")[0]) {
        updateDashboardStats(fullAttendanceData, employees.length)
      }
    },
    [supabase, employees, companyId, showNotification],
  )

  // Function to update dashboard stats
  const updateDashboardStats = (attendanceData, totalEmployees) => {
    const presentToday = attendanceData.filter((record) => record.kelish_vaqti).length
    const lateToday = attendanceData.filter((record) => record.isLate).length
    const absentToday = totalEmployees - presentToday

    const completedWorkRecords = attendanceData.filter(
      (record) => record.kelish_vaqti && record.ketish_vaqti && record.totalWorkMinutes > 0,
    )

    const totalWorkMinutes = completedWorkRecords.reduce((sum, record) => sum + record.totalWorkMinutes, 0)
    const averageWorkHours =
      completedWorkRecords.length > 0 ? (totalWorkMinutes / completedWorkRecords.length / 60).toFixed(1) : 0

    setDashboardStats((prev) => ({
      ...prev,
      totalEmployees,
      presentToday,
      lateToday,
      absentToday,
      averageWorkHours,
    }))
  }

  // Fetch attendance trend data for the dashboard
  const fetchAttendanceTrend = useCallback(async () => {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 6)

      const dateRange = []
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dateRange.push(new Date(d).toISOString().split("T")[0])
      }

      const trendData = []

      for (const date of dateRange) {
        const { data, error } = await supabase
          .from("davomat")
          .select("id, kelish_vaqti")
          .eq("kelish_sana", date)
          .eq("company_id", companyId)

        if (error) throw error

        trendData.push({
          date,
          count: data.length,
        })
      }

      setDashboardStats((prev) => ({
        ...prev,
        attendanceTrend: trendData,
      }))
    } catch (error) {
      console.error("Error fetching attendance trend:", error)
    }
  }, [supabase, companyId])

  const fetchBlockedUsers = useCallback(async () => {
    if (!isSubscriptionActive) return

    const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from("blocked")
      .select("*, users:user_id(name, email)")
      .gte("blocked_at", tenHoursAgo)
      .eq("company_id", companyId)
      .order("blocked_at", { ascending: false })

    if (error) {
      console.error("Error fetching blocked users:", error)
      showNotification("error", "Bloklangan foydalanuvchilarni yuklashda xatolik yuz berdi")
    } else {
      setBlockedUsers(data)
    }
  }, [supabase, companyId, isSubscriptionActive, showNotification])

  useEffect(() => {
    fetchCompanyData()
  }, [fetchCompanyData])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  useEffect(() => {
    if (employees.length) {
      fetchAttendanceData(selectedDate)
    }
  }, [selectedDate, employees, fetchAttendanceData])

  useEffect(() => {
    if (view === "blocked") {
      fetchBlockedUsers()
    }
  }, [view, fetchBlockedUsers])

  useEffect(() => {
    if (view === "dashboard") {
      fetchAttendanceTrend()
    }
  }, [view, fetchAttendanceTrend])

  useEffect(() => {
    if (isSubscriptionActive) {
      const timer = setTimeout(() => {
        showNotification("info", t("welcomeMessage"))
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isSubscriptionActive, showNotification, t])

  const handleReasonChange = (employeeId, reason) => {
    setReasons((prevReasons) => ({ ...prevReasons, [employeeId]: reason }))
  }

  const saveReason = async (employeeId) => {
    if (!isSubscriptionActive) return

    const formattedDate = selectedDate.toISOString().split("T")[0]
    const { error } = await supabase.from("davomat_sababi").upsert({
      xodim_id: employeeId,
      sabab: reasons[employeeId],
      sana: formattedDate,
      company_id: companyId,
    })

    if (error) {
      console.error("Error saving reason:", error)
      showNotification("error", "Davomat Sababini saqlashda xatolik yuz berdi")
    } else {
      showNotification("success", "Davomat Sababi muvaffaqiyatli saqlandi")
      fetchAttendanceData(selectedDate)
    }
  }

  const downloadExcel = () => {
    if (!isSubscriptionActive) return

    const worksheet = XLSX.utils.json_to_sheet(
      attendanceData.map((record) => ({
        "Ism-familiyasi": record.users.name,
        "Kelish vaqti": record.kelish_vaqti
          ? `${record.kelish_vaqti.getHours().toString().padStart(2, "0")}:${record.kelish_vaqti
              .getMinutes()
              .toString()
              .padStart(2, "0")}`
          : "-",
        "Ketish vaqti": record.ketish_vaqti
          ? `${record.ketish_vaqti.getHours().toString().padStart(2, "0")}:${record.ketish_vaqti
              .getMinutes()
              .toString()
              .padStart(2, "0")}`
          : "-",
        "Jami ishlagan vaqti": record.totalWorkTime,
        Sabab: record.sabab || "-",
      })),
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Davomat")
    XLSX.writeFile(workbook, `Davomat_${selectedDate.toISOString().split("T")[0]}.xlsx`)
    showNotification("success", "Excel fayl yuklab olindi!")
  }

  const formatTime = (date) => {
    if (!date) return "-"
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
  }

  const unblockUser = async (userId) => {
    if (!isSubscriptionActive) return

    const { error } = await supabase.from("blocked").delete().eq("user_id", userId).eq("company_id", companyId)

    if (error) {
      console.error("Error unblocking user:", error)
      showNotification("error", "Foydalanuvchini blokdan chiqarishda xatolik yuz berdi")
    } else {
      showNotification("success", "Foydalanuvchi muvaffaqiyatli blokdan chiqarildi")
      fetchBlockedUsers()
    }
  }

  const openTelegramChannel = () => {
    window.open("https://t.me/modderboy", "_blank")
  }

  // Subscription inactive message
  const renderSubscriptionInactiveMessage = () => (
    <div className="card p-8">
      <div className="flex flex-col items-center text-center">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
        <h3 className="text-xl font-bold mb-2">{t("subscriptionInactive")}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{t("subscriptionInactiveMessage")}</p>
      </div>
    </div>
  )

  const renderDashboardView = () => {
    if (!isSubscriptionActive) return renderSubscriptionInactiveMessage()

    return (
      <div className="space-y-6">
        {/* Enhanced Stats Cards with Balance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Balance Card */}
          <Card className="col-span-1 sm:col-span-2 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {t("balance")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${dashboardStats.balance.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardStats.subscriptionDaysLeft} {t("daysLeft")}
              </p>
            </CardContent>
          </Card>

          {/* Total Employees */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("totalEmployees")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-indigo-500 mr-2" />
                <div className="text-2xl font-bold">{dashboardStats.totalEmployees}</div>
              </div>
            </CardContent>
          </Card>

          {/* Present Today */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("presentToday")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <div className="text-2xl font-bold">{dashboardStats.presentToday}</div>
                <div className="text-sm text-muted-foreground ml-2">
                  ({Math.round((dashboardStats.presentToday / dashboardStats.totalEmployees) * 100) || 0}%)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Late Today */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("lateToday")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                <div className="text-2xl font-bold">{dashboardStats.lateToday}</div>
                <div className="text-sm text-muted-foreground ml-2">
                  ({Math.round((dashboardStats.lateToday / dashboardStats.totalEmployees) * 100) || 0}%)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Absent Today */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("absentToday")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <div className="text-2xl font-bold">{dashboardStats.absentToday}</div>
                <div className="text-sm text-muted-foreground ml-2">
                  ({Math.round((dashboardStats.absentToday / dashboardStats.totalEmployees) * 100) || 0}%)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Work Hours */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("averageWorkHours")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
                <div className="text-2xl font-bold">{dashboardStats.averageWorkHours}</div>
                <div className="text-sm text-muted-foreground ml-2">{t("hours")}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("attendanceOverview")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <PieChart attendanceData={attendanceData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("attendanceTrend")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <DashboardStats attendanceTrend={dashboardStats.attendanceTrend} />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t("todayAttendance")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-4 font-medium">{t("name")}</th>
                    <th className="text-left py-2 px-4 font-medium">{t("position")}</th>
                    <th className="text-left py-2 px-4 font-medium">{t("arrivalTime")}</th>
                    <th className="text-left py-2 px-4 font-medium">{t("departureTime")}</th>
                    <th className="text-left py-2 px-4 font-medium">{t("totalWorkTime")}</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.slice(0, 5).map((record) => (
                    <tr key={record.xodim_id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 font-medium">{record.users.name}</td>
                      <td className="py-3 px-4">{record.users.lavozim}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.arrivalStatus === "red"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              : record.arrivalStatus === "yellow"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                : record.kelish_vaqti
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {formatTime(record.kelish_vaqti)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.isEarlyLeave && record.ketish_vaqti
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              : record.ketish_vaqti
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {formatTime(record.ketish_vaqti)}
                        </span>
                      </td>
                      <td className="py-3 px-4">{record.totalWorkTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderAttendanceView = () => {
    if (!isSubscriptionActive) return renderSubscriptionInactiveMessage()

    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h3 className="text-2xl font-bold">{t("attendance")}</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              className="input"
              dateFormat="dd/MM/yyyy"
              locale={language === "ru" ? "ru" : language === "en" ? "en" : "uz"}
            />
            <button onClick={downloadExcel} className="btn btn-primary flex items-center gap-2">
              <Download className="w-5 h-5" />
              {t("downloadExcel")}
            </button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("name")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("position")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("arrivalTime")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("departureTime")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("totalWorkTime")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("reason")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {attendanceData.map((record) => (
                    <tr key={record.xodim_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{record.users.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{record.users.lavozim}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.arrivalStatus === "red"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              : record.arrivalStatus === "yellow"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                : record.kelish_vaqti
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {formatTime(record.kelish_vaqti)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.isEarlyLeave && record.ketish_vaqti
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              : record.ketish_vaqti
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {formatTime(record.ketish_vaqti)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{record.totalWorkTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{record.sabab || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderAbsenceView = () => {
    if (!isSubscriptionActive) return renderSubscriptionInactiveMessage()

    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h3 className="text-2xl font-bold">{t("attendanceReasons")}</h3>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            className="input"
            dateFormat="dd/MM/yyyy"
            locale={language === "ru" ? "ru" : language === "en" ? "en" : "uz"}
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee) => (
            <Card key={employee.id}>
              <CardContent className="p-4">
                <p className="font-medium text-gray-900 dark:text-white mb-2">{employee.name}</p>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={reasons[employee.id] || ""}
                    onChange={(e) => handleReasonChange(employee.id, e.target.value)}
                    className="input"
                    placeholder={t("reason")}
                  />
                  <button
                    onClick={() => saveReason(employee.id)}
                    className="btn btn-primary flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {reasons[employee.id] ? t("update") : t("save")}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const renderChartView = () => {
    if (!isSubscriptionActive) return renderSubscriptionInactiveMessage()

    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold">{t("charts")}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>{t("barChart")}</CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeeChart attendanceData={attendanceData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("pieChart")}</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart attendanceData={attendanceData} />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const renderEmployeesView = () => {
    if (!isSubscriptionActive) return renderSubscriptionInactiveMessage()

    return (
      <EmployeeManagement
        companyId={companyId}
        employeeLimit={employeeLimit}
        currentEmployeeCount={employees.filter((emp) => !emp.archived).length}
        isPremium={isPremium}
      />
    )
  }

  const renderCompanyView = () => {
    return <CompanyInfo companyId={companyId} isSubscriptionActive={isSubscriptionActive} />
  }

  const renderBlockedView = () => {
    if (!isSubscriptionActive) return renderSubscriptionInactiveMessage()

    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold">{t("blocked")}</h3>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("name")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("email")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("blockedAt")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {blockedUsers.length > 0 ? (
                    blockedUsers.map((blockedUser) => (
                      <tr key={blockedUser.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">{blockedUser.users.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{blockedUser.users.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(blockedUser.blocked_at).toLocaleString(
                            language === "en" ? "en-US" : language === "ru" ? "ru-RU" : "uz-UZ",
                            { timeZone: "Asia/Tashkent" },
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button onClick={() => unblockUser(blockedUser.user_id)} className="btn btn-primary">
                            {t("unblock")}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No blocked users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar activeView={view} setView={setView} isSubscriptionActive={isSubscriptionActive} />

      <div className="lg:ml-80 transition-all duration-300 ease-in-out">
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl lg:text-2xl font-bold text-indigo-600 dark:text-indigo-400 ml-12 lg:ml-0">
              {t("adminPanel")}
            </h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={openTelegramChannel}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                title={t("help")}
              >
                <HelpCircle className="h-5 w-5" />
              </button>
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {view === "dashboard" && renderDashboardView()}
          {view === "attendance" && renderAttendanceView()}
          {view === "absence" && renderAbsenceView()}
          {view === "chart" && renderChartView()}
          {view === "employees" && renderEmployeesView()}
          {view === "company" && renderCompanyView()}
          {view === "blocked" && renderBlockedView()}
        </main>
      </div>
    </div>
  )
}
