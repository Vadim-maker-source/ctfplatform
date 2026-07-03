import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { id } = await params
    const body = (await request.json()) as { flag?: string }

    if (!body.flag?.trim()) {
      return NextResponse.json({ error: "Флаг не может быть пустым" }, { status: 400 })
    }

    const task = await prisma.tasks.findUnique({ where: { id } })

    if (!task) {
      return NextResponse.json({ error: "Таск не найден" }, { status: 404 })
    }

    const alreadySolved = await prisma.solves.findUnique({
      where: {
        taskId_userId: { taskId: id, userId: session.user.id },
      },
    })

    if (alreadySolved) {
      return NextResponse.json({ error: "Вы уже решили этот таск" }, { status: 409 })
    }

    const submittedFlag = body.flag.trim()
    const correct = submittedFlag === task.flag

    await prisma.attempts.create({
      data: {
        taskId: id,
        userId: session.user.id,
        flag: submittedFlag,
        correct,
      },
    })

    if (!correct) {
      return NextResponse.json({ error: "Неверный флаг" }, { status: 400 })
    }

    await prisma.solves.create({
      data: {
        taskId: id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Solve error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}
