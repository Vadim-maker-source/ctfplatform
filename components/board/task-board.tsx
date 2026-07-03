"use client"

import { useState } from "react"
import { CheckCircle2Icon, FlagIcon, UsersIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { TaskDialog, type TaskItem } from "@/components/board/task-dialog"
import { cn } from "@/lib/utils"

export function TaskBoard({
  tasks,
  solvedIds,
}: {
  tasks: TaskItem[]
  solvedIds: string[]
}) {
  const [solved, setSolved] = useState<Set<string>>(new Set(solvedIds))
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null)

  if (tasks.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FlagIcon />
          </EmptyMedia>
          <EmptyTitle>Пока нет тасков</EmptyTitle>
          <EmptyDescription>Таски появятся здесь, когда их добавят.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => {
          const isSolved = solved.has(task.id)
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => setActiveTask(task)}
              className="rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card
                className={cn(
                  "h-full transition-colors hover:border-primary/50",
                  isSolved && "border-primary/40 bg-primary/5",
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-mono text-base">{task.title}</CardTitle>
                    {isSolved && (
                      <CheckCircle2Icon className="size-5 shrink-0 text-primary" aria-label="Решено" />
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">{task.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1" />
                <CardFooter className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">by {task.author}</span>
                  <Badge variant="secondary">
                    <UsersIcon className="size-3" />
                    {task.solveCount}
                  </Badge>
                </CardFooter>
              </Card>
            </button>
          )
        })}
      </div>

      <TaskDialog
        task={activeTask}
        solved={activeTask ? solved.has(activeTask.id) : false}
        onOpenChange={(open) => {
          if (!open) setActiveTask(null)
        }}
        onSolved={(taskId) => {
          setSolved((prev) => new Set(prev).add(taskId))
        }}
      />
    </>
  )
}
