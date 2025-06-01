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
  dashboard: {
    uz: "Boshqaruv paneli",
    en: "Dashboard",
    ru: "Панель управления",
  },
  totalEmployees: {
    uz: "Jami xodimlar",
    en: "Total Employees",
    ru: "Всего сотрудников",
  },
  presentToday: {
    uz: "Bugun kelganlar",
    en: "Present Today",
    ru: "Присутствуют сегодня",
  },
  lateToday: {
    uz: "Bugun kechikkanlar",
    en: "Late Today",
    ru: "Опоздали сегодня",
  },
  absentToday: {
    uz: "Bugun kelmaganlar",
    en: "Absent Today",
    ru: "Отсутствуют сегодня",
  },
  averageWorkHours: {
    uz: "O'rtacha ish soatlari",
    en: "Average Work Hours",
    ru: "Среднее рабочее время",
  },
  hours: {
    uz: "soat",
    en: "hours",
    ru: "часов",
  },
  attendanceOverview: {
    uz: "Davomat umumiy ko'rinishi",
    en: "Attendance Overview",
    ru: "Обзор посещаемости",
  },
  attendanceTrend: {
    uz: "Davomat tendensiyasi",
    en: "Attendance Trend",
    ru: "Тенденция посещаемости",
  },
  todayAttendance: {
    uz: "Bugungi davomat",
    en: "Today's Attendance",
    ru: "Посещаемость сегодня",
  },
  commonPassword: {
    uz: "Umumiy parol",
    en: "Common Password",
    ru: "Общий пароль",
  },
  passwordWarning: {
    uz: "Parol haqida ogohlantirish",
    en: "Password Warning",
    ru: "Предупреждение о пароле",
  },
  passwordWarningMessage: {
    uz: "Iltimos, ushbu parolni eslab qoling yoki saqlang. Bu barcha yangi yaratilgan xodimlar uchun ishlatiladi va keyinchalik ko'rsatilmaydi.",
    en: "Please remember or save this password. It will be used for all newly created employees and will not be shown again.",
    ru: "Пожалуйста, запомните или сохраните этот пароль. Он будет использоваться для всех вновь созданных сотрудников и больше не будет показан.",
  },
  commonPasswordUsed: {
    uz: "Barcha xodimlar uchun bir xil parol ishlatiladi",
    en: "Same password is used for all employees",
    ru: "Для всех сотрудников используется один и тот же пароль",
  },
  passwordTooShort: {
    uz: "Parol juda qisqa. Kamida 6 ta belgi bo'lishi kerak.",
    en: "Password is too short. It must be at least 6 characters.",
    ru: "Пароль слишком короткий. Он должен содержать не менее 6 символов.",
  },
  welcomeMessage: {
    uz: "Davomat tizimiga xush kelibsiz!",
    en: "Welcome to the Attendance System!",
    ru: "Добро пожаловать в систему учета посещаемости!",
  },
  renewSubscriptionTitle: {
    uz: "Obunani yangilash",
    en: "Renew Subscription",
    ru: "Обновить подписку",
  },
  renewSubscriptionMessage: {
    uz: "Obunangizni yangilash uchun Davomat ilovasini ochib, 'Obunani yangilash' tugmasini bosing. Ilova o'rnatilmagan bo'lsa, quyidagi tugma orqali yuklab oling.",
    en: "To renew your subscription, open the Attendance application and click the 'Renew Subscription' button. If the application is not installed, download it using the button below.",
    ru: "Чтобы обновить подписку, откройте приложение Учета посещаемости и нажмите кнопку 'Обновить подписку'. Если приложение не установлено, загрузите его, используя кнопку ниже.",
  },
  downloadAppButton: {
    uz: "Ilovani yuklab olish",
    en: "Download Application",
    ru: "Скачать приложение",
  },
  companyInfo: {
    uz: "Kompaniya ma'lumotlari",
    en: "Company Information",
    ru: "Информация о компании",
  },
  location: {
    uz: "Joylashuv",
    en: "Location",
    ru: "Местоположение",
  },
  locationImportanceMessage: {
    uz: "Joylashuv ma'lumotlari xodimlarning ish joyida ekanligini tekshirish uchun muhimdir. Iltimos, kompaniyangizning aniq joylashuvini kiriting.",
    en: "Location data is crucial for verifying that employees are at their workplace. Please enter the exact location of your company.",
    ru: "Данные о местоположении необходимы для проверки нахождения сотрудников на рабочем месте. Пожалуйста, укажите точное местоположение вашей компании.",
  },
  latitude: {
    uz: "Kenglik",
    en: "Latitude",
    ru: "Широта",
  },
  longitude: {
    uz: "Uzunlik",
    en: "Longitude",
    ru: "Долгота",
  },
  workingRadius: {
    uz: "Ish radiusi",
    en: "Working Radius",
    ru: "Рабочий радиус",
  },
  meters: {
    uz: "metr",
    en: "meters",
    ru: "метров",
  },
  editLocation: {
    uz: "Joylashuvni tahrirlash",
    en: "Edit Location",
    ru: "Редактировать местоположение",
  },
  setLocation: {
    uz: "Joylashuvni belgilash",
    en: "Set Location",
    ru: "Установить местоположение",
  },
  locationGuide: {
    uz: "Joylashuv bo'yicha qo'llanma",
    en: "Location Guide",
    ru: "Руководство по местоположению",
  },
  noLocationSet: {
    uz: "Joylashuv belgilanmagan",
    en: "No location set",
    ru: "Местоположение не установлено",
  },
  locationGuideImportance: {
    uz: "Aniq joylashuv ma'lumotlari xodimlarning ish joyida ekanligini tekshirish uchun muhimdir. Bu qo'llanma sizga Google Maps orqali koordinatalarni olishni ko'rsatadi.",
    en: "Accurate location data is essential for verifying employee presence at the workplace. This guide will show you how to obtain coordinates using Google Maps.",
    ru: "Точные данные о местоположении необходимы для проверки присутствия сотрудников на рабочем месте. Это руководство покажет вам, как получить координаты с помощью Google Maps.",
  },
  howToGetCoordinates: {
    uz: "Google Maps orqali koordinatalarni olish",
    en: "How to Get Coordinates from Google Maps",
    ru: "Как получить координаты из Google Maps",
  },
  locationGuideStep1: {
    uz: "Google Maps veb-saytini oching (maps.google.com) yoki Google Maps ilovasini ishga tushiring.",
    en: "Open the Google Maps website (maps.google.com) or launch the Google Maps app.",
    ru: "Откройте веб-сайт Google Maps (maps.google.com) или запустите приложение Google Maps.",
  },
  locationGuideStep2: {
    uz: "Kompaniyangiz joylashgan joyni qidiring yoki xaritada toping.",
    en: "Search for your company's location or find it on the map.",
    ru: "Найдите местоположение вашей компании или найдите его на карте.",
  },
  locationGuideStep3: {
    uz: "Veb-saytda: Aniq nuqtani belgilash uchun xaritada o'ng tugmani bosing va 'Bu yerda nima?' ni tanlang. Ilovada: Kerakli joyni bosib turing.",
    en: "On the website: Right-click on the exact point on the map and select 'What's here?'. In the app: Press and hold on the desired location.",
    ru: "На веб-сайте: Щелкните правой кнопкой мыши на точное место на карте и выберите 'Что здесь?'. В приложении: Нажмите и удерживайте нужное место.",
  },
  locationGuideStep4: {
    uz: "Pastki qismda yoki ma'lumot kartasida koordinatalar ko'rsatiladi (masalan, 41.2995, 69.2401).",
    en: "The coordinates will be displayed at the bottom or in the info card (e.g., 41.2995, 69.2401).",
    ru: "Координаты будут отображаться внизу или в информационной карточке (например, 41.2995, 69.2401).",
  },
  locationGuideStep5: {
    uz: "Bu raqamlarni nusxalang va tegishli maydonlarga kiriting.",
    en: "Copy these numbers and enter them in the appropriate fields.",
    ru: "Скопируйте эти числа и введите их в соответствующие поля.",
  },
  aboutWorkingRadius: {
    uz: "Ish radiusi haqida",
    en: "About Working Radius",
    ru: "О рабочем радиусе",
  },
  workingRadiusExplanation: {
    uz: "Ish radiusi - bu xodimlar davomat qayd etishi mumkin bo'lgan markaziy nuqta atrofidagi masofa (metrda). Kichikroq radius (masalan, 50-100 metr) aniqroq joylashuvni ta'minlaydi, kattaroq radius (200+ metr) esa kattaroq maydonni qamrab oladi. Kompaniyangiz binosi hajmiga qarab mos radiusni tanlang.",
    en: "The working radius is the distance (in meters) around the central point where employees can register attendance. A smaller radius (e.g., 50-100 meters) ensures more precise location, while a larger radius (200+ meters) covers a wider area. Choose a radius appropriate to your company building size.",
    ru: "Рабочий радиус - это расстояние (в метрах) вокруг центральной точки, где сотрудники могут регистрировать посещаемость. Меньший радиус (например, 50-100 метров) обеспечивает более точное местоположение, а больший радиус (200+ метров) охватывает более широкую область. Выберите радиус, соответствующий размеру здания вашей компании.",
  },
  distanceDescription: {
    uz: "Xodimlar ish joyida ekanligini tekshirish uchun ishlatiladigan radius (metrda).",
    en: "The radius (in meters) used to verify that employees are at the workplace.",
    ru: "Радиус (в метрах), используемый для проверки нахождения сотрудников на рабочем месте.",
  },
  invalidCoordinates: {
    uz: "Noto'g'ri koordinatalar. Iltimos, to'g'ri raqamlarni kiriting.",
    en: "Invalid coordinates. Please enter valid numbers.",
    ru: "Неверные координаты. Пожалуйста, введите правильные числа.",
  },
  invalidDistance: {
    uz: "Noto'g'ri radius. Iltimos, musbat raqam kiriting.",
    en: "Invalid radius. Please enter a positive number.",
    ru: "Неверный радиус. Пожалуйста, введите положительное число.",
  },
  locationSavedSuccessfully: {
    uz: "Joylashuv muvaffaqiyatli saqlandi",
    en: "Location saved successfully",
    ru: "Местоположение успешно сохранено",
  },
  errorSavingLocation: {
    uz: "Joylashuvni saqlashda xatolik yuz berdi",
    en: "Error saving location",
    ru: "Ошибка при сохранении местоположения",
  },
  understood: {
    uz: "Tushundim",
    en: "Understood",
    ru: "Понятно",
  },
  close: {
    uz: "Yopish",
    en: "Close",
    ru: "Закрыть",
  },
  setupYourCompany: {
    uz: "Kompaniyangizni sozlang",
    en: "Set Up Your Company",
    ru: "Настройте вашу компанию",
  },
  setupDescription: {
    uz: "Kompaniyangizni sozlash uchun quyidagi qadamlarni bajaring",
    en: "Follow these steps to set up your company",
    ru: "Выполните следующие шаги для настройки вашей компании",
  },
  appearance: {
    uz: "Ko'rinish",
    en: "Appearance",
    ru: "Внешний вид",
  },
  finish: {
    uz: "Yakunlash",
    en: "Finish",
    ru: "Завершить",
  },
  companyNameDescription: {
    uz: "Kompaniyangiz nomini kiriting. Bu nom tizimda ko'rsatiladi.",
    en: "Enter your company name. This name will be displayed in the system.",
    ru: "Введите название вашей компании. Это название будет отображаться в системе.",
  },
  enterCompanyName: {
    uz: "Kompaniya nomini kiriting",
    en: "Enter company name",
    ru: "Введите название компании",
  },
  appearanceDescription: {
    uz: "Tizimning ko'rinishini sozlang",
    en: "Customize the appearance of the system",
    ru: "Настройте внешний вид системы",
  },
  theme: {
    uz: "Mavzu",
    en: "Theme",
    ru: "Тема",
  },
  toggleTheme: {
    uz: "Mavzuni almashtirish",
    en: "Toggle theme",
    ru: "Переключить тему",
  },
  selectLanguage: {
    uz: "Tilni tanlang",
    en: "Select language",
    ru: "Выберите язык",
  },
  locationImportanceWarning: {
    uz: "Diqqat! Joylashuv ma'lumotlari xodimlarning ish joyida ekanligini tekshirish uchun muhimdir. Noto'g'ri ma'lumotlar kiritilsa, xodimlar davomat qayd eta olmasligi mumkin.",
    en: "Attention! Location data is crucial for verifying that employees are at their workplace. If incorrect data is entered, employees may not be able to register attendance.",
    ru: "Внимание! Данные о местоположении необходимы для проверки нахождения сотрудников на рабочем месте. Если введены неверные данные, сотрудники могут не иметь возможности зарегистрировать посещаемость.",
  },
  locationSetupDescription: {
    uz: "Kompaniyangizning aniq joylashuvini kiriting. Bu ma'lumotlar xodimlarning ish joyida ekanligini tekshirish uchun ishlatiladi.",
    en: "Enter the exact location of your company. This data will be used to verify that employees are at their workplace.",
    ru: "Введите точное местоположение вашей компании. Эти данные будут использоваться для проверки нахождения сотрудников на рабочем месте.",
  },
  finishSetup: {
    uz: "Sozlashni yakunlash",
    en: "Finish Setup",
    ru: "Завершить настройку",
  },
  finishSetupDescription: {
    uz: "Kompaniyangiz sozlash jarayoni yakunlandi. Quyidagi ma'lumotlarni tekshiring va tasdiqlang.",
    en: "Your company setup process is complete. Please review and confirm the following information.",
    ru: "Процесс настройки вашей компании завершен. Пожалуйста, проверьте и подтвердите следующую информацию.",
  },
  setupSummary: {
    uz: "Sozlash xulosasi",
    en: "Setup Summary",
    ru: "Сводка настройки",
  },
  previous: {
    uz: "Oldingi",
    en: "Previous",
    ru: "Предыдущий",
  },
  next: {
    uz: "Keyingi",
    en: "Next",
    ru: "Следующий",
  },
  saving: {
    uz: "Saqlanmoqda...",
    en: "Saving...",
    ru: "Сохранение...",
  },
  completeSetup: {
    uz: "Sozlashni yakunlash",
    en: "Complete Setup",
    ru: "Завершить настройку",
  },
  setupCompleted: {
    uz: "Kompaniya sozlash muvaffaqiyatli yakunlandi",
    en: "Company setup completed successfully",
    ru: "Настройка компании успешно завершена",
  },
  errorCompletingSetup: {
    uz: "Sozlashni yakunlashda xatolik yuz berdi",
    en: "Error completing setup",
    ru: "Ошибка при завершении настройки",
  },
  companyNameRequired: {
    uz: "Kompaniya nomi kiritilishi shart",
    en: "Company name is required",
    ru: "Требуется название компании",
  },
  locationDataRequired: {
    uz: "Joylashuv ma'lumotlari kiritilishi shart",
    en: "Location data is required",
    ru: "Требуются данные о местоположении",
  },
  errorFetchingCompanyData: {
    uz: "Kompaniya ma'lumotlarini yuklashda xatolik yuz berdi",
    en: "Error fetching company data",
    ru: "Ошибка при загрузке данных компании",
  },
  light: {
    uz: "Yorug'",
    en: "Light",
    ru: "Светлая",
  },
  dark: {
    uz: "Qorong'i",
    en: "Dark",
    ru: "Темная",
  },
  uz: {
    uz: "O'zbekcha",
    en: "Uzbek",
    ru: "Узбекский",
  },
  en: {
    uz: "Inglizcha",
    en: "English",
    ru: "Английский",
  },
  ru: {
    uz: "Ruscha",
    en: "Russian",
    ru: "Русский",
  },
  subscriptionDuration: {
    uz: "Obuna muddati",
    en: "Subscription Duration",
    ru: "Срок подписки",
  },
  avatarUpload: {
    uz: "Avatar yuklash",
    en: "Avatar Upload",
    ru: "Загрузка аватара",
  },
  scanQR: {
    uz: "QR kodni skanerlang",
    en: "Scan QR Code",
    ru: "Сканировать QR-код",
  },
  scanQRDescription: {
    uz: "Davomat qayd etish uchun QR kodni skanerlang",
    en: "Scan the QR code to register attendance",
    ru: "Отсканируйте QR-код для регистрации посещаемости",
  },
  scanning: {
    uz: "Skanerlanmoqda...",
    en: "Scanning...",
    ru: "Сканирование...",
  },
  connectedTo: {
    uz: "Ulangan tarmoq",
    en: "Connected to",
    ru: "Подключено к",
  },
  checkingWifi: {
    uz: "Wi-Fi tekshirilmoqda...",
    en: "Checking WiFi...",
    ru: "Проверка WiFi...",
  },
  locationRequired: {
    uz: "Joylashuv ma'lumotlari talab qilinadi",
    en: "Location data is required",
    ru: "Требуются данные о местоположении",
  },
  downloadLinkNotAvailableMessage: {
    uz: "Yuklab olish havolasi mavjud emas. Iltimos, yordam uchun murojaat qiling.",
    en: "Download link is not available. Please contact support for assistance.",
    ru: "Ссылка для скачивания недоступна. Пожалуйста, обратитесь в службу поддержки за помощью.",
  },
  companyLocation: {
    uz: "Kompaniya joylashuvi",
    en: "Company Location",
    ru: "Местоположение компании",
  },
  qrCodes: {
    uz: "QR Kodlar",
    en: "QR Codes",
    ru: "QR Коды",
  },
  arrivalQRCode: {
    uz: "Kelish QR Kodi",
    en: "Arrival QR Code",
    ru: "QR-код прибытия",
  },
  departureQRCode: {
    uz: "Ketish QR Kodi",
    en: "Departure QR Code",
    ru: "QR-код ухода",
  },
  downloadQRCode: {
    uz: "QR kodni yuklab olish",
    en: "Download QR Code",
    ru: "Скачать QR-код",
  },
  loadingQRCodes: {
    uz: "QR kodlar yuklanmoqda...",
    en: "Loading QR codes...",
    ru: "Загрузка QR-кодов...",
  },
  errorLoadingQRCodes: {
    uz: "QR kodlarni yuklashda xatolik yuz berdi",
    en: "Error loading QR codes",
    ru: "Ошибка при загрузке QR-кодов",
  },
  noQRCodesFound: {
    uz: "QR kodlar topilmadi",
    en: "No QR codes found",
    ru: "QR-коды не найдены",
  },
  printQRCode: {
    uz: "QR kodni chop etish",
    en: "Print QR Code",
    ru: "Распечатать QR-код",
  },
  balance: {
    uz: "Balans",
    en: "Balance",
    ru: "Баланс",
  },
  transactions: {
    uz: "Tranzaksiyalar",
    en: "Transactions",
    ru: "Транзакции",
  },
  topUpBalance: {
    uz: "Balansni to'ldirish",
    en: "Top Up Balance",
    ru: "Пополнить баланс",
  },
  amount: {
    uz: "Miqdor",
    en: "Amount",
    ru: "Сумма",
  },
  description: {
    uz: "Tavsif",
    en: "Description",
    ru: "Описание",
  },
  paymentMethod: {
    uz: "To'lov usuli",
    en: "Payment Method",
    ru: "Способ оплаты",
  },
  status: {
    uz: "Holat",
    en: "Status",
    ru: "Статус",
  },
  date: {
    uz: "Sana",
    en: "Date",
    ru: "Дата",
  },
  completed: {
    uz: "Bajarildi",
    en: "Completed",
    ru: "Завершено",
  },
  pending: {
    uz: "Kutilmoqda",
    en: "Pending",
    ru: "Ожидание",
  },
  failed: {
    uz: "Muvaffaqiyatsiz",
    en: "Failed",
    ru: "Неудачно",
  },
  noTransactions: {
    uz: "Tranzaksiyalar topilmadi",
    en: "No transactions found",
    ru: "Транзакции не найдены",
  },
  loadingTransactions: {
    uz: "Tranzaksiyalar yuklanmoqda...",
    en: "Loading transactions...",
    ru: "Загрузка транзакций...",
  },
  errorLoadingTransactions: {
    uz: "Tranzaksiyalarni yuklashda xatolik",
    en: "Error loading transactions",
    ru: "Ошибка загрузки транзакций",
  },
  subscriptionExpiresOn: {
    uz: "Obuna tugash sanasi",
    en: "Subscription expires on",
    ru: "Подписка истекает",
  },
  subscriptionExpired: {
    uz: "Obuna muddati tugagan",
    en: "Subscription expired",
    ru: "Подписка истекла",
  },
  freeEmployees: {
    uz: "Bepul xodimlar",
    en: "Free employees",
    ru: "Бесплатные сотрудники",
  },
  additionalEmployees: {
    uz: "Qo'shimcha xodimlar",
    en: "Additional employees",
    ru: "Дополнительные сотрудники",
  },
  perEmployee: {
    uz: "har bir xodim uchun",
    en: "per employee",
    ru: "за сотрудника",
  },
  insufficientBalance: {
    uz: "Balans yetarli emas",
    en: "Insufficient balance",
    ru: "Недостаточно средств",
  },
  employeesDisabled: {
    uz: "Xodimlar vaqtinchalik o'chirilgan",
    en: "Employees temporarily disabled",
    ru: "Сотрудники временно отключены",
  },
  balanceInfo: {
    uz: "Balans ma'lumotlari",
    en: "Balance Information",
    ru: "Информация о балансе",
  },
  currentBalance: {
    uz: "Joriy balans",
    en: "Current Balance",
    ru: "Текущий баланс",
  },
  daysLeft: {
    uz: "kun qoldi",
    en: "days left",
    ru: "дней осталось",
  },
  companyNotFound: {
    uz: "Kompaniya topilmadi",
    en: "Company not found",
    ru: "Компания не найдена",
  },
  noCompanyIdProvided: {
    uz: "Kompaniya ID berilmagan",
    en: "No company ID provided",
    ru: "ID компании не предоставлен",
  },
  // New translations for enhanced features
  attendanceManagement: {
    uz: "Davomat boshqaruvi",
    en: "Attendance Management",
    ru: "Управление посещаемостью",
  },
  employeeManagement: {
    uz: "Xodimlar boshqaruvi",
    en: "Employee Management",
    ru: "Управление сотрудниками",
  },
  companySettings: {
    uz: "Kompaniya sozlamalari",
    en: "Company Settings",
    ru: "Настройки компании",
  },
  analytics: {
    uz: "Tahlillar",
    en: "Analytics",
    ru: "Аналитика",
  },
  archivedEmployees: {
    uz: "Arxivlangan xodimlar",
    en: "Archived Employees",
    ru: "Архивированные сотрудники",
  },
  searchEmployees: {
    uz: "Xodimlarni qidirish",
    en: "Search employees",
    ru: "Поиск сотрудников",
  },
  allEmployees: {
    uz: "Barcha xodimlar",
    en: "All Employees",
    ru: "Все сотрудники",
  },
  activeEmployees: {
    uz: "Faol xodimlar",
    en: "Active Employees",
    ru: "Активные сотрудники",
  },
  employeesSelected: {
    uz: "xodim tanlandi",
    en: "employees selected",
    ru: "сотрудников выбрано",
  },
  archive: {
    uz: "Arxivlash",
    en: "Archive",
    ru: "Архивировать",
  },
  unarchive: {
    uz: "Arxivdan chiqarish",
    en: "Unarchive",
    ru: "Разархивировать",
  },
  archived: {
    uz: "Arxivlangan",
    en: "Archived",
    ru: "Архивирован",
  },
  active: {
    uz: "Faol",
    en: "Active",
    ru: "Активный",
  },
  dateAdded: {
    uz: "Qo'shilgan sana",
    en: "Date Added",
    ru: "Дата добавления",
  },
  used: {
    uz: "ishlatilgan",
    en: "used",
    ru: "использовано",
  },
  confirmBulkDelete: {
    uz: "{count} ta xodimni o'chirishni tasdiqlaysizmi?",
    en: "Are you sure you want to delete {count} employees?",
    ru: "Вы уверены, что хотите удалить {count} сотрудников?",
  },
  employeesArchivedSuccessfully: {
    uz: "{count} ta xodim muvaffaqiyatli arxivlandi",
    en: "{count} employees archived successfully",
    ru: "{count} сотрудников успешно архивировано",
  },
  employeesUnarchivedSuccessfully: {
    uz: "{count} ta xodim muvaffaqiyatli arxivdan chiqarildi",
    en: "{count} employees unarchived successfully",
    ru: "{count} сотрудников успешно разархивировано",
  },
  employeesDeletedSuccessfully: {
    uz: "{count} ta xodim muvaffaqiyatli o'chirildi",
    en: "{count} employees deleted successfully",
    ru: "{count} сотрудников успешно удалено",
  },
  errorArchivingEmployees: {
    uz: "Xodimlarni arxivlashda xatolik",
    en: "Error archiving employees",
    ru: "Ошибка архивирования сотрудников",
  },
  errorUnarchivingEmployees: {
    uz: "Xodimlarni arxivdan chiqarishda xatolik",
    en: "Error unarchiving employees",
    ru: "Ошибка разархивирования сотрудников",
  },
  errorDeletingEmployees: {
    uz: "Xodimlarni o'chirishda xatolik",
    en: "Error deleting employees",
    ru: "Ошибка удаления сотрудников",
  },
  errorFetchingEmployees: {
    uz: "Xodimlarni yuklashda xatolik",
    en: "Error fetching employees",
    ru: "Ошибка загрузки сотрудников",
  },
  errorUpdatingEmployee: {
    uz: "Xodim ma'lumotlarini yangilashda xatolik",
    en: "Error updating employee",
    ru: "Ошибка обновления сотрудника",
  },
  employeeArchived: {
    uz: "Xodim arxivlandi",
    en: "Employee archived",
    ru: "Сотрудник архивирован",
  },
  employeeUnarchived: {
    uz: "Xodim arxivdan chiqarildi",
    en: "Employee unarchived",
    ru: "Сотрудник разархивирован",
  },
  noEmployeesFound: {
    uz: "Xodimlar topilmadi",
    en: "No employees found",
    ru: "Сотрудники не найдены",
  },
  noEmployeesYet: {
    uz: "Hali xodimlar yo'q",
    en: "No employees yet",
    ru: "Пока нет сотрудников",
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
    document.documentElement.setAttribute("lang", language)
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
