"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  FileIcon,
  FlagIcon,
  LightbulbIcon,
  LinkIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type TaskSolver = {
  username: string
  solvedAt: string
}

export type TaskItem = {
  id: string
  title: string
  description: string
  category: string
  points: number
  links: string[]
  files: string[]
  hints: string[]
  author: string
  solveCount: number
  solvers: TaskSolver[]
}

export function TaskDialog({
  task,
  solved,
  onOpenChange,
  onSolved,
}: {
  task: TaskItem | null
  solved: boolean
  onOpenChange: (open: boolean) => void
  onSolved: (taskId: string) => void
}) {
  const router = useRouter()
  const [flag, setFlag] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!task || !flag.trim() || submitting) return

    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch(`/api/tasks/${task.id}/solve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag }),
      })

      const data = (await res.json()) as { error?: string; alreadySolved?: boolean }

      setSubmitting(false)

      if (!res.ok) {
        setError(data.error ?? "Ошибка отправки флага")
        return
      }

      setFlag("")
      onSolved(task.id)
      toast.success("Флаг принят!", {
        description: data.alreadySolved
          ? `Таск «${task.title}» уже был решён ранее — повторная сдача засчитана как верная.`
          : `Таск «${task.title}» решён.`,
      })
      router.refresh()
    } catch {
      setSubmitting(false)
      setError("Ошибка сети. Попробуйте ещё раз")
    }
  }

  function toggleHint(index: number) {
    setRevealedHints((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return (
    <Dialog
      open={task !== null}
      onOpenChange={(open) => {
        if (!open) {
          setFlag("")
          setError(null)
          setRevealedHints(new Set())
        }
        onOpenChange(open)
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        {task && (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="font-mono text-xl">{task.title}</DialogTitle>
                <Badge variant="outline" className="font-mono">
                  <TrophyIcon className="size-3" />
                  {task.points}
                </Badge>
                {solved && (
                  <Badge>
                    <CheckCircle2Icon className="size-3" />
                    Решено
                  </Badge>
                )}
              </div>
              <DialogDescription className="sr-only">
                Детали задания {task.title}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="task">
              <TabsList className="w-full">
                <TabsTrigger value="task" className="flex-1">
                  Задание
                </TabsTrigger>
                <TabsTrigger value="solvers" className="flex-1">
                  Решившие ({task.solveCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="task" className="flex flex-col gap-3">
                <p className="whitespace-pre-wrap text-base leading-relaxed text-muted-foreground text-pretty">
                  {task.description}
                </p>

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>by {task.author}</span>
                  <span className="flex items-center gap-1">
                    <UsersIcon className="size-3" />
                    {task.solveCount} решений
                  </span>
                </div>

                {task.hints.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-2">
                      {task.hints.map((hint, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => toggleHint(index)}
                          className="flex items-start gap-2 rounded-md border border-border px-3 py-2 text-left text-base transition-colors hover:border-primary/50"
                        >
                          <LightbulbIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
                          {revealedHints.has(index) ? (
                            <span className="text-pretty">{hint}</span>
                          ) : (
                            <span className="text-muted-foreground">
                              Подсказка {index + 1} — нажмите, чтобы открыть
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {(task.links.length > 0 || task.files.length > 0) && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-2">
                      {task.links.map((link) => (
                        <a
                          key={link}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-base text-primary underline-offset-4 hover:underline"
                        >
                          <LinkIcon className="size-4 shrink-0" />
                          <span className="truncate">{link}</span>
                          <ExternalLinkIcon className="size-3 shrink-0" />
                        </a>
                      ))}
                      {task.files.map((file) => (
                        <a
                          key={file}
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-base text-foreground underline-offset-4 hover:underline"
                        >
                          <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{file.split("/").pop() ?? file}</span>
                        </a>
                      ))}
                    </div>
                  </>
                )}

                <Separator />

                {solved && (
                  <p className="flex items-center gap-2 text-base text-primary">
                    <CheckCircle2Icon className="size-4" />
                    Таск решён — но флаг можно сдать ещё раз
                  </p>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                  <InputGroup>
                    <InputGroupAddon>
                      <FlagIcon />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="flag{...}"
                      className="font-mono"
                      value={flag}
                      onChange={(e) => setFlag(e.target.value)}
                      aria-invalid={error ? true : undefined}
                      aria-label="Флаг"
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton type="submit" disabled={submitting || !flag.trim()}>
                        {submitting ? <Spinner /> : "Сдать"}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  {error && (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  )}
                </form>
              </TabsContent>

              <TabsContent value="solvers">
                {task.solvers.length === 0 ? (
                  <p className="py-6 text-center text-base text-muted-foreground">
                    Этот таск ещё никто не решил. Будьте первым!
                  </p>
                ) : (
                  <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
                    {task.solvers.map((solver, index) => (
                      <li
                        key={`${solver.username}-${solver.solvedAt}`}
                        className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-base odd:bg-muted/50"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-6 font-mono text-sm text-muted-foreground">
                            {index + 1}.
                          </span>
                          <span className="font-mono">{solver.username}</span>
                          {index === 0 && (
                            <Badge variant="secondary" className="text-xs">
                              first blood
                            </Badge>
                          )}
                        </span>
                        <time
                          dateTime={solver.solvedAt}
                          className="shrink-0 text-sm text-muted-foreground"
                        >
                          {new Date(solver.solvedAt).toLocaleString("ru-RU", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
