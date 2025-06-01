"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "../context/LanguageContext"
import { useDynamicIsland } from "./DynamicIsland"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, Users } from "lucide-react"

interface Employee {
  id: string
  name: string
  email: string
  lavozim: string
}

interface ShiftTemplate {
  id: string
  name: string
  start_time: string
  end_time: string
  color: string
  description: string
}

interface ScheduledShift {
  id: string
  employee_id: string
  template_id: string
  date: string
  start_time: string
  end_time: string
  notes: string
  users: { name: string; lavozim: string }
  shift_templates: { name: string; color: string }
}

export default function ShiftScheduling({ companyId }: { companyId: string }) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([])
  const [scheduledShifts, setScheduledShifts] = useState<ScheduledShift[]>([])
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [showCreateShift, setShowCreateShift] = useState(false)
  const [newShift, setNewShift] = useState({
    employeeId: "",
    templateId: "",
    date: "",
    startTime: "09:00",
    endTime: "17:00",
    notes: "",
  })
  const [loading, setLoading] = useState(true)

  const { t } = useLanguage()
  const { showNotification } = useDynamicIsland()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchData()
  }, [selectedWeek])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([fetchEmployees(), fetchShiftTemplates(), fetchScheduledShifts()])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
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

  const fetchShiftTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("shift_templates")
        .select("*")
        .eq("company_id", companyId)
        .order("name")

      if (error) throw error
      setShiftTemplates(data || [])
    } catch (error) {
      console.error("Error fetching shift templates:", error)
    }
  }

  const fetchScheduledShifts = async () => {
    try {
      const startOfWeek = getStartOfWeek(selectedWeek)
      const endOfWeek = getEndOfWeek(selectedWeek)

      const { data, error } = await supabase
        .from("scheduled_shifts")
        .select("*, users:employee_id(name, lavozim), shift_templates:template_id(name, color)")
        .eq("company_id", companyId)
        .gte("date", startOfWeek.toISOString().split("T")[0])
        .lte("date", endOfWeek.toISOString().split("T")[0])

      if (error) throw error
      setScheduledShifts(data || [])
    } catch (error) {
      console.error("Error fetching scheduled shifts:", error)
    }
  }

  const getStartOfWeek = (date: Date) => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Monday as start
    return new Date(start.setDate(diff))
  }

  const getEndOfWeek = (date: Date) => {
    const start = getStartOfWeek(date)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return end
  }

  const getWeekDays = () => {
    const start = getStartOfWeek(selectedWeek)
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push(day)
    }
    return days
  }

  const createShift = async () => {
    try {
      const { error } = await supabase.from("scheduled_shifts").insert({
        company_id: companyId,
        employee_id: newShift.employeeId,
        template_id: newShift.templateId || null,
        date: newShift.date,
        start_time: newShift.startTime,
        end_time: newShift.endTime,
        notes: newShift.notes,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })

      if (error) throw error

      showNotification("success", t("shiftCreatedSuccessfully"))
      setNewShift({
        employeeId: "",
        templateId: "",
        date: "",
        startTime: "09:00",
        endTime: "17:00",
        notes: "",
      })
      setShowCreateShift(false)
      fetchScheduledShifts()
    } catch (error) {
      console.error("Error creating shift:", error)
      showNotification("error", t("errorCreatingShift"))
    }
  }

  const deleteShift = async (shiftId: string) => {
    try {
      const { error } = await supabase.from("scheduled_shifts").delete().eq("id", shiftId)

      if (error) throw error

      showNotification("success", t("shiftDeletedSuccessfully"))
      fetchScheduledShifts()
    } catch (error) {
      console.error("Error deleting shift:", error)
      showNotification("error", t("errorDeletingShift"))
    }
  }

  const getShiftsForDay = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return scheduledShifts.filter((shift) => shift.date === dateStr)
  }

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(selectedWeek)
    newDate.setDate(selectedWeek.getDate() + (direction === "next" ? 7 : -7))
    setSelectedWeek(newDate)
  }

  const weekDays = getWeekDays()
  const dayNames = [t("monday"), t("tuesday"), t("wednesday"), t("thursday"), t("friday"), t("saturday"), t("sunday")]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          {t("shiftScheduling")}
        </h2>
        <Dialog open={showCreateShift} onOpenChange={setShowCreateShift}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t("createShift")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("createNewShift")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="employee">{t("employee")}</Label>
                <Select
                  value={newShift.employeeId}
                  onValueChange={(value) => setNewShift({ ...newShift, employeeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectEmployee")} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.lavozim}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="template">{t("shiftTemplate")}</Label>
                <Select
                  value={newShift.templateId}
                  onValueChange={(value) => setNewShift({ ...newShift, templateId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectTemplate")} />
                  </SelectTrigger>
                  <SelectContent>
                    {shiftTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.start_time} - {template.end_time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">{t("date")}</Label>
                <Input
                  type="date"
                  value={newShift.date}
                  onChange={(e) => setNewShift({ ...newShift, date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">{t("startTime")}</Label>
                  <Input
                    type="time"
                    value={newShift.startTime}
                    onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">{t("endTime")}</Label>
                  <Input
                    type="time"
                    value={newShift.endTime}
                    onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">{t("notes")}</Label>
                <Textarea
                  value={newShift.notes}
                  onChange={(e) => setNewShift({ ...newShift, notes: e.target.value })}
                  placeholder={t("shiftNotes")}
                />
              </div>

              <Button onClick={createShift} className="w-full">
                {t("createShift")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigateWeek("prev")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          {weekDays[0].toLocaleDateString()} - {weekDays[6].toLocaleDateString()}
        </h3>
        <Button variant="outline" onClick={() => navigateWeek("next")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => (
          <Card key={day.toISOString()} className="min-h-[200px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-center">
                {dayNames[index]}
                <br />
                <span className="text-xs text-muted-foreground">
                  {day.getDate()}/{day.getMonth() + 1}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {getShiftsForDay(day).map((shift) => (
                <div
                  key={shift.id}
                  className="p-2 rounded text-xs"
                  style={{ backgroundColor: shift.shift_templates?.color || "#e5e7eb" }}
                >
                  <div className="font-medium">{shift.users?.name}</div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {shift.start_time} - {shift.end_time}
                  </div>
                  {shift.shift_templates?.name && (
                    <div className="text-xs opacity-75">{shift.shift_templates.name}</div>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-1 h-5 text-xs"
                    onClick={() => deleteShift(shift.id)}
                  >
                    {t("delete")}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("weeklyStatistics")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{scheduledShifts.length}</div>
              <div className="text-sm text-muted-foreground">{t("totalShifts")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{new Set(scheduledShifts.map((s) => s.employee_id)).size}</div>
              <div className="text-sm text-muted-foreground">{t("employeesScheduled")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {scheduledShifts
                  .reduce((total, shift) => {
                    const start = new Date(`2000-01-01T${shift.start_time}`)
                    const end = new Date(`2000-01-01T${shift.end_time}`)
                    return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
                  }, 0)
                  .toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">{t("totalHours")}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
