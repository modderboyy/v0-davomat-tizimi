"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Language = "uz" | "en" | "ru"

type Translations = {
  [key: string]: {
    uz: string
    en: string
    ru: string
  }
}

// Common translations used across the app
const translations: Translations = {
  appName: {
    uz: "Davomat Tizimi",
    en: "Attendance System",
    ru: "Система Посещаемости",
  },
  login: {
    uz: "Tizimga kirish",
    en: "Login",
    ru: "Вход в систему",
  },
  email: {
    uz: "Email",
    en: "Email",
    ru: "Эл. почта",
  },
  password: {
    uz: "Parol",
    en: "Password",
    ru: "Пароль",
  },
  signIn: {
    uz: "Kirish",
    en: "Sign In",
    ru: "Войти",
  },
  adminPanel: {
    uz: "Admin Panel",
    en: "Admin Panel",
    ru: "Панель Администратора",
  },
  attendance: {
    uz: "Davomat",
    en: "Attendance",
    ru: "Посещаемость",
  },
  attendanceReasons: {
    uz: "Davomat Sabablari",
    en: "Absence Reasons",
    ru: "Причины Отсутствия",
  },
  charts: {
    uz: "Diagramma",
    en: "Charts",
    ru: "Диаграммы",
  },
  employees: {
    uz: "Xodimlar",
    en: "Employees",
    ru: "Сотрудники",
  },
  blocked: {
    uz: "Bloklanganlar",
    en: "Blocked Users",
    ru: "Заблокированные",
  },
  company: {
    uz: "Kompaniya",
    en: "Company",
    ru: "Компания",
  },
  logout: {
    uz: "Chiqish",
    en: "Logout",
    ru: "Выход",
  },
  name: {
    uz: "Ism",
    en: "Name",
    ru: "Имя",
  },
  position: {
    uz: "Mansab",
    en: "Position",
    ru: "Должность",
  },
  addEmployee: {
    uz: "Xodim qo'shish",
    en: "Add Employee",
    ru: "Добавить сотрудника",
  },
  arrivalTime: {
    uz: "Kelish vaqti",
    en: "Arrival Time",
    ru: "Время прибытия",
  },
  departureTime: {
    uz: "Ketish vaqti",
    en: "Departure Time",
    ru: "Время ухода",
  },
  totalWorkTime: {
    uz: "Jami ishlagan vaqti",
    en: "Total Work Time",
    ru: "Общее рабочее время",
  },
  reason: {
    uz: "Sabab",
    en: "Reason",
    ru: "Причина",
  },
  downloadExcel: {
    uz: "Excel sifatida yuklab olish",
    en: "Download as Excel",
    ru: "Скачать как Excel",
  },
  save: {
    uz: "Saqlash",
    en: "Save",
    ru: "Сохранить",
  },
  update: {
    uz: "Yangilash",
    en: "Update",
    ru: "Обновить",
  },
  actions: {
    uz: "Amallar",
    en: "Actions",
    ru: "Действия",
  },
  unblock: {
    uz: "Blokdan chiqarish",
    en: "Unblock",
    ru: "Разблокировать",
  },
  scanQR: {
    uz: "QR kodni skanerlash",
    en: "Scan QR Code",
    ru: "Сканировать QR-код",
  },
  refresh: {
    uz: "Yangilash",
    en: "Refresh",
    ru: "Обновить",
  },
  barChart: {
    uz: "Bar Diagramma",
    en: "Bar Chart",
    ru: "Столбчатая Диаграмма",
  },
  pieChart: {
    uz: "Doira Diagramma",
    en: "Pie Chart",
    ru: "Круговая Диаграмма",
  },
  blockedAt: {
    uz: "Bloklangan vaqt",
    en: "Blocked At",
    ru: "Время блокировки",
  },
  attendanceSystem: {
    uz: "Davomat Tizimi Admin paneli",
    en: "Government Employees Attendance System",
    ru: "Система Учета Посещаемости Сотрудников",
  },
  scanQRDescription: {
    uz: "QR kodni skanerlash orqali xodimlar davomati tizimiga kirish mumkin.",
    en: "You can access the employee attendance system by scanning the QR code.",
    ru: "Вы можете получить доступ к системе учета посещаемости, отсканировав QR-код.",
  },
  companyName: {
    uz: "Kompaniya nomi",
    en: "Company Name",
    ru: "Название компании",
  },
  subscriptionPlan: {
    uz: "Obuna rejasi",
    en: "Subscription Plan",
    ru: "План подписки",
  },
  employeeLimit: {
    uz: "Xodimlar limiti",
    en: "Employee Limit",
    ru: "Лимит сотрудников",
  },
  usedEmployees: {
    uz: "Foydalanilgan",
    en: "Used",
    ru: "Использовано",
  },
  features: {
    uz: "Imkoniyatlar",
    en: "Features",
    ru: "Возможности",
  },
  basic: {
    uz: "Asosiy",
    en: "Basic",
    ru: "Базовый",
  },
  premium: {
    uz: "Premium",
    en: "Premium",
    ru: "Премиум",
  },
  bigplan: {
    uz: "Katta Reja",
    en: "Big Plan",
    ru: "Большой План",
  },
  gpsTracking: {
    uz: "GPS joylashuvni kuzatish",
    en: "GPS Location Tracking",
    ru: "Отслеживание GPS-местоположения",
  },
  basicReports: {
    uz: "Asosiy hisobotlar",
    en: "Basic Reports",
    ru: "Базовые отчеты",
  },
  excelExports: {
    uz: "Excel eksportlari",
    en: "Excel Exports",
    ru: "Экспорт в Excel",
  },
  advancedAntiSpoofing: {
    uz: "Kengaytirilgan anti-spoofing",
    en: "Advanced Anti-spoofing",
    ru: "Расширенная защита от подмены",
  },
  customPlan: {
    uz: "Admin bilan kelishilgan holda",
    en: "Custom agreement with admin",
    ru: "Индивидуальное соглашение с администратором",
  },
  upgradeSubscription: {
    uz: "Obunani yangilash",
    en: "Upgrade Subscription",
    ru: "Обновить подписку",
  },
  contactSupport: {
    uz: "Yordam uchun murojaat qiling",
    en: "Contact Support",
    ru: "Связаться с поддержкой",
  },
  submitting: {
    uz: "Jo'natilmoqda...",
    en: "Submitting...",
    ru: "Отправка...",
  },
  scanning: {
    uz: "Skanerlanmoqda...",
    en: "Scanning...",
    ru: "Сканирование...",
  },
  checkingWifi: {
    uz: "Wi-Fi tekshirilmoqda...",
    en: "Checking WiFi...",
    ru: "Проверка WiFi...",
  },
  connectedTo: {
    uz: "Ulangan",
    en: "Connected to",
    ru: "Подключено к",
  },
  locationRequired: {
    uz: "Joylashuv ma'lumotlari kerak",
    en: "Location data required",
    ru: "Требуются данные о местоположении",
  },
  subscriptionInactive: {
    uz: "Obuna faol emas",
    en: "Subscription Inactive",
    ru: "Подписка неактивна",
  },
  subscriptionInactiveMessage: {
    uz: "Sizning obunangiz faol emas. Tizimdan foydalanish uchun obunani yangilang.",
    en: "Your subscription is not active. Please renew your subscription to use the system.",
    ru: "Ваша подписка неактивна. Пожалуйста, обновите подписку для использования системы.",
  },
  renewSubscription: {
    uz: "Obunani yangilash",
    en: "Renew Subscription",
    ru: "Обновить подписку",
  },
  planLevel: {
    uz: "Tarif rejasi",
    en: "Plan Level",
    ru: "Уровень плана",
  },
  months: {
    uz: "oy",
    en: "months",
    ru: "месяцев",
  },
  notSet: {
    uz: "Belgilanmagan",
    en: "Not set",
    ru: "Не указано",
  },
  durationNotSetWarning: {
    uz: "Obuna muddati belgilanmagan",
    en: "Subscription duration not set",
    ru: "Срок подписки не указан",
  },
  noCompanyData: {
    uz: "Kompaniya ma'lumotlari topilmadi",
    en: "No company data found",
    ru: "Данные компании не найдены",
  },
  emailExistsInAnotherCompany: {
    uz: "Bu email boshqa kompaniyada mavjud",
    en: "This email exists in another company",
    ru: "Этот email существует в другой компании",
  },
  errorAddingEmployee: {
    uz: "Xodim qo'shishda xatolik yuz berdi",
    en: "Error adding employee",
    ru: "Ошибка при добавлении сотрудника",
  },
  employeeCount: {
    uz: "Xodimlar soni",
    en: "Employee Count",
    ru: "Количество сотрудников",
  },
  limitReached: {
    uz: "Limit to'ldi",
    en: "Limit Reached",
    ru: "Лимит достигнут",
  },
  employeeLimitReached: {
    uz: "Xodimlar limiti to'ldi. Yangi xodim qo'shish uchun obunani yangilang.",
    en: "Employee limit reached. Upgrade your subscription to add more employees.",
    ru: "Достигнут лимит сотрудников. Обновите подписку, чтобы добавить больше сотрудников.",
  },
  excessEmployeesRemoved: {
    uz: "Limit oshib ketgani uchun {count} ta xodim o'chirildi.",
    en: "{count} excess employees were removed due to limit restrictions.",
    ru: "{count} лишних сотрудников были удалены из-за ограничений лимита.",
  },
  errorFetchingData: {
    uz: "Ma'lumotlarni yuklashda xatolik yuz berdi",
    en: "Error fetching data",
    ru: "Ошибка при загрузке данных",
  },
  employeeAddedSuccessfully: {
    uz: "Xodim muvaffaqiyatli qo'shildi",
    en: "Employee added successfully",
    ru: "Сотрудник успешно добавлен",
  },
  employeeUpdatedSuccessfully: {
    uz: "Xodim ma'lumotlari muvaffaqiyatli yangilandi",
    en: "Employee details updated successfully",
    ru: "Данные сотрудника успешно обновлены",
  },
  help: {
    uz: "Yordam",
    en: "Help",
    ru: "Помощь",
  },
  passwordIsRequiredForNewEmployee: {
    uz: "Yangi xodim uchun parol kiritish shart",
    en: "Password is required for new employee",
    ru: "Для нового сотрудника требуется пароль",
  },
  userDataNotFoundAfterSignup: {
    uz: "Ro'yxatdan o'tgandan so'ng foydalanuvchi ma'lumotlari topilmadi",
    en: "User data not found after signup",
    ru: "Данные пользователя не найдены после регистрации",
  },
  errorUpdatingEmployeeDetailsAfterSignup: {
    uz: "Xodim ma'lumotlarini yangilashda xatolik yuz berdi",
    en: "Error updating employee details after signup",
    ru: "Ошибка при обновлении данных сотрудника после регистрации",
  },
  delete: {
    uz: "O'chirish",
    en: "Delete",
    ru: "Удалить",
  },
  cancel: {
    uz: "Bekor qilish",
    en: "Cancel",
    ru: "Отмена",
  },
  employeeDeletedSuccessfully: {
    uz: "Xodim muvaffaqiyatli o'chirildi",
    en: "Employee deleted successfully",
    ru: "Сотрудник успешно удален",
  },
  errorDeletingEmployee: {
    uz: "Xodimni o'chirishda xatolik yuz berdi",
    en: "Error deleting employee",
    ru: "Ошибка при удалении сотрудника",
  },
  deleteEmployeeWithRecordsConfirmation: {
    uz: "Bu xodimning davomat ma'lumotlari mavjud. Xodimni o'chirishni istaysizmi?",
    en: "This employee has attendance records. Do you want to delete the employee?",
    ru: "У этого сотрудника есть записи о посещаемости. Вы хотите удалить сотрудника?",
  },
  autoAddEmployees: {
    uz: "Avto xodim qo'shish",
    en: "Auto Add Employees",
    ru: "Автоматическое добавление сотрудников",
  },
  addEmployees: {
    uz: "Xodimlarni qo'shish",
    en: "Add Employees",
    ru: "Добавить сотрудников",
  },
  maxEmployeesToAdd: {
    uz: "Qo'shish mumkin bo'lgan maksimal xodimlar soni",
    en: "Maximum employees to add",
    ru: "Максимальное количество сотрудников для добавления",
  },
  autoEmployeeInfo: {
    uz: "Avto xodim qo'shish haqida ma'lumot",
    en: "Auto Employee Information",
    ru: "Информация об автоматическом добавлении сотрудников",
  },
  autoEmployeeNameFormat: {
    uz: "Xodim nomi: 'Xodim 1', 'Xodim 2', ...",
    en: "Employee name: 'Employee 1', 'Employee 2', ...",
    ru: "Имя сотрудника: 'Сотрудник 1', 'Сотрудник 2', ...",
  },
  autoEmployeeEmailFormat: {
    uz: "Email: '{company}1@modderboy.uz', '{company}2@modderboy.uz', ...",
    en: "Email: '{company}1@modderboy.uz', '{company}2@modderboy.uz', ...",
    ru: "Email: '{company}1@modderboy.uz', '{company}2@modderboy.uz', ...",
  },
  autoEmployeePasswordFormat: {
    uz: "Parol: Tasodifiy parol generatsiya qilinadi",
    en: "Password: A random password will be generated",
    ru: "Пароль: Будет сгенерирован случайный пароль",
  },
  invalidEmployeeCount: {
    uz: "Noto'g'ri xodimlar soni",
    en: "Invalid employee count",
    ru: "Неверное количество сотрудников",
  },
  employeeCountExceedsLimit: {
    uz: "Xodimlar soni limitdan oshib ketdi. Maksimal: {max}",
    en: "Employee count exceeds limit. Maximum: {max}",
    ru: "Количество сотрудников превышает лимит. Максимум: {max}",
  },
  employeesAddedSuccessfully: {
    uz: "{count} ta xodim muvaffaqiyatli qo'shildi",
    en: "{count} employees added successfully",
    ru: "{count} сотрудников успешно добавлено",
  },
  noEmployeesAdded: {
    uz: "Hech qanday xodim qo'shilmadi",
    en: "No employees were added",
    ru: "Сотрудники не были добавлены",
  },
  errorAddingEmployees: {
    uz: "Xodimlarni qo'shishda xatolik yuz berdi",
    en: "Error adding employees",
    ru: "Ошибка при добавлении сотрудников",
  },
  employee: {
    uz: "Xodim",
    en: "Employee",
    ru: "Сотрудник",
  },
  defaultPosition: {
    uz: "Oddiy xodim",
    en: "Regular Employee",
    ru: "Обычный сотрудник",
  },
  avatar: {
    uz: "Avatar",
    en: "Avatar",
    ru: "Аватар",
  },
  upload: {
    uz: "Yuklash",
    en: "Upload",
    ru: "Загрузить",
  },
  change: {
    uz: "O'zgartirish",
    en: "Change",
    ru: "Изменить",
  },
  avatarUpdatedSuccessfully: {
    uz: "Avatar muvaffaqiyatli yangilandi",
    en: "Avatar updated successfully",
    ru: "Аватар успешно обновлен",
  },
  errorUploadingAvatar: {
    uz: "Avatarni yuklashda xatolik yuz berdi",
    en: "Error uploading avatar",
    ru: "Ошибка при загрузке аватара",
  },
  avatarUpload: {
    uz: "Avatar yuklash",
    en: "Avatar Upload",
    ru: "Загрузка аватара",
  },
}

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("uz")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && ["uz", "en", "ru"].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("language", language)
  }, [language])

  const t = (key: string): string => {
    if (!translations[key]) {
      console.warn(`Translation key "${key}" not found`)
      return key
    }
    return translations[key][language]
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
