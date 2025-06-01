"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "../context/LanguageContext"
import { useDynamicIsland } from "./DynamicIsland"
import { Calendar, Clock, Edit2, Plus, Trash2, AlertCircle } from "lucide-react"
import DatePicker from "react-datepicker"
import { motion, AnimatePresence } from "framer-motion"

export default function AttendanceEditor({ companyId }) {
  const [employees, setEmployees] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [attendanceData, setAttendanceData] = useState([])
  const [holidays, setHolidays] = useState([])
  const [editingRecord, setEditingRecord] = useState(null)
  const [showHolidayForm, setShowHolidayForm] = useState(false)
  const [newHoliday, setNewHoliday] = useState({ name: "", date: new Date(), isRecurring: false })
  const [loading, setLoading] = useState(true)

  const { t } = useLanguage()
  const { showNotification } = useDynamicIsland()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchEmployees()
    fetchHolidays()
  }, [])

  useEffect(() => {
    if (employees.length > 0) {
      fetchAttendanceData()
    }
  }, [selectedDate, employees])

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

  const fetchHolidays = async () => {
    try {
      const { data, error } = await supabase
        .from("holidays")
        .select("*")
        .eq("company_id", companyId)
        .order("date", { ascending: true })

      if (error) throw error
      setHolidays(data || [])
    } catch (error) {
      console.error("Error fetching holidays:", error)
    }
  }

  const fetchAttendanceData = async () => {
    try {
      setLoading(true)
      const formattedDate = selectedDate.toISOString().split("T")[0]

      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from("davomat")
        .select("*")
        .eq("kelish_sana", formattedDate)
        .eq("company_id", companyId)

      if (attendanceError) throw attendanceError

      const { data: edits, error: editsError } = await supabase
        .from("attendance_edits")
        .select("*")
        .eq("edit_date", formattedDate)
        .eq("company_id", companyId)

      if (editsError) throw editsError

      const fullAttendanceData = employees.map((employee) => {
        const attendance = attendanceRecords?.find((record) => record.xodim_id === employee.id)
        const edit = edits?.find((edit) => edit.employee_id === employee.id)

        return {
          ...employee,
          attendance,
          edit,
          checkinTime: edit?.edited_checkin || attendance?.kelish_vaqti || null,
          checkoutTime: edit?.edited_checkout || attendance?.ketish_vaqti || null,
          hasEdit: !!edit,
          isHoliday: holidays.some((h) => h.date === formattedDate),
          isWeekend: selectedDate.getDay() === 0 || selectedDate.getDay() === 6,
        }
      })

      setAttendanceData(fullAttendanceData)
    } catch (error) {
      console.error("Error fetching attendance data:", error)
      showNotification("error", t("errorFetchingAttendance"))
    } finally {
      setLoading(false)
    }
  }

  const handleTimeEdit = async (employeeId, type, newTime) => {
    try {
      const formattedDate = selectedDate.toISOString().split("T")[0]
      const employee = attendanceData.find((emp) => emp.id === employeeId)

      const editData = {
        company_id: companyId,
        employee_id: employeeId,
        edit_date: formattedDate,
        edit_type: `manual_${type}`,
        edited_by: (await supabase.auth.getUser()).data.user?.id,
        reason: `Manual ${type} adjustment`,
      }

      if (type === "checkin") {
        editData.original_checkin = employee.attendance?.kelish_vaqti
        editData.edited_checkin = newTime
        editData.edited_checkout = employee.checkoutTime
      } else {
        editData.original_checkout = employee.attendance?.ketish_vaqti
        editData.edited_checkout = newTime
        editData.edited_checkin = employee.checkinTime
      }

      const { error } = await supabase.from("attendance_edits").upsert(editData, {
        onConflict: "company_id,employee_id,edit_date",
      })

      if (error) throw error

      showNotification("success", t("attendanceUpdatedSuccessfully"))
      fetchAttendanceData()
    } catch (error) {
      console.error("Error updating attendance:", error)
      showNotification("error", t("errorUpdatingAttendance"))
    }
  }

  const markSpecialDay = async (employeeId, type) => {
    try {
      const formattedDate = selectedDate.toISOString().split("T")[0]

      const editData = {
        company_id: companyId,
        employee_id: employeeId,
        edit_date: formattedDate,
        edit_type: type,
        edited_by: (await supabase.auth.getUser()).data.user?.id,
        reason: `Marked as ${type}`,
      }

      const { error } = await supabase.from("attendance_edits").upsert(editData, {
        onConflict: "company_id,employee_id,edit_date",
      })

      if (error) throw error

      showNotification("success", t("dayMarkedSuccessfully"))
      fetchAttendanceData()
    } catch (error) {
      console.error("Error marking special day:", error)
      showNotification("error", t("errorMarkingDay"))
    }
  }

  const addHoliday = async () => {
    try {
      const { error } = await supabase.from("holidays").insert({
        company_id: companyId,
        name: newHoliday.name,
        date: newHoliday.date.toISOString().split("T")[0],
        is_recurring: newHoliday.isRecurring,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })

      if (error) throw error

      showNotification("success", t("holidayAddedSuccessfully"))
      setShowHolidayForm(false)
      setNewHoliday({ name: "", date: new Date(), isRecurring: false })
      fetchHolidays()
      fetchAttendanceData()
    } catch (error) {
      console.error("Error adding holiday:", error)
      showNotification("error", t("errorAddingHoliday"))
    }
  }

  const removeHoliday = async (holidayId) => {
    try {
      const { error } = await supabase.from("holidays").delete().eq("id", holidayId)

      if (error) throw error

      showNotification("success", t("holidayRemovedSuccessfully"))
      fetchHolidays()
      fetchAttendanceData()
    } catch (error) {
      console.error("Error removing holiday:", error)
      showNotification("error", t("errorRemovingHoliday"))
    }
  }

  const formatTime = (timeString) => {
    if (!timeString) return "--:--"
    const date = new Date(timeString)
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
  }

  const isHoliday = holidays.some((h) => h.date === selectedDate.toISOString().split("T")[0])
  const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t("attendanceEditor")}</h3>
          <p className="text-gray-600 dark:text-gray-400">{t("manualAttendanceAdjustments")}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <DatePicker selected={selectedDate} onChange={setSelectedDate} className="input" dateFormat="dd/MM/yyyy" />
          <button onClick={() => setShowHolidayForm(true)} className="btn btn-secondary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("addHoliday")}
          </button>
        </div>
      </div>

      {/* Date Status Indicators */}
      <div className="flex flex-wrap gap-2">
        {isWeekend && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            <Calendar className="h-4 w-4 mr-1" />
            {t("weekend")}
          </span>
        )}
        {isHoliday && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            <AlertCircle className="h-4 w-4 mr-1" />
            {t("holiday")}
          </span>
        )}
      </div>

      {/* Holiday Form Modal */}
      <AnimatePresence>
        {showHolidayForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold mb-4">{t("addHoliday")}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("holidayName")}</label>
                  <input
                    type="text"
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                    className="input"
                    placeholder={t("enterHolidayName")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("date")}</label>
                  <DatePicker
                    selected={newHoliday.date}
                    onChange={(date) => setNewHoliday({ ...newHoliday, date })}
                    className="input"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={newHoliday.isRecurring}
                    onChange={(e) => setNewHoliday({ ...newHoliday, isRecurring: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600"
                  />
                  <label htmlFor="recurring" className="ml-2 text-sm">
                    {t("recurringAnnually")}
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowHolidayForm(false)} className="btn btn-outline">
                  {t("cancel")}
                </button>
                <button onClick={addHoliday} className="btn btn-primary">
                  {t("add")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attendance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("employee")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("checkinTime")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("checkoutTime")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("status")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {attendanceData.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.lavozim}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{formatTime(employee.checkinTime)}</span>
                      {employee.hasEdit && <Edit2 className="h-4 w-4 text-blue-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{formatTime(employee.checkoutTime)}</span>
                      {employee.hasEdit && <Edit2 className="h-4 w-4 text-blue-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {employee.edit?.edit_type && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                        {t(employee.edit.edit_type)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingRecord(employee.id)}
                        className="btn btn-sm btn-outline"
                        title={t("editTimes")}
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => markSpecialDay(employee.id, "absence")}
                        className="btn btn-sm btn-outline"
                        title={t("markAbsent")}
                      >
                        {t("absent")}
                      </button>
                      <button
                        onClick={() => markSpecialDay(employee.id, "sick_leave")}
                        className="btn btn-sm btn-outline"
                        title={t("markSickLeave")}
                      >
                        {t("sick")}
                      </button>
                      <button
                        onClick={() => markSpecialDay(employee.id, "vacation")}
                        className="btn btn-sm btn-outline"
                        title={t("markVacation")}
                      >
                        {t("vacation")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Time Modal */}
      <AnimatePresence>
        {editingRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold mb-4">{t("editAttendanceTimes")}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("checkinTime")}</label>
                  <input
                    type="time"
                    className="input"
                    onChange={(e) => {
                      if (e.target.value) {
                        const [hours, minutes] = e.target.value.split(":")
                        const newTime = new Date(selectedDate)
                        newTime.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)
                        handleTimeEdit(editingRecord, "checkin", newTime.toISOString())
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("checkoutTime")}</label>
                  <input
                    type="time"
                    className="input"
                    onChange={(e) => {
                      if (e.target.value) {
                        const [hours, minutes] = e.target.value.split(":")
                        const newTime = new Date(selectedDate)
                        newTime.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)
                        handleTimeEdit(editingRecord, "checkout", newTime.toISOString())
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setEditingRecord(null)} className="btn btn-outline">
                  {t("cancel")}
                </button>
                <button onClick={() => setEditingRecord(null)} className="btn btn-primary">
                  {t("save")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Holidays List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-lg font-semibold mb-4">{t("companyHolidays")}</h4>
        <div className="space-y-2">
          {holidays.map((holiday) => (
            <div
              key={holiday.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <div className="font-medium">{holiday.name}</div>
                <div className="text-sm text-gray-500">
                  {new Date(holiday.date).toLocaleDateString()}
                  {holiday.is_recurring && ` (${t("recurring")})`}
                </div>
              </div>
              <button
                onClick={() => removeHoliday(holiday.id)}
                className="btn btn-sm btn-danger"
                title={t("removeHoliday")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
