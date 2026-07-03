import type { Metadata } from "next"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Вход — CTF Platform",
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <LoginForm />
    </main>
  )
}
