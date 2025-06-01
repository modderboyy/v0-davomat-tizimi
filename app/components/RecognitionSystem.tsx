"use client"

import type React from "react"

import { useState } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { useLanguage } from "../context/LanguageContext"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Award, Heart, Star, ThumbsUp, Trophy, Users } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Recognition {
  id: string
  from: {
    id: string
    name: string
    avatar?: string
  }
  to: {
    id: string
    name: string
    avatar?: string
  }
  type: "kudos" | "achievement" | "milestone" | "spotlight"
  message: string
  date: string
  likes: number
  badge?: string
}

interface Employee {
  id: string
  name: string
  avatar?: string
  department: string
}

const RecognitionSystem = () => {
  const { t } = useLanguage()
  const supabase = useSupabaseClient()
  const [recognitions, setRecognitions] = useState<Recognition[]>([])
  const [loading, setLoading] = useState(false)
  const [newRecognition, setNewRecognition] = useState({
    toEmployeeId: "",
    type: "kudos",
    message: "",
    badge: "",
  })

  // Sample employees data
  const employees: Employee[] = [
    { id: "1", name: "Alisher Navoi", department: "Engineering", avatar: "/placeholder.svg?height=40&width=40" },
    { id: "2", name: "Zulfiya", department: "Design", avatar: "/placeholder.svg?height=40&width=40" },
    { id: "3", name: "Bobur Mirzo", department: "Marketing", avatar: "/placeholder.svg?height=40&width=40" },
    { id: "4", name: "Nodira", department: "HR", avatar: "/placeholder.svg?height=40&width=40" },
    { id: "5", name: "Ulugbek", department: "Finance", avatar: "/placeholder.svg?height=40&width=40" },
  ]

  // Sample recognition types
  const recognitionTypes = [
    { value: "kudos", label: "kudos", icon: ThumbsUp },
    { value: "achievement", label: "achievement", icon: Trophy },
    { value: "milestone", label: "milestone", icon: Star },
    { value: "spotlight", label: "spotlight", icon: Award },
  ]

  // Sample badges
  const badges = [
    { value: "team_player", label: "team_player", icon: Users },
    { value: "innovator", label: "innovator", icon: Star },
    { value: "problem_solver", label: "problem_solver", icon: Trophy },
    { value: "customer_hero", label: "customer_hero", icon: Heart },
  ]

  // Sample recognitions data
  const sampleRecognitions: Recognition[] = [
    {
      id: "1",
      from: { id: "1", name: "Alisher Navoi", avatar: "/placeholder.svg?height=40&width=40" },
      to: { id: "2", name: "Zulfiya", avatar: "/placeholder.svg?height=40&width=40" },
      type: "kudos",
      message: "Thank you for helping me with the design project. Your insights were invaluable!",
      date: "2025-05-28",
      likes: 5,
      badge: "team_player",
    },
    {
      id: "2",
      from: { id: "3", name: "Bobur Mirzo", avatar: "/placeholder.svg?height=40&width=40" },
      to: { id: "5", name: "Ulugbek", avatar: "/placeholder.svg?height=40&width=40" },
      type: "achievement",
      message: "Congratulations on completing the financial report ahead of schedule!",
      date: "2025-05-26",
      likes: 8,
      badge: "problem_solver",
    },
    {
      id: "3",
      from: { id: "4", name: "Nodira", avatar: "/placeholder.svg?height=40&width=40" },
      to: { id: "1", name: "Alisher Navoi", avatar: "/placeholder.svg?height=40&width=40" },
      type: "milestone",
      message: "Congratulations on your 2-year work anniversary! Your contributions have been outstanding.",
      date: "2025-05-24",
      likes: 12,
    },
  ]

  // Load recognitions on component mount
  useState(() => {
    setRecognitions(sampleRecognitions)
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewRecognition({ ...newRecognition, [name]: value })
  }

  const handleSelectChange = (field: string, value: string) => {
    setNewRecognition({ ...newRecognition, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // In a real implementation, this would be a Supabase insert
      const currentUser = employees[0] // Assuming the first employee is the current user
      const toEmployee = employees.find((emp) => emp.id === newRecognition.toEmployeeId)

      if (!toEmployee) {
        throw new Error("Employee not found")
      }

      const recognition: Recognition = {
        id: (recognitions.length + 1).toString(),
        from: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
        },
        to: {
          id: toEmployee.id,
          name: toEmployee.name,
          avatar: toEmployee.avatar,
        },
        type: newRecognition.type as "kudos" | "achievement" | "milestone" | "spotlight",
        message: newRecognition.message,
        date: new Date().toISOString().split("T")[0],
        likes: 0,
        badge: newRecognition.badge || undefined,
      }

      setRecognitions([recognition, ...recognitions])
      setNewRecognition({
        toEmployeeId: "",
        type: "kudos",
        message: "",
        badge: "",
      })
      toast({
        title: t("recognition_sent"),
        description: t("recognition_sent_success"),
      })
    } catch (error) {
      console.error("Error sending recognition:", error)
      toast({
        title: t("error"),
        description: t("recognition_send_error"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLike = (id: string) => {
    setRecognitions(recognitions.map((rec) => (rec.id === id ? { ...rec, likes: rec.likes + 1 } : rec)))
  }

  const getRecognitionIcon = (type: string) => {
    switch (type) {
      case "kudos":
        return <ThumbsUp className="h-5 w-5" />
      case "achievement":
        return <Trophy className="h-5 w-5" />
      case "milestone":
        return <Star className="h-5 w-5" />
      case "spotlight":
        return <Award className="h-5 w-5" />
      default:
        return <ThumbsUp className="h-5 w-5" />
    }
  }

  const getBadgeIcon = (badge?: string) => {
    switch (badge) {
      case "team_player":
        return <Users className="h-3 w-3 mr-1" />
      case "innovator":
        return <Star className="h-3 w-3 mr-1" />
      case "problem_solver":
        return <Trophy className="h-3 w-3 mr-1" />
      case "customer_hero":
        return <Heart className="h-3 w-3 mr-1" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("recognition_system")}</h2>
        <p className="text-muted-foreground">{t("recognition_system_description")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("send_recognition")}</CardTitle>
            <CardDescription>{t("send_recognition_description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="toEmployeeId" className="text-sm font-medium">
                  {t("recognize_employee")}
                </label>
                <Select
                  value={newRecognition.toEmployeeId}
                  onValueChange={(value) => handleSelectChange("toEmployeeId", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_employee")} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={employee.avatar || "/placeholder.svg"} alt={employee.name} />
                            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {employee.name} - {t(employee.department)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">
                  {t("recognition_type")}
                </label>
                <Select
                  value={newRecognition.type}
                  onValueChange={(value) => handleSelectChange("type", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_type")} />
                  </SelectTrigger>
                  <SelectContent>
                    {recognitionTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            <Icon className="h-4 w-4 mr-2" />
                            {t(type.label)}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="badge" className="text-sm font-medium">
                  {t("badge")} ({t("optional")})
                </label>
                <Select value={newRecognition.badge} onValueChange={(value) => handleSelectChange("badge", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_badge")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("no_badge")}</SelectItem>
                    {badges.map((badge) => {
                      const Icon = badge.icon
                      return (
                        <SelectItem key={badge.value} value={badge.value}>
                          <div className="flex items-center">
                            <Icon className="h-4 w-4 mr-2" />
                            {t(badge.label)}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  {t("message")}
                </label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder={t("recognition_message_placeholder")}
                  value={newRecognition.message}
                  onChange={handleInputChange}
                  required
                  className="min-h-[100px]"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("sending") : t("send_recognition")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("recognition_wall")}</CardTitle>
              <CardDescription>{t("recognition_wall_description")}</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto space-y-4">
              {recognitions.map((recognition) => (
                <Card key={recognition.id} className="border shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={recognition.from.avatar || "/placeholder.svg"}
                            alt={recognition.from.name}
                          />
                          <AvatarFallback>{recognition.from.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{recognition.from.name}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            {t("recognized")}
                            <span className="font-medium mx-1">{recognition.to.name}</span>
                            <span className="mx-1">•</span>
                            {recognition.date}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="flex items-center">
                          {getRecognitionIcon(recognition.type)}
                          <span className="ml-1">{t(recognition.type)}</span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-sm">{recognition.message}</p>
                    {recognition.badge && recognition.badge !== "none" && (
                      <Badge variant="secondary" className="mt-2 flex items-center w-fit">
                        {getBadgeIcon(recognition.badge)}
                        {t(recognition.badge)}
                      </Badge>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs flex items-center"
                      onClick={() => handleLike(recognition.id)}
                    >
                      <Heart className="h-3.5 w-3.5 mr-1" />
                      {recognition.likes} {t("likes")}
                    </Button>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={recognition.to.avatar || "/placeholder.svg"} alt={recognition.to.name} />
                      <AvatarFallback>{recognition.to.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </CardFooter>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default RecognitionSystem
