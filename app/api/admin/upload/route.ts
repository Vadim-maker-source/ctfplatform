import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

function sanitizeFileName(name: string) {
  const base = path.basename(name)
  return base.replace(/[^a-zA-Z0-9а-яА-ЯёЁ._-]/g, "_")
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 })
    }

    const formData = await request.formData()
    const files = formData.getAll("files").filter((f): f is File => f instanceof File)

    if (files.length === 0) {
      return NextResponse.json({ error: "Файлы не переданы" }, { status: 400 })
    }

    const tasksDir = path.join(process.cwd(), "public", "tasks")
    await mkdir(tasksDir, { recursive: true })

    const savedPaths: string[] = []

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Файл «${file.name}» больше 50 МБ` },
          { status: 400 },
        )
      }

      const originalName = sanitizeFileName(file.name)

      // Создаём запись, чтобы получить уникальный авто-инкремент id
      const record = await prisma.taskFile.create({
        data: { originalName, path: "" },
      })

      const fileName = `${record.id}_${originalName}`
      const publicPath = `/tasks/${fileName}`

      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(path.join(tasksDir, fileName), buffer)

      await prisma.taskFile.update({
        where: { id: record.id },
        data: { path: publicPath },
      })

      savedPaths.push(publicPath)
    }

    return NextResponse.json({ ok: true, paths: savedPaths })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}
