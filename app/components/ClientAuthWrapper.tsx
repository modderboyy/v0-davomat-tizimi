"use client"

import dynamic from "next/dynamic"

// Import Auth component with no SSR to prevent it from running during build
const Auth = dynamic(() => import("./Auth"), { ssr: false })

export default function ClientAuthWrapper() {
  return <Auth />
}
