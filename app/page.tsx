import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import AuthButtonServer from "./components/AuthButtonServer"
import { notFound } from "next/navigation"
import UserDashboard from "./components/UserDashboard"

async function getSession() {
  const supabase = createServerComponentClient({ cookies })
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error("Error:", error)
    return null
  }
}

async function getProfile(user_id: string) {
  const supabase = createServerComponentClient({ cookies })
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select(`username, full_name, avatar_url, website, company_id`)
      .eq("id", user_id)
      .single()

    return profile
  } catch (error) {
    console.error("Error:", error)
    return null
  }
}

export default async function Page() {
  const session = await getSession()

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-5xl font-bold mb-4">Welcome!</h1>
        <p className="text-gray-600 mb-8">Please sign in to continue.</p>
        <AuthButtonServer />
      </div>
    )
  }

  const user = session?.user

  if (!user) {
    return notFound()
  }

  if (user && !user.company_id) {
    return <UserDashboard userId={user.id} />
  }

  const profile = await getProfile(user.id)

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-5xl font-bold mb-4">Dashboard</h1>
      <p className="text-gray-600 mb-8">Welcome, {profile?.full_name || user.email}!</p>
      <AuthButtonServer />
    </div>
  )
}
