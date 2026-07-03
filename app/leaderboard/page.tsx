import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { SiteHeader } from "@/components/site-header"
import { Leaderboard, type LeaderboardEntry } from "@/components/leaderboard/leaderboard"

export const metadata: Metadata = {
  title: "Лидерборд — CTF Platform",
}

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      solves: {
        select: {
          createdAt: true,
          task: { select: { points: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  const entries: LeaderboardEntry[] = users
    .map((user) => ({
      id: user.id,
      username: user.username,
      totalPoints: user.solves.reduce((sum, s) => sum + s.task.points, 0),
      solveCount: user.solves.length,
      solves: user.solves.map((s) => ({
        points: s.task.points,
        solvedAt: s.createdAt.toISOString(),
      })),
    }))
    .filter((e) => e.solveCount > 0)
    .sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        // При равных очках выше тот, кто набрал их раньше
        new Date(a.solves[a.solves.length - 1]?.solvedAt ?? 0).getTime() -
          new Date(b.solves[b.solves.length - 1]?.solvedAt ?? 0).getTime(),
    )

  return (
    <>
      <SiteHeader username={session.user.username} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="font-mono text-2xl font-semibold text-balance">Лидерборд</h1>
          <p className="text-sm text-muted-foreground">
            Рейтинг участников по сумме поинтов за решённые таски.
          </p>
        </div>
        <Leaderboard entries={entries} currentUserId={session.user.id} />
      </main>
    </>
  )
}
