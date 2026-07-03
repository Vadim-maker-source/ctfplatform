import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { SiteHeader } from "@/components/site-header"
import { TaskBoard } from "@/components/board/task-board"

export const metadata: Metadata = {
  title: "Таски — CTF Platform",
}

export default async function BoardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  const [tasks, solves] = await Promise.all([
    prisma.tasks.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        points: true,
        links: true,
        files: true,
        hints: true,
        author: true,
        _count: { select: { solves: true } },
        solves: {
          select: {
            createdAt: true,
            user: { select: { username: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { title: "asc" },
    }),
    prisma.solves.findMany({
      where: { userId: session.user.id },
      select: { taskId: true },
    }),
  ])

  const solvedIds = solves.map((s) => s.taskId)

  return (
    <>
      <SiteHeader username={session.user.username} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="font-mono text-2xl font-semibold text-balance">Таски</h1>
          <p className="text-sm text-muted-foreground">
            {"Решено "}
            <span className="font-mono text-primary">{solvedIds.length}</span>
            {" из "}
            <span className="font-mono">{tasks.length}</span>
          </p>
        </div>
        <TaskBoard
          tasks={tasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            category: t.category,
            points: t.points,
            links: t.links,
            files: t.files,
            hints: t.hints,
            author: t.author,
            solveCount: t._count.solves,
            solvers: t.solves.map((s) => ({
              username: s.user.username,
              solvedAt: s.createdAt.toISOString(),
            })),
          }))}
          solvedIds={solvedIds}
        />
      </main>
    </>
  )
}
