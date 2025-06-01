"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "../context/LanguageContext"
import { useDynamicIsland } from "./DynamicIsland"
import { Brain, Star, BookOpen, TrendingUp, Plus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function SkillsManagement({ companyId }) {
  const [employees, setEmployees] = useState([])
  const [skills, setSkills] = useState([])
  const [skillCategories, setSkillCategories] = useState([])
  const [employeeSkills, setEmployeeSkills] = useState([])
  const [trainingPrograms, setTrainingPrograms] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [newSkill, setNewSkill] = useState({ name: "", description: "", categoryId: "", level: "beginner" })
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
      await Promise.all([
        fetchEmployees(),
        fetchSkillCategories(),
        fetchSkills(),
        fetchEmployeeSkills(),
        fetchTrainingPrograms(),
      ])
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

  const fetchSkillCategories = async () => {
    try {
      const { data, error } = await supabase.from("skill_categories").select("*").order("name")

      if (error) throw error
      setSkillCategories(data || [])
    } catch (error) {
      console.error("Error fetching skill categories:", error)
    }
  }

  const fetchSkills = async () => {
    try {
      const { data, error } = await supabase.from("skills").select("*, skill_categories(*)").order("name")

      if (error) throw error
      setSkills(data || [])
    } catch (error) {
      console.error("Error fetching skills:", error)
    }
  }

  const fetchEmployeeSkills = async () => {
    try {
      const { data, error } = await supabase
        .from("employee_skills")
        .select("*, skills(*, skill_categories(*)), users:employee_id(name)")
        .in(
          "employee_id",
          employees.map((emp) => emp.id),
        )

      if (error) throw error
      setEmployeeSkills(data || [])
    } catch (error) {
      console.error("Error fetching employee skills:", error)
    }
  }

  const fetchTrainingPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from("training_programs")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTrainingPrograms(data || [])
    } catch (error) {
      console.error("Error fetching training programs:", error)
    }
  }

  const addSkill = async () => {
    try {
      const { data, error } = await supabase
        .from("skills")
        .insert({
          category_id: newSkill.categoryId,
          name: newSkill.name,
          description: newSkill.description,
          level_required: newSkill.level,
        })
        .select()
        .single()

      if (error) throw error

      showNotification("success", t("skillAddedSuccessfully"))
      setNewSkill({ name: "", description: "", categoryId: "", level: "beginner" })
      setShowAddSkill(false)
      fetchSkills()
    } catch (error) {
      console.error("Error adding skill:", error)
      showNotification("error", t("errorAddingSkill"))
    }
  }

  const updateEmployeeSkill = async (employeeId, skillId, proficiencyLevel) => {
    try {
      const { error } = await supabase.from("employee_skills").upsert(
        {
          employee_id: employeeId,
          skill_id: skillId,
          proficiency_level: proficiencyLevel,
          last_assessed: new Date().toISOString().split("T")[0],
        },
        { onConflict: "employee_id,skill_id" },
      )

      if (error) throw error

      showNotification("success", t("skillUpdatedSuccessfully"))
      fetchEmployeeSkills()
    } catch (error) {
      console.error("Error updating employee skill:", error)
      showNotification("error", t("errorUpdatingSkill"))
    }
  }

  const getSkillLevelColor = (level) => {
    switch (level) {
      case 1:
        return "text-red-500"
      case 2:
        return "text-orange-500"
      case 3:
        return "text-yellow-500"
      case 4:
        return "text-green-500"
      case 5:
        return "text-blue-500"
      default:
        return "text-gray-500"
    }
  }

  const renderStars = (level) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < level ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
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
            <Brain className="h-6 w-6 text-purple-500" />
            {t("skillsManagement")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{t("manageEmployeeSkillsAndTraining")}</p>
        </div>

        <button onClick={() => setShowAddSkill(true)} className="btn btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t("addSkill")}
        </button>
      </div>

      {/* Skills Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("totalSkills")}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{skills.length}</p>
            </div>
            <Brain className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("skillCategories")}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{skillCategories.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("trainingPrograms")}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{trainingPrograms.length}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills by Category */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold">{t("skillsByCategory")}</h4>
          </div>
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {skillCategories.map((category) => {
              const categorySkills = skills.filter((skill) => skill.category_id === category.id)
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">{category.name}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {categorySkills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                      >
                        <span className="text-sm font-medium">{skill.name}</span>
                        <span className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 px-2 py-1 rounded">
                          {skill.level_required}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Employee Skills Matrix */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold">{t("employeeSkillsMatrix")}</h4>
          </div>
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {employees.map((employee) => {
              const empSkills = employeeSkills.filter((es) => es.employee_id === employee.id)
              return (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">{employee.name}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{employee.lavozim}</p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {empSkills.length} {t("skills")}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {empSkills.slice(0, 3).map((empSkill) => (
                      <div key={empSkill.id} className="flex items-center justify-between">
                        <span className="text-sm">{empSkill.skills?.name}</span>
                        <div className="flex items-center">{renderStars(empSkill.proficiency_level)}</div>
                      </div>
                    ))}
                    {empSkills.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{empSkills.length - 3} {t("moreSkills")}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Training Programs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold">{t("trainingPrograms")}</h4>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {trainingPrograms.map((program) => (
            <motion.div key={program.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 dark:text-white">{program.title}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{program.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded">
                      {program.duration_hours}h
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded">
                      {program.difficulty_level}
                    </span>
                  </div>
                </div>
                {program.url && (
                  <a href={program.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                    {t("viewProgram")}
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add Skill Modal */}
      <AnimatePresence>
        {showAddSkill && (
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
              <h3 className="text-lg font-semibold mb-4">{t("addNewSkill")}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("skillName")}</label>
                  <input
                    type="text"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    className="input"
                    placeholder={t("enterSkillName")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("description")}</label>
                  <textarea
                    value={newSkill.description}
                    onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                    className="input h-20"
                    placeholder={t("skillDescription")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("category")}</label>
                  <select
                    value={newSkill.categoryId}
                    onChange={(e) => setNewSkill({ ...newSkill, categoryId: e.target.value })}
                    className="input"
                  >
                    <option value="">{t("selectCategory")}</option>
                    {skillCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("requiredLevel")}</label>
                  <select
                    value={newSkill.level}
                    onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                    className="input"
                  >
                    <option value="beginner">{t("beginner")}</option>
                    <option value="intermediate">{t("intermediate")}</option>
                    <option value="advanced">{t("advanced")}</option>
                    <option value="expert">{t("expert")}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAddSkill(false)} className="btn btn-outline">
                  {t("cancel")}
                </button>
                <button onClick={addSkill} className="btn btn-primary">
                  {t("addSkill")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
