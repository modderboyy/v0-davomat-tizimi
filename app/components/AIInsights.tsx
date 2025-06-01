"use client"

import { useState, useEffect } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { useLanguage } from "../context/LanguageContext"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import {
  AlertCircle,
  ArrowUpRight,
  Brain,
  Calendar,
  Clock,
  Download,
  LineChartIcon,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react"

interface InsightData {
  id: string
  title: string
  description: string
  type: "attendance" | "productivity" | "engagement" | "prediction"
  priority: "high" | "medium" | "low"
  date: string
}

interface AttendanceData {
  day: string
  present: number
  absent: number
  late: number
}

interface ProductivityData {
  department: string
  productivity: number
  target: number
}

interface EngagementData {
  month: string
  engagement: number
}

interface PredictionData {
  category: string
  value: number
  color: string
}

const AIInsights = () => {
  const { t } = useLanguage()
  const supabase = useSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<InsightData[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([])
  const [productivityData, setProductivityData] = useState<ProductivityData[]>([])
  const [engagementData, setEngagementData] = useState<EngagementData[]>([])
  const [predictionData, setPredictionData] = useState<PredictionData[]>([])
  const [timeframe, setTimeframe] = useState("week")
  const [department, setDepartment] = useState("all")

  // Sample insights data
  const sampleInsights: InsightData[] = [
    {
      id: "1",
      title: "attendance_pattern_detected",
      description: "attendance_pattern_description",
      type: "attendance",
      priority: "high",
      date: "2025-05-28",
    },
    {
      id: "2",
      title: "productivity_improvement",
      description: "productivity_improvement_description",
      type: "productivity",
      priority: "medium",
      date: "2025-05-27",
    },
    {
      id: "3",
      title: "engagement_decline",
      description: "engagement_decline_description",
      type: "engagement",
      priority: "high",
      date: "2025-05-26",
    },
    {
      id: "4",
      title: "staffing_prediction",
      description: "staffing_prediction_description",
      type: "prediction",
      priority: "medium",
      date: "2025-05-25",
    },
  ]

  // Sample attendance data
  const sampleAttendanceData: AttendanceData[] = [
    { day: "Mon", present: 45, absent: 3, late: 2 },
    { day: "Tue", present: 47, absent: 2, late: 1 },
    { day: "Wed", present: 44, absent: 4, late: 2 },
    { day: "Thu", present: 46, absent: 2, late: 2 },
    { day: "Fri", present: 43, absent: 5, late: 2 },
    { day: "Sat", present: 30, absent: 2, late: 1 },
    { day: "Sun", present: 15, absent: 1, late: 0 },
  ]

  // Sample productivity data
  const sampleProductivityData: ProductivityData[] = [
    { department: "Engineering", productivity: 87, target: 85 },
    { department: "Design", productivity: 92, target: 90 },
    { department: "Marketing", productivity: 78, target: 80 },
    { department: "Sales", productivity: 95, target: 90 },
    { department: "HR", productivity: 88, target: 85 },
    { department: "Finance", productivity: 91, target: 90 },
  ]

  // Sample engagement data
  const sampleEngagementData: EngagementData[] = [
    { month: "Jan", engagement: 75 },
    { month: "Feb", engagement: 78 },
    { month: "Mar", engagement: 82 },
    { month: "Apr", engagement: 79 },
    { month: "May", engagement: 85 },
    { month: "Jun", engagement: 87 },
  ]

  // Sample prediction data
  const samplePredictionData: PredictionData[] = [
    { category: "attendance_increase", value: 65, color: "#4ade80" },
    { category: "productivity_growth", value: 25, color: "#60a5fa" },
    { category: "turnover_risk", value: 10, color: "#f87171" },
  ]

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // In a real implementation, this would be Supabase queries
        setInsights(sampleInsights)
        setAttendanceData(sampleAttendanceData)
        setProductivityData(sampleProductivityData)
        setEngagementData(sampleEngagementData)
        setPredictionData(samplePredictionData)
      } catch (error) {
        console.error("Error loading AI insights data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const refreshData = () => {
    setLoading(true)
    // Simulate data refresh
    setTimeout(() => {
      setLoading(false)
    }, 1500)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "attendance":
        return <Users className="h-5 w-5" />
      case "productivity":
        return <TrendingUp className="h-5 w-5" />
      case "engagement":
        return <Sparkles className="h-5 w-5" />
      case "prediction":
        return <Brain className="h-5 w-5" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("ai_insights")}</h2>
          <p className="text-muted-foreground">{t("ai_insights_description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? t("refreshing") : t("refresh_data")}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            {t("export_report")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("key_insights")}</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.length}</div>
            <p className="text-xs text-muted-foreground">{t("new_insights_available")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("attendance_prediction")}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
              <span className="text-green-500 font-medium">+2.5%</span>
              <span className="ml-1">{t("from_last_week")}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("productivity_score")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <div className="mt-2">
              <Progress value={87} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="insights">{t("insights")}</TabsTrigger>
            <TabsTrigger value="analytics">{t("analytics")}</TabsTrigger>
            <TabsTrigger value="predictions">{t("predictions")}</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t("select_timeframe")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">{t("today")}</SelectItem>
                <SelectItem value="week">{t("this_week")}</SelectItem>
                <SelectItem value="month">{t("this_month")}</SelectItem>
                <SelectItem value="quarter">{t("this_quarter")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t("select_department")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_departments")}</SelectItem>
                <SelectItem value="engineering">{t("engineering")}</SelectItem>
                <SelectItem value="design">{t("design")}</SelectItem>
                <SelectItem value="marketing">{t("marketing")}</SelectItem>
                <SelectItem value="sales">{t("sales")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="insights" className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight) => (
                <Card key={insight.id}>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-primary/10">{getInsightIcon(insight.type)}</div>
                        <CardTitle className="text-lg">{t(insight.title)}</CardTitle>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPriorityColor(insight.priority)}`}
                      >
                        {t(insight.priority)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-sm text-muted-foreground">{t(insight.description)}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">{insight.date}</span>
                      <Button variant="ghost" size="sm" className="text-xs">
                        {t("view_details")}
                        <ArrowUpRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("attendance_analytics")}</CardTitle>
                <CardDescription>{t("attendance_analytics_description")}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6">
                    <Skeleton className="h-[200px] w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={attendanceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="present" fill="#4ade80" name={t("present")} />
                      <Bar dataKey="absent" fill="#f87171" name={t("absent")} />
                      <Bar dataKey="late" fill="#facc15" name={t("late")} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("productivity_by_department")}</CardTitle>
                <CardDescription>{t("productivity_by_department_description")}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6">
                    <Skeleton className="h-[200px] w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={productivityData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="department" type="category" width={100} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="productivity" fill="#60a5fa" name={t("productivity")} />
                      <Bar dataKey="target" fill="#a78bfa" name={t("target")} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{t("engagement_trends")}</CardTitle>
                <CardDescription>{t("engagement_trends_description")}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6">
                    <Skeleton className="h-[200px] w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={engagementData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <RechartsTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="engagement"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name={t("engagement_score")}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("future_trends")}</CardTitle>
                <CardDescription>{t("future_trends_description")}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6">
                    <Skeleton className="h-[200px] w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={predictionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${t(name)} ${(percent * 100).toFixed(0)}%`}
                      >
                        {predictionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("ai_recommendations")}</CardTitle>
                <CardDescription>{t("ai_recommendations_description")}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <Sparkles className="h-4 w-4" />
                      <AlertTitle>{t("optimize_scheduling")}</AlertTitle>
                      <AlertDescription>{t("optimize_scheduling_description")}</AlertDescription>
                    </Alert>
                    <Alert>
                      <Brain className="h-4 w-4" />
                      <AlertTitle>{t("engagement_improvement")}</AlertTitle>
                      <AlertDescription>{t("engagement_improvement_description")}</AlertDescription>
                    </Alert>
                    <Alert>
                      <LineChartIcon className="h-4 w-4" />
                      <AlertTitle>{t("productivity_boost")}</AlertTitle>
                      <AlertDescription>{t("productivity_boost_description")}</AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button className="w-full">{t("apply_recommendations")}</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AIInsights
