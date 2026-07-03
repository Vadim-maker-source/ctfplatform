import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { CheckCircle2Icon, FlagIcon, MailIcon } from "lucide-react"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { SiteHeader } from "@/components/site-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Профиль — CTF Platform",
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  const [user, totalTasks] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        username: true,
        email: true,
        solves: {
          select: {
            id: true,
            task: { select: { id: true, title: true, author: true } },
          },
          orderBy: { id: "desc" },
        },
      },
    }),
    prisma.tasks.count(),
  ])

  if (!user) {
    redirect("/login")
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const progress = totalTasks > 0 ? Math.round((user.solves.length / totalTasks) * 100) : 0

  return (
    <>
      <SiteHeader username={user.username} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarFallback className="bg-primary/10 font-mono text-lg text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl">{user.name}</CardTitle>
                <CardDescription className="font-mono">@{user.username}</CardDescription>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MailIcon className="size-3.5" />
                  {user.email}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="font-mono text-2xl font-semibold text-primary">
                  {user.solves.length}
                </span>
                <span className="text-xs text-muted-foreground">решено</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-2xl font-semibold">{totalTasks}</span>
                <span className="text-xs text-muted-foreground">всего тасков</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-2xl font-semibold">{progress}%</span>
                <span className="text-xs text-muted-foreground">прогресс</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="mb-4 mt-8 font-mono text-lg font-semibold">Решённые таски</h2>

        {user.solves.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FlagIcon />
              </EmptyMedia>
              <EmptyTitle>Пока нет решённых тасков</EmptyTitle>
              <EmptyDescription>
                Отправляйтесь на борду и сдайте свой первый флаг.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-2">
            {user.solves.map((solve) => (
              <div
                key={solve.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2Icon className="size-4 shrink-0 text-primary" />
                  <span className="font-mono text-sm">{solve.task.title}</span>
                </div>
                <Badge variant="secondary">by {solve.task.author}</Badge>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
