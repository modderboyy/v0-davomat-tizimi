"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "../context/LanguageContext"
import { useDynamicIsland } from "./DynamicIsland"
import { Building, Settings, Bell, Shield, Clock, Save, Plus, Edit } from "lucide-react"

export default function CompanySettings({ companyId }) {
  const [activeSection, setActiveSection] = useState("general")
  const [companyData, setCompanyData] = useState(null)
  const [recognitionTypes, setRecognitionTypes] = useState([])
  const [shiftTemplates, setShiftTemplates] = useState([])
  const [expenseCategories, setExpenseCategories] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [newRecognitionType, setNewRecognitionType] = useState({ name: "", description: "", points: 0 })
  const [newShiftTemplate, setNewShiftTemplate] = useState({ name: "", startTime: "09:00", endTime: "17:00" })
  const [newExpenseCategory, setNewExpenseCategory] = useState({ name: "", maxAmount: 0, requiresReceipt: true })
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", priority: "normal" })

  const { t } = useLanguage()
  const { showNotification } = useDynamicIsland()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchCompanySettings()
  }, [])

  const fetchCompanySettings = async () => {
    try {
      setLoading(true)

      // Fetch company data
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single()

      if (companyError) throw companyError

      // Fetch recognition types
      const { data: recognition, error: recognitionError } = await supabase
        .from("recognition_types")
        .select("*")
        .eq("company_id", companyId)

      if (recognitionError) throw recognitionError

      // Fetch shift templates
      const { data: shifts, error: shiftsError } = await supabase
        .from("shift_templates")
        .select("*")
        .eq("company_id", companyId)

      if (shiftsError) throw shiftsError

      // Fetch expense categories
      const { data: expenses, error: expensesError } = await supabase
        .from("expense_categories")
        .select("*")
        .eq("company_id", companyId)

      if (expensesError) throw expensesError

      // Fetch announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from("company_announcements")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })

      if (announcementsError) throw announcementsError

      setCompanyData(company)
      setRecognitionTypes(recognition || [])
      setShiftTemplates(shifts || [])
      setExpenseCategories(expenses || [])
      setAnnouncements(announcementsData || [])
    } catch (error) {
      console.error("Error fetching company settings:", error)
      showNotification("error", t("errorFetchingSettings"))
    } finally {
      setLoading(false)
    }
  }

  const updateCompanySettings = async (updates) => {
    try {
      const { error } = await supabase.from("companies").update(updates).eq("id", companyId)

      if (error) throw error

      setCompanyData({ ...companyData, ...updates })
      showNotification("success", t("settingsUpdatedSuccessfully"))
    } catch (error) {
      console.error("Error updating company settings:", error)
      showNotification("error", t("errorUpdatingSettings"))
    }
  }

  const addRecognitionType = async () => {
    try {
      const { data, error } = await supabase
        .from("recognition_types")
        .insert({
          company_id: companyId,
          ...newRecognitionType,
        })
        .select()
        .single()

      if (error) throw error

      setRecognitionTypes([...recognitionTypes, data])
      setNewRecognitionType({ name: "", description: "", points: 0 })
      showNotification("success", t("recognitionTypeAdded"))
    } catch (error) {
      console.error("Error adding recognition type:", error)
      showNotification("error", t("errorAddingRecognitionType"))
    }
  }

  const addShiftTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from("shift_templates")
        .insert({
          company_id: companyId,
          ...newShiftTemplate,
          start_time: newShiftTemplate.startTime,
          end_time: newShiftTemplate.endTime,
        })
        .select()
        .single()

      if (error) throw error

      setShiftTemplates([...shiftTemplates, data])
      setNewShiftTemplate({ name: "", startTime: "09:00", endTime: "17:00" })
      showNotification("success", t("shiftTemplateAdded"))
    } catch (error) {
      console.error("Error adding shift template:", error)
      showNotification("error", t("errorAddingShiftTemplate"))
    }
  }

  const addExpenseCategory = async () => {
    try {
      const { data, error } = await supabase
        .from("expense_categories")
        .insert({
          company_id: companyId,
          name: newExpenseCategory.name,
          max_amount: newExpenseCategory.maxAmount,
          requires_receipt: newExpenseCategory.requiresReceipt,
        })
        .select()
        .single()

      if (error) throw error

      setExpenseCategories([...expenseCategories, data])
      setNewExpenseCategory({ name: "", maxAmount: 0, requiresReceipt: true })
      showNotification("success", t("expenseCategoryAdded"))
    } catch (error) {
      console.error("Error adding expense category:", error)
      showNotification("error", t("errorAddingExpenseCategory"))
    }
  }

  const addAnnouncement = async () => {
    try {
      const { data, error } = await supabase
        .from("company_announcements")
        .insert({
          company_id: companyId,
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          priority: newAnnouncement.priority,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single()

      if (error) throw error

      setAnnouncements([data, ...announcements])
      setNewAnnouncement({ title: "", content: "", priority: "normal" })
      showNotification("success", t("announcementAdded"))
    } catch (error) {
      console.error("Error adding announcement:", error)
      showNotification("error", t("errorAddingAnnouncement"))
    }
  }

  const sections = [
    { id: "general", label: t("generalSettings"), icon: <Settings /> },
    { id: "recognition", label: t("recognitionSettings"), icon: <Shield /> },
    { id: "shifts", label: t("shiftManagement"), icon: <Clock /> },
    { id: "expenses", label: t("expenseSettings"), icon: <Building /> },
    { id: "announcements", label: t("announcements"), icon: <Bell /> },
  ]

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
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t("companySettings")}</h3>
          <p className="text-gray-600 dark:text-gray-400">{t("manageCompanyConfiguration")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === section.id
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            {activeSection === "general" && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold">{t("generalSettings")}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t("companyName")}</label>
                    <input
                      type="text"
                      value={companyData?.company_name || ""}
                      onChange={(e) => setCompanyData({ ...companyData, company_name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t("timezone")}</label>
                    <select
                      value={companyData?.timezone || "Asia/Tashkent"}
                      onChange={(e) => setCompanyData({ ...companyData, timezone: e.target.value })}
                      className="input"
                    >
                      <option value="Asia/Tashkent">Asia/Tashkent</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Europe/London">Europe/London</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => updateCompanySettings(companyData)}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {t("saveChanges")}
                  </button>
                </div>
              </div>
            )}

            {activeSection === "recognition" && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold">{t("recognitionTypes")}</h4>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h5 className="font-medium mb-4">{t("addRecognitionType")}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder={t("recognitionName")}
                      value={newRecognitionType.name}
                      onChange={(e) => setNewRecognitionType({ ...newRecognitionType, name: e.target.value })}
                      className="input"
                    />
                    <input
                      type="text"
                      placeholder={t("description")}
                      value={newRecognitionType.description}
                      onChange={(e) => setNewRecognitionType({ ...newRecognitionType, description: e.target.value })}
                      className="input"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder={t("points")}
                        value={newRecognitionType.points}
                        onChange={(e) =>
                          setNewRecognitionType({ ...newRecognitionType, points: Number.parseInt(e.target.value) })
                        }
                        className="input"
                      />
                      <button onClick={addRecognitionType} className="btn btn-primary">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {recognitionTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{type.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {type.points_value} {t("points")}
                        </span>
                        <button className="btn btn-sm btn-outline">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "shifts" && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold">{t("shiftTemplates")}</h4>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h5 className="font-medium mb-4">{t("addShiftTemplate")}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder={t("shiftName")}
                      value={newShiftTemplate.name}
                      onChange={(e) => setNewShiftTemplate({ ...newShiftTemplate, name: e.target.value })}
                      className="input"
                    />
                    <input
                      type="time"
                      value={newShiftTemplate.startTime}
                      onChange={(e) => setNewShiftTemplate({ ...newShiftTemplate, startTime: e.target.value })}
                      className="input"
                    />
                    <input
                      type="time"
                      value={newShiftTemplate.endTime}
                      onChange={(e) => setNewShiftTemplate({ ...newShiftTemplate, endTime: e.target.value })}
                      className="input"
                    />
                    <button onClick={addShiftTemplate} className="btn btn-primary">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {shiftTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {template.start_time} - {template.end_time}
                        </div>
                      </div>
                      <button className="btn btn-sm btn-outline">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "expenses" && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold">{t("expenseCategories")}</h4>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h5 className="font-medium mb-4">{t("addExpenseCategory")}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder={t("categoryName")}
                      value={newExpenseCategory.name}
                      onChange={(e) => setNewExpenseCategory({ ...newExpenseCategory, name: e.target.value })}
                      className="input"
                    />
                    <input
                      type="number"
                      placeholder={t("maxAmount")}
                      value={newExpenseCategory.maxAmount}
                      onChange={(e) =>
                        setNewExpenseCategory({ ...newExpenseCategory, maxAmount: Number.parseFloat(e.target.value) })
                      }
                      className="input"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="requiresReceipt"
                        checked={newExpenseCategory.requiresReceipt}
                        onChange={(e) =>
                          setNewExpenseCategory({ ...newExpenseCategory, requiresReceipt: e.target.checked })
                        }
                        className="rounded"
                      />
                      <label htmlFor="requiresReceipt" className="text-sm">
                        {t("requiresReceipt")}
                      </label>
                    </div>
                    <button onClick={addExpenseCategory} className="btn btn-primary">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {expenseCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {t("maxAmount")}: ${category.max_amount} •{" "}
                          {category.requires_receipt ? t("receiptRequired") : t("receiptOptional")}
                        </div>
                      </div>
                      <button className="btn btn-sm btn-outline">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "announcements" && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold">{t("companyAnnouncements")}</h4>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h5 className="font-medium mb-4">{t("addAnnouncement")}</h5>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder={t("announcementTitle")}
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      className="input"
                    />
                    <textarea
                      placeholder={t("announcementContent")}
                      value={newAnnouncement.content}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                      className="input h-24"
                    />
                    <div className="flex gap-4">
                      <select
                        value={newAnnouncement.priority}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                        className="input"
                      >
                        <option value="low">{t("lowPriority")}</option>
                        <option value="normal">{t("normalPriority")}</option>
                        <option value="high">{t("highPriority")}</option>
                        <option value="urgent">{t("urgentPriority")}</option>
                      </select>
                      <button onClick={addAnnouncement} className="btn btn-primary">
                        <Plus className="h-4 w-4" />
                        {t("addAnnouncement")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium">{announcement.title}</h5>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                announcement.priority === "urgent"
                                  ? "bg-red-100 text-red-800"
                                  : announcement.priority === "high"
                                    ? "bg-orange-100 text-orange-800"
                                    : announcement.priority === "normal"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {t(announcement.priority + "Priority")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{announcement.content}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(announcement.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button className="btn btn-sm btn-outline">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
