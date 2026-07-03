import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { SiteHeader } from "@/components/site-header"
import { AdminPanel } from "@/components/admin/admin-panel"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/board")
  }

  const [users, attempts, tasks] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        solves: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            task: { select: { id: true, title: true, category: true } },
          },
        },
        _count: { select: { attempts: true } },
      },
    }),
    prisma.attempts.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        flag: true,
        correct: true,
        createdAt: true,
        user: { select: { id: true, username: true } },
        task: { select: { id: true, title: true, category: true } },
      },
    }),
    prisma.tasks.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        links: true,
        files: true,
        hints: true,
        points: true,
        author: true,
        createdAt: true,
        _count: { select: { solves: true } },
      },
    }),
  ])

  const serializedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    solves: u.solves.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })),
  }))

  const serializedAttempts = attempts.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }))

  const serializedTasks = tasks.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
  }))

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="font-mono text-2xl font-bold text-foreground">
            {"> Админ-панель"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Активность пользователей, попытки сдачи и управление тасками
          </p>
        </div>
        <AdminPanel users={serializedUsers} attempts={serializedAttempts} tasks={serializedTasks} />
      </main>
    </div>
  )
}
