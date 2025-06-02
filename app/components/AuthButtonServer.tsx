import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"

export default async function AuthButtonServer() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const signOut = async () => {
    "use server"
    const supabase = createServerComponentClient({ cookies })
    await supabase.auth.signOut()
    redirect("/")
  }

  const signIn = async () => {
    "use server"
    redirect("/auth")
  }

  return session ? (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4" />
        <span className="text-sm text-muted-foreground">{session.user.email}</span>
      </div>
      <form action={signOut}>
        <Button variant="outline" size="sm" type="submit">
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </form>
    </div>
  ) : (
    <form action={signIn}>
      <Button variant="default" size="sm" type="submit">
        Sign in
      </Button>
    </form>
  )
}
