import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "./components/ThemeProvider"
import { LanguageProvider } from "./context/LanguageContext"
import { DynamicIslandProvider } from "./components/DynamicIsland"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata = {
  title: "Davomat Tizimi",
  description: "Xodimlar davomati tizimi",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <DynamicIslandProvider>{children}</DynamicIslandProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
