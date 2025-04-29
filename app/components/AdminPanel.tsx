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
import { Edit2, Check, X, Download, Save, AlertTriangle, HelpCircle } from "lucide-react"
import "react-toastify/dist/ReactToastify.css"
import PieChart from "./PieChart"
import { useLanguage } from "../context/LanguageContext"
import { LanguageSwitcher } from "./LanguageSwitcher"
import Sidebar from "./Sidebar"
import AddEmployeeForm from "./AddEmployeeForm"
import CompanyInfo from "./CompanyInfo"
import { useDynamicIsland } from "./DynamicIsland"

registerLocale("uz", uz)
setDefaultLocale("uz")

export default function AdminPanel({ companyId }: { companyId: string }) {
  const [employees, setEmployees] = useState([])
  const [employeeDetails, setEmployeeDetails] = useState([])
  const [reasons, setReasons] = useState({})
  const [attendanceData, setAttendanceData] = useState([])
  const [view, setView] = useState("company") // Default to company view
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [blockedUsers, setBlockedUsers] = useState([])
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [editName, setEditName] = useState("")
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [companyData, setCompanyData] = useState(null)
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [employeeLimit, setEmployeeLimit] = useState(0)
  const supabase = createClientComponentClient()
  const { t, language } = useLanguage()
  const { showNotification } = useDynamicIsland()

  // Function to get employee limit based on plan
  const getEmployeeLimit = (planValue) => {
    switch (planValue) {
      case 1: // Basic
        return 5
      case 2: // Premium
        return 125
      case 3: // Bigplan
        return Number.POSITIVE_INFINITY // No limit
      default:
        return 0 // No employees allowed
    }
  }

  // Function to remove excess employees
  const removeExcessEmployees = useCallback(async () => {
    if (!companyData || !isSubscriptionActive) return

    try {
      const limit = getEmployeeLimit(companyData.plan)

      // Get all employees sorted by creation date (newest first)
      const { data: employees, error: fetchError } = await supabase
        .from("users")
        .select("id, created_at")
        .eq("company_id", companyId)
        .eq("is_super_admin", false)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      // If we have more employees than the limit
      if (employees.length > limit) {
        // Get the excess employees (newest ones)
        const excessEmployees = employees.slice(limit)

        // Delete each excess employee
        for (const employee of excessEmployees) {
          const { error: deleteError } = await supabase.from("users").delete().eq("id", employee.id)
          if (deleteError) console.error("Error deleting excess employee:", deleteError)
        }

        showNotification("warning", t("excessEmployeesRemoved", { count: excessEmployees.length }))

        // Refresh employee data
        fetchEmployees()
        if (view === "employees") {
          fetchEmployeeDetails()
        }
      }
    } catch (error) {
      console.error("Error removing excess employees:", error)
    }
  }, [companyData, isSubscriptionActive, companyId, supabase, showNotification, t])

  // Fetch company data to check subscription status
  const fetchCompanyData = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from("companies").select("*").eq("id", companyId).single()

      if (error) throw error

      setCompanyData(data)
      // Check if subscription is active:
      // - If plan is 0, subscription is inactive
      // - If subscription is 0, subscription is inactive
      // - Otherwise, subscription is active (null values are considered active)
      const isActive = !(data.plan === 0 || data.subscription === 0)
      setIsSubscriptionActive(isActive)

      // Set employee limit based on plan
      setEmployeeLimit(getEmployeeLimit(data.plan))
    } catch (error) {
      console.error("Error fetching company data:", error)
      showNotification("error", "Kompaniya ma'lumotlarini yuklashda xatolik yuz berdi")
      setIsSubscriptionActive(false)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, companyId, showNotification])

  const fetchEmployees = useCallback(async () => {
    if (!isSubscriptionActive) return

    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, lavozim")
      .eq("is_super_admin", false)
      .eq("company_id", companyId)

    if (error) {
      console.error("Error fetching employees:", error)
      showNotification("error", "Xodimlarni yuklashda xatolik yuz berdi")
    } else {
      setEmployees(data)
    }
  }, [supabase, companyId, isSubscriptionActive, showNotification])

  const fetchEmployeeDetails = useCallback(async () => {
    if (!isSubscriptionActive) return

    const { data, error } = await supabase
      .from("users")
      .select("lavozim, name, email, id")
      .eq("is_super_admin", false)
      .eq("company_id", companyId)

    if (error) {
      console.error("Error fetching employee details:", error)
      showNotification("error", "Xodimlar haqidagi ma'lumotlarni yuklashda xatolik yuz berdi")
    } else {
      setEmployeeDetails(data)
    }
  }, [supabase, companyId, isSubscriptionActive, showNotification])

  const fetchAttendanceData = useCallback(
    async (date) => {
      if (!isSubscriptionActive || !employees.length) return

      // Sanani yyyy-mm-dd formatiga o'tkazamiz
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

        let arrivalStatus = "green" // Default to green
        if (arrivalMinutes >= 9 * 60 && arrivalMinutes < 10 * 60) {
          arrivalStatus = "yellow"
        } else if (arrivalMinutes >= 10 * 60) {
          arrivalStatus = "red"
        }

        const isEarlyLeave = ketishVaqti && ketishVaqti.getHours() * 60 + ketishVaqti.getMinutes() < 18 * 60

        let totalWorkTime = "-"
        if (kelishVaqti && ketishVaqti) {
          const diff = ketishVaqti.getTime() - kelishVaqti.getTime()
          const hours = Math.floor(diff / 3600000)
          const minutes = Math.floor((diff % 3600000) / 60000)
          totalWorkTime = `${hours}:${minutes.toString().padStart(2, "0")}`
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
        }
      })

      setAttendanceData(fullAttendanceData)
    },
    [supabase, employees, companyId, isSubscriptionActive, showNotification],
  )

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

  // Open Telegram channel
  const openTelegramChannel = () => {
    window.open("https://t.me/modderboy", "_blank")
  }

  // Open Android app
  const openAndroidApp = () => {
    // Try to open the Android app
    window.location.href = "intent://com.modderboy.davomat#Intent;scheme=https;package=com.modderboy.davomat;end"
  }

  useEffect(() => {
    fetchCompanyData()
  }, [fetchCompanyData])

  useEffect(() => {
    if (isSubscriptionActive) {
      fetchEmployees()
    }
  }, [fetchEmployees, isSubscriptionActive])

  useEffect(() => {
    if (isSubscriptionActive && view === "employees") {
      fetchEmployeeDetails()
    }
  }, [view, fetchEmployeeDetails, isSubscriptionActive])

  useEffect(() => {
    if (isSubscriptionActive && employees.length) {
      fetchAttendanceData(selectedDate)
    }
  }, [selectedDate, employees, fetchAttendanceData, isSubscriptionActive])

  useEffect(() => {
    if (isSubscriptionActive && view === "blocked") {
      fetchBlockedUsers()
    }
  }, [view, fetchBlockedUsers, isSubscriptionActive])

  // Periodically check for excess employees (every 5 minutes)
  useEffect(() => {
    if (isSubscriptionActive) {
      // Initial check
      removeExcessEmployees()

      // Set up interval
      const interval = setInterval(
        () => {
          removeExcessEmployees()
        },
        5 * 60 * 1000,
      ) // 5 minutes

      return () => clearInterval(interval)
    }
  }, [isSubscriptionActive, removeExcessEmployees])

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

  const handleEditStart = (employee) => {
    if (!isSubscriptionActive) return
    setEditingEmployee(employee)
    setEditName(employee.name)
  }

  const handleEditCancel = () => {
    setEditingEmployee(null)
    setEditName("")
  }

  const handleEditSave = async (employeeId) => {
    if (!isSubscriptionActive) return

    try {
      const { error } = await supabase
        .from("users")
        .update({ name: editName })
        .eq("id", employeeId)
        .eq("company_id", companyId)

      if (error) throw error

      showNotification("success", "Ism-familiya muvaffaqiyatli yangilandi")
      fetchEmployeeDetails()
      setEditingEmployee(null)
      setEditName("")
    } catch (error) {
      console.error("Error updating name:", error)
      showNotification("error", "Ism-familiyani yangilashda xatolik yuz berdi")
    }
  }

  const handleEmployeeAdded = () => {
    fetchEmployees()
    fetchEmployeeDetails()
    setShowAddEmployee(false)
    showNotification("success", "Xodim muvaffaqiyatli qo'shildi")

    // Check for excess employees after adding
    removeExcessEmployees()
  }

  // Subscription inactive message
  const renderSubscriptionInactiveMessage = () => (
    <div className="card p-8">
      <div className="flex flex-col items-center text-center">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
        <h3 className="text-xl font-bold mb-2">{t("subscriptionInactive")}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{t("subscriptionInactiveMessage")}</p>
        <a
          href="#"
          className="btn btn-primary"
          onClick={(e) => {
            e.preventDefault()
            openAndroidApp()
          }}
        >
          {t("renewSubscription")}
        </a>
      </div>
    </div>
  )

  const renderAttendanceView = () => {
    if (!isSubscriptionActive) return renderSubscriptionInactiveMessage()

    return (
      <div className="card">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h3 className="text-xl font-semibold mb-4 md:mb-0">{t("attendance")}</h3>
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
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">{t("name")}</th>
                <th className="table-header-cell">{t("arrivalTime")}</th>
                <th className="table-header-cell">{t("departureTime")}</th>
                <th className="table-header-cell">{t("totalWorkTime")}</th>
                <th className="table-header-cell">{t("reason")}</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {attendanceData.map((record) => (
                <tr key={record.xodim_id} className="table-row">
                  <td className="table-cell font-medium">{record.users.name}</td>
                  <td className="table-cell">
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
                  <td className="table-cell">
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
                  <td className="table-cell">{record.totalWorkTime}</td>
                  <td className="table-cell">{record.sabab || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderAbsenceView = () => {
    if (!isSubscriptionActive) return renderSubscriptionInactiveMessage()

    return (
      <div className="card">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h3 className="text-xl font-semibold mb-4 md:mb-0">{t("attendanceReasons")}</h3>
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
            <div
              key={employee.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700"
            >
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
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderChartView = () => {
    if (!isSubscriptionActive) return renderSubscriptionInactiveMessage()

    return (
      <div className="card">
        <h3 className="text-xl font-semibold mb-6">{t("charts")}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold mb-4">{t("barChart")}</h4>
            <EmployeeChart attendanceData={attendanceData} />
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold mb-4">{t("pieChart")}</h4>
            <PieChart attendanceData={attendanceData} />
          </div>
        </div>
      </div>
    )
  }

  const renderEmployeesView = () => {
    if (!isSubscriptionActive) return renderSubscriptionInactiveMessage()

    return (
      <div className="card">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h3 className="text-xl font-semibold mb-4 md:mb-0">{t("employees")}</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setShowAddEmployee(!showAddEmployee)} className="btn btn-primary">
              {showAddEmployee ? t("employees") : t("addEmployee")}
            </button>

            {/* Employee limit indicator */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md">
              <span className="text-sm">
                {employeeDetails.length} / {employeeLimit === Number.POSITIVE_INFINITY ? "∞" : employeeLimit}
              </span>
            </div>
          </div>
        </div>

        {showAddEmployee ? (
          <AddEmployeeForm onEmployeeAdded={handleEmployeeAdded} companyId={companyId} />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">{t("position")}</th>
                  <th className="table-header-cell">{t("name")}</th>
                  <th className="table-header-cell">{t("email")}</th>
                  <th className="table-header-cell">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {employeeDetails.map((employee) => (
                  <tr key={employee.email} className="table-row">
                    <td className="table-cell">{employee.lavozim}</td>
                    <td className="table-cell">
                      {editingEmployee?.email === employee.email ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="input"
                        />
                      ) : (
                        employee.name
                      )}
                    </td>
                    <td className="table-cell">{employee.email}</td>
                    <td className="table-cell">
                      {editingEmployee?.email === employee.email ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSave(employee.id)}
                            className="btn btn-success p-2"
                            title={t("save")}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={handleEditCancel} className="btn btn-danger p-2" title={t("cancel")}>
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditStart(employee)}
                          className="btn btn-primary p-2"
                          title={t("edit")}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  const renderCompanyView = () => {
    // Always show company view, but with different content based on subscription status
    return (
      <CompanyInfo companyId={companyId} isSubscriptionActive={isSubscriptionActive} openAndroidApp={openAndroidApp} />
    )
  }

  const renderBlockedView = () => {
    if (!isSubscriptionActive) return renderSubscriptionInactiveMessage()

    return (
      <div className="card">
        <h3 className="text-xl font-semibold mb-6">{t("blocked")}</h3>
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">{t("name")}</th>
                <th className="table-header-cell">{t("email")}</th>
                <th className="table-header-cell">{t("blockedAt")}</th>
                <th className="table-header-cell">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {blockedUsers.length > 0 ? (
                blockedUsers.map((blockedUser) => (
                  <tr key={blockedUser.id} className="table-row">
                    <td className="table-cell">{blockedUser.users.name}</td>
                    <td className="table-cell">{blockedUser.users.email}</td>
                    <td className="table-cell">
                      {new Date(blockedUser.blocked_at).toLocaleString(
                        language === "en" ? "en-US" : language === "ru" ? "ru-RU" : "uz-UZ",
                        { timeZone: "Asia/Tashkent" },
                      )}
                    </td>
                    <td className="table-cell">
                      <button onClick={() => unblockUser(blockedUser.user_id)} className="btn btn-primary">
                        {t("unblock")}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="table-cell text-center py-8 text-gray-500 dark:text-gray-400">
                    No blocked users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

      <div className="md:ml-64 transition-all duration-300 ease-in-out">
        <header className="navbar px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{t("adminPanel")}</h1>
          <div className="flex items-center space-x-2">
            {/* Help button */}
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
        </header>

        <main className="p-4 md:p-6">
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
