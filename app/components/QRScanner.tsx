"use client"

import { useState, useEffect, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { RefreshCw, QrCode, MapPin, Wifi } from "lucide-react"
import { useLanguage } from "../context/LanguageContext"
import { ThemeToggle } from "./ThemeToggle"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { useDynamicIsland } from "./DynamicIsland"
import { motion } from "framer-motion"

export default function QRScanner({ user, companyId }) {
  const [scannedData, setScannedData] = useState("")
  const [message, setMessage] = useState("")
  const [isContainerReady, setIsContainerReady] = useState(false)
  const [wifiInfo, setWifiInfo] = useState(null)
  const [scanning, setScanning] = useState(false)
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const html5QrcodeRef = useRef(null)
  const { t } = useLanguage()
  const { showNotification } = useDynamicIsland()

  const initializeQrCodeReader = async () => {
    if (isContainerReady) {
      try {
        if (html5QrcodeRef.current) {
          await html5QrcodeRef.current.stop()
        }

        const { Html5Qrcode } = await import("html5-qrcode")
        const html5QrCode = new Html5Qrcode("qr-scanner-container")
        html5QrcodeRef.current = html5QrCode

        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
          handleScanLogic(decodedText)
        }

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        }

        setScanning(true)
        await html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
      } catch (error) {
        console.error("Error initializing QR code reader:", error)
        setMessage("QR kod skanerini ishga tushirishda xatolik yuz berdi.")
        showNotification("error", "QR kod skanerini ishga tushirishda xatolik yuz berdi.")
        setScanning(false)
      }
    }
  }

  useEffect(() => {
    setIsContainerReady(true)
    return () => {
      if (html5QrcodeRef.current) {
        html5QrcodeRef.current.stop()
        setScanning(false)
      }
    }
  }, [])

  useEffect(() => {
    initializeQrCodeReader()
  }, [isContainerReady])

  // WiFi MAC address checking
  const checkWifiConnection = async () => {
    try {
      const response = await fetch("/api/wifi-info")
      const data = await response.json()
      setWifiInfo(data)

      // Check if connected to the correct network
      const allowedMacAddresses = ["00:11:22:33:44:55"] // Replace with your actual MAC addresses
      if (!allowedMacAddresses.includes(data.macAddress)) {
        setMessage("Iltimos, to'g'ri Wi-Fi tarmog'iga ulaning")
        showNotification("error", "Iltimos, to'g'ri Wi-Fi tarmog'iga ulaning")
        return false
      }
      return true
    } catch (error) {
      console.error("Error checking WiFi:", error)
      setMessage("Wi-Fi ma'lumotlarini tekshirishda xatolik yuz berdi")
      showNotification("error", "Wi-Fi ma'lumotlarini tekshirishda xatolik yuz berdi")
      return false
    }
  }

  const checkFakeGPS = (position) => {
    if (position.coords.accuracy > 30) {
      return true
    }
    if (position.coords.altitude !== null && position.coords.altitude > 9000) {
      return true
    }
    if (position.coords.speed !== null && position.coords.speed > 30) {
      return true
    }
    return false
  }

  const handleScanLogic = async (data) => {
    if (data) {
      setScannedData(data)
      console.log("Scanned data:", data)

      // Check WiFi connection first
      const isWifiValid = await checkWifiConnection()
      if (!isWifiValid) {
        return
      }

      const expectedLocation = { lat: 38.6223188, lon: 66.2507937 }
      const locationAccuracyThreshold = 0.00036 // gradus

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude
            const lon = position.coords.longitude
            const distance = Math.sqrt(
              Math.pow(lat - expectedLocation.lat, 2) + Math.pow(lon - expectedLocation.lon, 2),
            )

            console.log("Current location:", lat, lon)
            console.log("Distance from expected location:", distance)

            if (checkFakeGPS(position)) {
              setMessage("Soxta GPS aniqlandi. Iltimos, haqiqiy joylashuvdan foydalaning.")
              showNotification("error", "Soxta GPS aniqlandi. Iltimos, haqiqiy joylashuvdan foydalaning.")
              return
            }

            try {
              const { data: blockedData, error: blockedError } = await supabase
                .from("blocked")
                .select("*")
                .eq("user_id", user.id)
                .eq("company_id", companyId)
                .order("blocked_at", { ascending: false })
                .limit(1)

              if (blockedError) throw blockedError

              if (blockedData && blockedData.length > 0) {
                const lastBlockedTime = new Date(blockedData[0].blocked_at)
                const currentTime = new Date()
                const hoursDifference = (currentTime - lastBlockedTime) / (1000 * 60 * 60)

                if (hoursDifference < 200) {
                  setMessage("Siz ish joyingizda emassiz")
                  showNotification("error", "Siz ish joyingizda emassiz")
                  return
                }
              }

              if (distance >= locationAccuracyThreshold) {
                const { error: insertError } = await supabase.from("blocked").insert({
                  user_id: user.id,
                  company_id: companyId,
                  blocked_at: new Date().toISOString(),
                })

                if (insertError) throw insertError

                setMessage("Siz ish joyingizda emassiz")
                showNotification("error", "Siz ish joyingizda emassiz")
                return
              }

              const today = new Date().toISOString().split("T")[0]
              const getTashkentTime = () => {
                const date = new Date()
                return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tashkent" }))
              }

              const { data: existingAttendance, error: attendanceError } = await supabase
                .from("davomat")
                .select("*")
                .eq("xodim_id", user.id)
                .eq("kelish_sana", today)
                .eq("company_id", companyId)
                .maybeSingle()

              if (attendanceError) throw attendanceError

              if (!existingAttendance) {
                const { error: insertError } = await supabase.from("davomat").insert({
                  xodim_id: user.id,
                  kelish_sana: today,
                  kelish_vaqti: getTashkentTime().toISOString(),
                  company_id: companyId,
                })

                if (insertError) throw insertError
                setMessage("Kelish vaqti qayd etildi.")
                showNotification("success", "Kelish vaqti qayd etildi.")
              } else if (!existingAttendance.ketish_vaqti) {
                const { error: updateError } = await supabase
                  .from("davomat")
                  .update({ ketish_vaqti: getTashkentTime().toISOString() })
                  .eq("id", existingAttendance.id)
                  .eq("company_id", companyId)

                if (updateError) throw updateError
                setMessage("Ketish vaqti qayd etildi.")
                showNotification("success", "Ketish vaqti qayd etildi.")
              } else {
                setMessage("Siz bugun kelish va ketish vaqtlarini qayd etdingiz.")
                showNotification("info", "Siz bugun kelish va ketish vaqtlarini qayd etdingiz.")
              }
            } catch (error) {
              console.error("Error:", error)
              setMessage("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.")
              showNotification("error", "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.")
            }
          },
          (error) => {
            console.error("Geolocation error:", error)
            setMessage("Qurilmangizda Lokatsiyani qo'shing.")
            showNotification("error", "Qurilmangizda Lokatsiyani qo'shing.")
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          },
        )
      } else {
        setMessage("Geolokatsiya qo'llab-quvvatlanmaydi.")
        showNotification("error", "Geolokatsiya qo'llab-quvvatlanmaydi.")
      }
    }
  }

  const handleRefresh = () => {
    setMessage("")
    setScannedData("")
    initializeQrCodeReader()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-2rem)]">
        <div className="card w-full max-w-md shadow-xl border-t-4 border-t-indigo-600">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full">
                <QrCode className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t("scanQR")}</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{t("scanQRDescription")}</p>
          </div>

          {isContainerReady && (
            <motion.div
              id="qr-scanner-container"
              className="relative mb-6 bg-black rounded-xl overflow-hidden"
              style={{ minHeight: 300, maxHeight: 400 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}

          {message && (
            <motion.div
              className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <p className="text-center text-indigo-700 dark:text-indigo-300 font-medium">{message}</p>
            </motion.div>
          )}

          <div className="flex flex-col gap-4">
            <motion.button
              onClick={handleRefresh}
              className="btn btn-primary flex items-center justify-center gap-2"
              disabled={!isContainerReady}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <RefreshCw className={`w-5 h-5 ${scanning ? "animate-spin" : ""}`} />
              {scanning ? t("scanning") : t("refresh")}
            </motion.button>

            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Wifi className="w-4 h-4" />
                <span>{wifiInfo ? `${t("connectedTo")}: ${wifiInfo.ssid}` : t("checkingWifi")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>{t("locationRequired")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
