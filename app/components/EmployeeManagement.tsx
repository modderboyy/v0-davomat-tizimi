"use client"

import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useLanguage } from "../context/LanguageContext"
import { Search, SortAsc, SortDesc, Trash2, Edit2, Check, X, UserPlus, Users, Archive } from "lucide-react"
import { useDynamicIsland } from "./DynamicIsland"
import AddEmployeeForm from "./AddEmployeeForm"
import AutoEmployeeForm from "./AutoEmployeeForm"
import { motion, AnimatePresence } from "framer-motion"

export default function EmployeeManagement({ companyId, employeeLimit, currentEmployeeCount, isPremium }) {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployees, setSelectedEmployees] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [showAutoEmployee, setShowAutoEmployee] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [editName, setEditName] = useState("")
  const [editLavozim, setEditLavozim] = useState("")
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all") // all, active, archived

  const { t } = useLanguage()
  const { showNotification } = useDynamicIsland()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_super_admin", false)
        .order(sortBy, { ascending: sortOrder === "asc" })

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error("Error fetching employees:", error)
      showNotification("error", t("errorFetchingEmployees"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [sortBy, sortOrder])

  // Filtered and sorted employees
  const filteredEmployees = useMemo(() => {
    const filtered = employees.filter((employee) => {
      const matchesSearch =
        employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.lavozim?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter =
        filterStatus === "all" ||
        (filterStatus === "active" && !employee.archived) ||
        (filterStatus === "archived" && employee.archived)

      return matchesSearch && matchesFilter
    })

    return filtered
  }, [employees, searchTerm, filterStatus])

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  const handleSelectEmployee = (employeeId) => {
    const newSelected = new Set(selectedEmployees)
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId)
    } else {
      newSelected.add(employeeId)
    }
    setSelectedEmployees(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const handleSelectAll = () => {
    if (selectedEmployees.size === filteredEmployees.length) {
      setSelectedEmployees(new Set())
      setShowBulkActions(false)
    } else {
      setSelectedEmployees(new Set(filteredEmployees.map((emp) => emp.id)))
      setShowBulkActions(true)
    }
  }

  const handleBulkArchive = async () => {
    try {
      const { error } = await supabase.from("users").update({ archived: true }).in("id", Array.from(selectedEmployees))

      if (error) throw error

      showNotification("success", t("employeesArchivedSuccessfully", { count: selectedEmployees.size }))
      setSelectedEmployees(new Set())
      setShowBulkActions(false)
      fetchEmployees()
    } catch (error) {
      console.error("Error archiving employees:", error)
      showNotification("error", t("errorArchivingEmployees"))
    }
  }

  const handleBulkUnarchive = async () => {
    try {
      const { error } = await supabase.from("users").update({ archived: false }).in("id", Array.from(selectedEmployees))

      if (error) throw error

      showNotification("success", t("employeesUnarchivedSuccessfully", { count: selectedEmployees.size }))
      setSelectedEmployees(new Set())
      setShowBulkActions(false)
      fetchEmployees()
    } catch (error) {
      console.error("Error unarchiving employees:", error)
      showNotification("error", t("errorUnarchivingEmployees"))
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(t("confirmBulkDelete", { count: selectedEmployees.size }))) return

    try {
      const { error } = await supabase.from("users").delete().in("id", Array.from(selectedEmployees))

      if (error) throw error

      showNotification("success", t("employeesDeletedSuccessfully", { count: selectedEmployees.size }))
      setSelectedEmployees(new Set())
      setShowBulkActions(false)
      fetchEmployees()
    } catch (error) {
      console.error("Error deleting employees:", error)
      showNotification("error", t("errorDeletingEmployees"))
    }
  }

  const handleEditStart = (employee) => {
    setEditingEmployee(employee)
    setEditName(employee.name)
    setEditLavozim(employee.lavozim)
  }

  const handleEditCancel = () => {
    setEditingEmployee(null)
    setEditName("")
    setEditLavozim("")
  }

  const handleEditSave = async (employeeId) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: editName,
          lavozim: editLavozim,
        })
        .eq("id", employeeId)

      if (error) throw error

      showNotification("success", t("employeeUpdatedSuccessfully"))
      fetchEmployees()
      setEditingEmployee(null)
      setEditName("")
      setEditLavozim("")
    } catch (error) {
      console.error("Error updating employee:", error)
      showNotification("error", t("errorUpdatingEmployee"))
    }
  }

  const handleToggleArchive = async (employee) => {
    try {
      const { error } = await supabase.from("users").update({ archived: !employee.archived }).eq("id", employee.id)

      if (error) throw error

      showNotification("success", employee.archived ? t("employeeUnarchived") : t("employeeArchived"))
      fetchEmployees()
    } catch (error) {
      console.error("Error toggling archive status:", error)
      showNotification("error", t("errorUpdatingEmployee"))
    }
  }

  const handleUploadAvatar = async (employeeId, file) => {
    if (!isPremium) return

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${employeeId}.${fileExt}`
      const filePath = `avatar/${fileName}`

      const { error: uploadError } = await supabase.storage.from("users").upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("users").getPublicUrl(filePath)

      const { error: updateError } = await supabase.from("users").update({ avatar: publicUrl }).eq("id", employeeId)

      if (updateError) throw updateError

      showNotification("success", t("avatarUpdatedSuccessfully"))
      fetchEmployees()
    } catch (error) {
      console.error("Error uploading avatar:", error)
      showNotification("error", t("errorUploadingAvatar"))
    }
  }

  const getSortIcon = (field) => {
    if (sortBy !== field) return null
    return sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t("employeeManagement")}</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredEmployees.length} {t("employees")} • {currentEmployeeCount} /{" "}
            {employeeLimit === Number.POSITIVE_INFINITY ? "∞" : employeeLimit} {t("used")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!showAddEmployee && !showAutoEmployee && (
            <>
              <button onClick={() => setShowAddEmployee(true)} className="btn btn-primary flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                {t("addEmployee")}
              </button>
              <button onClick={() => setShowAutoEmployee(true)} className="btn btn-secondary flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t("autoAddEmployees")}
              </button>
            </>
          )}
          {(showAddEmployee || showAutoEmployee) && (
            <button
              onClick={() => {
                setShowAddEmployee(false)
                setShowAutoEmployee(false)
              }}
              className="btn btn-outline"
            >
              {t("cancel")}
            </button>
          )}
        </div>
      </div>

      {/* Add/Auto Employee Forms */}
      <AnimatePresence>
        {showAddEmployee && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <AddEmployeeForm
              onEmployeeAdded={() => {
                fetchEmployees()
                setShowAddEmployee(false)
              }}
              companyId={companyId}
            />
          </motion.div>
        )}

        {showAutoEmployee && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <AutoEmployeeForm
              onEmployeeAdded={() => {
                fetchEmployees()
                setShowAutoEmployee(false)
              }}
              companyId={companyId}
              companyName=""
              currentEmployeeCount={currentEmployeeCount}
              employeeLimit={employeeLimit}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchEmployees")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input min-w-[120px]"
            >
              <option value="all">{t("allEmployees")}</option>
              <option value="active">{t("activeEmployees")}</option>
              <option value="archived">{t("archivedEmployees")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {showBulkActions && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-indigo-700 dark:text-indigo-300 font-medium">
                {selectedEmployees.size} {t("employeesSelected")}
              </span>
              <div className="flex gap-2">
                <button onClick={handleBulkArchive} className="btn btn-outline btn-sm flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  {t("archive")}
                </button>
                <button onClick={handleBulkUnarchive} className="btn btn-outline btn-sm flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  {t("unarchive")}
                </button>
                <button onClick={handleBulkDelete} className="btn btn-danger btn-sm flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  {t("delete")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Employee Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                {isPremium && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t("avatar")}
                  </th>
                )}
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-2">
                    {t("name")}
                    {getSortIcon("name")}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort("lavozim")}
                >
                  <div className="flex items-center gap-2">
                    {t("position")}
                    {getSortIcon("lavozim")}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("email")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort("created_at")}
                >
                  <div className="flex items-center gap-2">
                    {t("dateAdded")}
                    {getSortIcon("created_at")}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("status")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEmployees.map((employee) => (
                <motion.tr
                  key={employee.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.has(employee.id)}
                      onChange={() => handleSelectEmployee(employee.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  {isPremium && (
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {employee.avatar && (
                          <div className="w-10 h-10 rounded-full overflow-hidden">
                            <img
                              src={employee.avatar || "/placeholder.svg"}
                              alt={employee.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <label className="btn btn-sm btn-outline cursor-pointer">
                          {employee.avatar ? t("change") : t("upload")}
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleUploadAvatar(employee.id, e.target.files[0])
                              }
                            }}
                          />
                        </label>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-4">
                    {editingEmployee?.id === employee.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input"
                      />
                    ) : (
                      <div className="font-medium text-gray-900 dark:text-white">{employee.name}</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {editingEmployee?.id === employee.id ? (
                      <input
                        type="text"
                        value={editLavozim}
                        onChange={(e) => setEditLavozim(e.target.value)}
                        className="input"
                      />
                    ) : (
                      <div className="text-gray-600 dark:text-gray-400">{employee.lavozim}</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-gray-600 dark:text-gray-400">{employee.email}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-gray-600 dark:text-gray-400">
                      {new Date(employee.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.archived
                          ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      }`}
                    >
                      {employee.archived ? t("archived") : t("active")}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {editingEmployee?.id === employee.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleEditSave(employee.id)} className="btn btn-sm btn-success">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={handleEditCancel} className="btn btn-sm btn-outline">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditStart(employee)}
                          className="btn btn-sm btn-outline"
                          title={t("edit")}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleArchive(employee)}
                          className="btn btn-sm btn-outline"
                          title={employee.archived ? t("unarchive") : t("archive")}
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? t("noEmployeesFound") : t("noEmployeesYet")}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
