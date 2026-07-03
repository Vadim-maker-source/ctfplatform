"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  FileIcon,
  FlagIcon,
  LinkIcon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

export type TaskItem = {
  id: string
  title: string
  description: string
  links: string[]
  files: string[]
  author: string
  solveCount: number
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

      const data = (await res.json()) as { error?: string }

      setSubmitting(false)

      if (!res.ok) {
        setError(data.error ?? "Ошибка отправки флага")
        return
      }

      setFlag("")
      onSolved(task.id)
      toast.success("Флаг принят!", {
        description: `Таск «${task.title}» решён.`,
      })
      router.refresh()
    } catch {
      setSubmitting(false)
      setError("Ошибка сети. Попробуйте ещё раз")
    }
  }

  return (
    <Dialog
      open={task !== null}
      onOpenChange={(open) => {
        if (!open) {
          setFlag("")
          setError(null)
        }
        onOpenChange(open)
      }}
    >
      <DialogContent className="max-w-lg">
        {task && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <DialogTitle className="font-mono">{task.title}</DialogTitle>
                {solved && (
                  <Badge>
                    <CheckCircle2Icon className="size-3" />
                    Решено
                  </Badge>
                )}
              </div>
              <DialogDescription className="whitespace-pre-wrap text-pretty">
                {task.description}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>by {task.author}</span>
              <span className="flex items-center gap-1">
                <UsersIcon className="size-3" />
                {task.solveCount + (solved ? 0 : 0)} решений
              </span>
            </div>

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
                      className="flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
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
                      className="flex items-center gap-2 text-sm text-foreground underline-offset-4 hover:underline"
                    >
                      <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{file.split("/").pop() ?? file}</span>
                    </a>
                  ))}
                </div>
              </>
            )}

            <Separator />

            {solved ? (
              <p className="flex items-center gap-2 text-sm text-primary">
                <CheckCircle2Icon className="size-4" />
                Вы уже решили этот таск
              </p>
            ) : (
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
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
