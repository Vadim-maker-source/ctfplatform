import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/app/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, username, email, password } = body as {
      name?: string
      username?: string
      email?: string
      password?: string
    }

    if (!name?.trim() || !username?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Все поля обязательны" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Пароль должен содержать минимум 8 символов" },
        { status: 400 },
      )
    }

    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(username)) {
      return NextResponse.json(
        { error: "Юзернейм: 3-32 символа, только латиница, цифры, _ и -" },
        { status: 400 },
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Некорректный email" }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Пользователь с таким email или юзернеймом уже существует" },
        { status: 409 },
      )
    }

    const hashedPassword = await hash(password, 12)

    await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
      },
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}
