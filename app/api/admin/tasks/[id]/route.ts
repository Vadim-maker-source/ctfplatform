import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { unlink } from "fs/promises"
import path from "path"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { CATEGORIES, type CategoryValue } from "@/app/lib/categories"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null
  }
  return session
}

/** Удаляет файлы из public/tasks и записи TaskFile по публичным путям вида /tasks/12_name.zip */
async function removePhysicalFiles(publicPaths: string[]) {
  for (const publicPath of publicPaths) {
    // Защита от выхода за пределы public/tasks
    const fileName = path.basename(publicPath)
    if (!publicPath.startsWith("/tasks/") || fileName !== publicPath.slice("/tasks/".length)) {
      continue
    }
    const absolutePath = path.join(process.cwd(), "public", "tasks", fileName)
    try {
      await unlink(absolutePath)
    } catch {
      // Файла уже нет на диске — не критично
    }
    await prisma.taskFile.deleteMany({ where: { path: publicPath } })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.tasks.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Таск не найден" }, { status: 404 })
    }

    const body = (await request.json()) as {
      title?: string
      description?: string
      category?: string
      links?: string[]
      files?: string[]
      hints?: string[]
      points?: number
      author?: string
      flag?: string
    }

    const title = body.title?.trim()
    const description = body.description?.trim()
    const author = body.author?.trim()
    const category = body.category as CategoryValue

    if (!title || !description || !author) {
      return NextResponse.json(
        { error: "Название, описание и автор обязательны" },
        { status: 400 },
      )
    }

    if (!CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Неверная категория" }, { status: 400 })
    }

    const points = Number(body.points)
    if (!Number.isInteger(points) || points < 100 || points > 1000) {
      return NextResponse.json(
        { error: "Стоимость должна быть целым числом от 100 до 1000" },
        { status: 400 },
      )
    }

    // Пустой флаг = оставить прежний
    const flag = body.flag?.trim() || existing.flag

    const links = (body.links ?? []).map((l) => l.trim()).filter(Boolean)
    const files = (body.files ?? []).map((f) => f.trim()).filter(Boolean)
    const hints = (body.hints ?? []).map((h) => h.trim()).filter(Boolean)

    // Файлы, которые были у таска, но убраны при редактировании — удаляем с диска
    const removedFiles = existing.files.filter((f) => !files.includes(f))
    await removePhysicalFiles(removedFiles)

    await prisma.tasks.update({
      where: { id },
      data: { title, description, category, links, files, hints, points, author, flag },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.tasks.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Таск не найден" }, { status: 404 })
    }

    // Сначала удаляем файлы таска с диска
    await removePhysicalFiles(existing.files)

    // Solves и Attempts удалятся каскадно (onDelete: Cascade в схеме)
    await prisma.tasks.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}
