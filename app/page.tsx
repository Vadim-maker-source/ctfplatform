import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session?.user?.id) {
    redirect("/board")
  }

  redirect("/login")
}
