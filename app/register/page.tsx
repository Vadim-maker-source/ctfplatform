import type { Metadata } from "next"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Регистрация — CTF Platform",
}

export default function RegisterPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <RegisterForm />
    </main>
  )
}
