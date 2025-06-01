"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "../context/LanguageContext"
import { useDynamicIsland } from "./DynamicIsland"
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  DollarSign,
  Award,
  Target,
  Heart,
  Save,
  Edit,
  X,
  Plus,
  Star,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function EmployeeDetailView({ employeeId, onClose }) {
  const [employee, setEmployee] = useState(null)
  const [employeeDetails, setEmployeeDetails] = useState(null)
  const [goals, setGoals] = useState([])
  const [skills, setSkills] = useState([])
  const [achievements, setAchievements] = useState([])
  const [wellnessData, setWellnessData] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [newGoal, setNewGoal] = useState({ title: "", description: "", targetDate: "" })
  const [showAddGoal, setShowAddGoal] = useState(false)

  const { t } = useLanguage()
  const { showNotification } = useDynamicIsland()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeData()
    }
  }, [employeeId])

  const fetchEmployeeData = async () => {
    try {
      setLoading(true)

      // Fetch basic employee info
      const { data: employeeData, error: employeeError } = await supabase
        .from("users")
        .select("*")
        .eq("id", employeeId)
        .single()

      if (employeeError) throw employeeError

      // Fetch detailed employee info
      const { data: detailsData, error: detailsError } = await supabase
        .from("employee_details")
        .select("*")
        .eq("user_id", employeeId)
        .maybeSingle()

      if (detailsError && detailsError.code !== "PGRST116") throw detailsError

      // Fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from("employee_goals")
        .select("*")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false })

      if (goalsError) throw goalsError

      // Fetch skills
      const { data: skillsData, error: skillsError } = await supabase
        .from("employee_skills")
        .select("*, skills(*)")
        .eq("employee_id", employeeId)

      if (skillsError) throw skillsError

      // Fetch achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("employee_achievements")
        .select("*, achievements(*)")
        .eq("employee_id", employeeId)
        .order("earned_at", { ascending: false })

      if (achievementsError) throw achievementsError

      // Fetch recent wellness data
      const { data: wellnessDataResult, error: wellnessError } = await supabase
        .from("wellness_metrics")
        .select("*")
        .eq("employee_id", employeeId)
        .order("date", { ascending: false })
        .limit(7)

      if (wellnessError) throw wellnessError

      setEmployee(employeeData)
      setEmployeeDetails(detailsData)
      setGoals(goalsData || [])
      setSkills(skillsData || [])
      setAchievements(achievementsData || [])
      setWellnessData(wellnessDataResult || [])
    } catch (error) {
      console.error("Error fetching employee data:", error)
      showNotification("error", t("errorFetchingEmployeeData"))
    } finally {
      setLoading(false)
    }
  }

  const saveEmployeeDetails = async (updatedDetails) => {
    try {
      const { error } = await supabase.from("employee_details").upsert(
        {
          user_id: employeeId,
          ...updatedDetails,
        },
        { onConflict: "user_id" },
      )

      if (error) throw error

      setEmployeeDetails(updatedDetails)
      setIsEditing(false)
      showNotification("success", t("employeeDetailsUpdated"))
    } catch (error) {
      console.error("Error saving employee details:", error)
      showNotification("error", t("errorSavingEmployeeDetails"))
    }
  }

  const addGoal = async () => {
    try {
      const { data, error } = await supabase
        .from("employee_goals")
        .insert({
          employee_id: employeeId,
          title: newGoal.title,
          description: newGoal.description,
          target_date: newGoal.targetDate,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single()

      if (error) throw error

      setGoals([data, ...goals])
      setNewGoal({ title: "", description: "", targetDate: "" })
      setShowAddGoal(false)
      showNotification("success", t("goalAddedSuccessfully"))
    } catch (error) {
      console.error("Error adding goal:", error)
      showNotification("error", t("errorAddingGoal"))
    }
  }

  const updateGoalProgress = async (goalId, progress) => {
    try {
      const { error } = await supabase.from("employee_goals").update({ progress_percentage: progress }).eq("id", goalId)

      if (error) throw error

      setGoals(goals.map((goal) => (goal.id === goalId ? { ...goal, progress_percentage: progress } : goal)))
      showNotification("success", t("goalProgressUpdated"))
    } catch (error) {
      console.error("Error updating goal progress:", error)
      showNotification("error", t("errorUpdatingGoal"))
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-center">{t("loadingEmployeeData")}</p>
        </div>
      </div>
    )
  }

  return (
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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                {employee?.avatar ? (
                  <img
                    src={employee.avatar || "/placeholder.svg"}
                    alt={employee.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{employee?.name || t("unknownEmployee")}</h2>
                <p className="text-indigo-100">{employee?.lavozim || t("noPosition")}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <Edit className="h-5 w-5" />
              </button>
              <button onClick={onClose} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {["overview", "goals", "skills", "wellness", "achievements"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {t(tab)}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t("personalInformation")}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{employee?.email || t("notProvided")}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {isEditing ? (
                        <input
                          type="tel"
                          value={employeeDetails?.phone || ""}
                          onChange={(e) => setEmployeeDetails({ ...employeeDetails, phone: e.target.value })}
                          className="input flex-1"
                          placeholder={t("phoneNumber")}
                        />
                      ) : (
                        <span>{employeeDetails?.phone || t("notProvided")}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={employeeDetails?.address || ""}
                          onChange={(e) => setEmployeeDetails({ ...employeeDetails, address: e.target.value })}
                          className="input flex-1"
                          placeholder={t("address")}
                        />
                      ) : (
                        <span>{employeeDetails?.address || t("notProvided")}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {isEditing ? (
                        <input
                          type="date"
                          value={employeeDetails?.birth_date || ""}
                          onChange={(e) => setEmployeeDetails({ ...employeeDetails, birth_date: e.target.value })}
                          className="input flex-1"
                        />
                      ) : (
                        <span>
                          {employeeDetails?.birth_date
                            ? new Date(employeeDetails.birth_date).toLocaleDateString()
                            : t("notProvided")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    {t("workInformation")}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{t("hireDate")}:</span>
                      {isEditing ? (
                        <input
                          type="date"
                          value={employeeDetails?.hire_date || ""}
                          onChange={(e) => setEmployeeDetails({ ...employeeDetails, hire_date: e.target.value })}
                          className="input flex-1"
                        />
                      ) : (
                        <span>
                          {employeeDetails?.hire_date
                            ? new Date(employeeDetails.hire_date).toLocaleDateString()
                            : t("notProvided")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <span>{t("department")}:</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={employeeDetails?.department || ""}
                          onChange={(e) => setEmployeeDetails({ ...employeeDetails, department: e.target.value })}
                          className="input flex-1"
                          placeholder={t("department")}
                        />
                      ) : (
                        <span>{employeeDetails?.department || t("notProvided")}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span>{t("salary")}:</span>
                      {isEditing ? (
                        <input
                          type="number"
                          value={employeeDetails?.salary || ""}
                          onChange={(e) =>
                            setEmployeeDetails({ ...employeeDetails, salary: Number.parseFloat(e.target.value) })
                          }
                          className="input flex-1"
                          placeholder={t("salary")}
                        />
                      ) : (
                        <span>{employeeDetails?.salary ? `$${employeeDetails.salary}` : t("notProvided")}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Star className="h-4 w-4 text-gray-400" />
                      <span>{t("performanceRating")}:</span>
                      {isEditing ? (
                        <select
                          value={employeeDetails?.performance_rating || ""}
                          onChange={(e) =>
                            setEmployeeDetails({
                              ...employeeDetails,
                              performance_rating: Number.parseInt(e.target.value),
                            })
                          }
                          className="input flex-1"
                        >
                          <option value="">{t("selectRating")}</option>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <option key={rating} value={rating}>
                              {rating} {t("stars")}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center">
                          {employeeDetails?.performance_rating
                            ? Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < employeeDetails.performance_rating
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))
                            : t("notRated")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t("emergencyContact")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t("contactName")}</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={employeeDetails?.emergency_contact_name || ""}
                        onChange={(e) =>
                          setEmployeeDetails({ ...employeeDetails, emergency_contact_name: e.target.value })
                        }
                        className="input"
                        placeholder={t("contactName")}
                      />
                    ) : (
                      <p>{employeeDetails?.emergency_contact_name || t("notProvided")}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t("contactPhone")}</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={employeeDetails?.emergency_contact_phone || ""}
                        onChange={(e) =>
                          setEmployeeDetails({ ...employeeDetails, emergency_contact_phone: e.target.value })
                        }
                        className="input"
                        placeholder={t("contactPhone")}
                      />
                    ) : (
                      <p>{employeeDetails?.emergency_contact_phone || t("notProvided")}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t("notes")}</h3>
                {isEditing ? (
                  <textarea
                    value={employeeDetails?.notes || ""}
                    onChange={(e) => setEmployeeDetails({ ...employeeDetails, notes: e.target.value })}
                    className="input h-24"
                    placeholder={t("additionalNotes")}
                  />
                ) : (
                  <p>{employeeDetails?.notes || t("noNotesAdded")}</p>
                )}
              </div>

              {isEditing && (
                <div className="flex justify-end gap-3">
                  <button onClick={() => setIsEditing(false)} className="btn btn-outline">
                    {t("cancel")}
                  </button>
                  <button onClick={() => saveEmployeeDetails(employeeDetails)} className="btn btn-primary">
                    <Save className="h-4 w-4 mr-2" />
                    {t("saveChanges")}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "goals" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {t("employeeGoals")}
                </h3>
                <button onClick={() => setShowAddGoal(true)} className="btn btn-primary flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  {t("addGoal")}
                </button>
              </div>

              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{goal.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{goal.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">
                            {t("progress")}: {goal.progress_percentage}%
                          </span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={goal.progress_percentage}
                            onChange={(e) => updateGoalProgress(goal.id, Number.parseInt(e.target.value))}
                            className="flex-1"
                          />
                        </div>
                        {goal.target_date && (
                          <p className="text-xs text-gray-500 mt-1">
                            {t("targetDate")}: {new Date(goal.target_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          goal.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : goal.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {t(goal.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Goal Modal */}
              <AnimatePresence>
                {showAddGoal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
                    >
                      <h3 className="text-lg font-semibold mb-4">{t("addNewGoal")}</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">{t("goalTitle")}</label>
                          <input
                            type="text"
                            value={newGoal.title}
                            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                            className="input"
                            placeholder={t("enterGoalTitle")}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">{t("description")}</label>
                          <textarea
                            value={newGoal.description}
                            onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                            className="input h-20"
                            placeholder={t("goalDescription")}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">{t("targetDate")}</label>
                          <input
                            type="date"
                            value={newGoal.targetDate}
                            onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                            className="input"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setShowAddGoal(false)} className="btn btn-outline">
                          {t("cancel")}
                        </button>
                        <button onClick={addGoal} className="btn btn-primary">
                          {t("addGoal")}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === "skills" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">{t("skillsAndCertifications")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skills.map((skill) => (
                  <div key={skill.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{skill.skills.name}</h4>
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < skill.proficiency_level ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{skill.skills.description}</p>
                    {skill.last_assessed && (
                      <p className="text-xs text-gray-500 mt-2">
                        {t("lastAssessed")}: {new Date(skill.last_assessed).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "wellness" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Heart className="h-5 w-5" />
                {t("wellnessTracking")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wellnessData.map((data) => (
                  <div key={data.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-sm font-medium">{new Date(data.date).toLocaleDateString()}</div>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs">{t("stressLevel")}</span>
                        <span className="text-xs">{data.stress_level}/5</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs">{t("energyLevel")}</span>
                        <span className="text-xs">{data.energy_level}/5</span>
                      </div>
                      {data.sleep_hours && (
                        <div className="flex justify-between">
                          <span className="text-xs">{t("sleepHours")}</span>
                          <span className="text-xs">{data.sleep_hours}h</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "achievements" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Award className="h-5 w-5" />
                {t("achievements")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{achievement.achievements.icon}</span>
                      <div>
                        <h4 className="font-medium">{achievement.achievements.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {achievement.achievements.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {t("earnedOn")}: {new Date(achievement.earned_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
