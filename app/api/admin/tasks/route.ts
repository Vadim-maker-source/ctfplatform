import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { CATEGORIES, type CategoryValue } from "@/app/lib/categories"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const body = (await request.json()) as {
      title?: string
      description?: string
      category?: string
      links?: string[]
      files?: string[]
      author?: string
      flag?: string
    }

    const title = body.title?.trim()
    const description = body.description?.trim()
    const flag = body.flag?.trim()
    const author = body.author?.trim() || session.user.username || "admin"
    const category = body.category as CategoryValue

    if (!title || !description || !flag) {
      return NextResponse.json(
        { error: "Название, описание и флаг обязательны" },
        { status: 400 },
      )
    }

    if (!CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Неверная категория" }, { status: 400 })
    }

    const links = (body.links ?? []).map((l) => l.trim()).filter(Boolean)
    const files = (body.files ?? []).map((f) => f.trim()).filter(Boolean)

    const task = await prisma.tasks.create({
      data: { title, description, category, links, files, author, flag },
    })

    return NextResponse.json({ ok: true, id: task.id })
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}
