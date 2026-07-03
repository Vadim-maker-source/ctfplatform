"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { FileIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { CATEGORIES, CATEGORY_LABELS, type CategoryValue } from "@/app/lib/categories"

export interface AdminTask {
  id: string
  title: string
  description: string
  category: string
  links: string[]
  files: string[]
  hints: string[]
  points: number
  author: string
  createdAt: string
  _count: { solves: number }
}

export function TasksManager({ tasks }: { tasks: AdminTask[] }) {
  const router = useRouter()
  const [editingTask, setEditingTask] = useState<AdminTask | null>(null)
  const [deletingTask, setDeletingTask] = useState<AdminTask | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleDelete() {
    if (!deletingTask) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/tasks/${deletingTask.id}`, { method: "DELETE" })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast.error(data.error ?? "Не удалось удалить таск")
        return
      }
      toast.success(`Таск «${deletingTask.title}» удалён`)
      setDeletingTask(null)
      router.refresh()
    } catch {
      toast.error("Ошибка сети")
    } finally {
      setDeleteLoading(false)
    }
  }

  if (tasks.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Тасков пока нет. Создайте первый во вкладке «Добавить таск».
      </p>
    )
  }

  return (
    <>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead className="text-right">Поинты</TableHead>
              <TableHead className="text-right">Решений</TableHead>
              <TableHead className="text-right">Файлов</TableHead>
              <TableHead className="w-24 text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-mono font-medium">{task.title}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {CATEGORY_LABELS[task.category as CategoryValue] ?? task.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">{task.points}</TableCell>
                <TableCell className="text-right font-mono">{task._count.solves}</TableCell>
                <TableCell className="text-right font-mono">{task.files.length}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingTask(task)}
                      aria-label={`Редактировать ${task.title}`}
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingTask(task)}
                      className="text-destructive hover:text-destructive"
                      aria-label={`Удалить ${task.title}`}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingTask && (
        <EditTaskDialog task={editingTask} onClose={() => setEditingTask(null)} />
      )}

      <Dialog open={deletingTask !== null} onOpenChange={(open) => !open && setDeletingTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить таск?</DialogTitle>
            <DialogDescription>
              {deletingTask
                ? `Таск «${deletingTask.title}» будет удалён вместе с решениями, попытками и файлами. Это действие необратимо.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTask(null)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading && <Spinner data-icon="inline-start" />}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function EditTaskDialog({ task, onClose }: { task: AdminTask; onClose: () => void }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [category, setCategory] = useState<string>(task.category)
  const [author, setAuthor] = useState(task.author)
  const [flag, setFlag] = useState("")
  const [points, setPoints] = useState(String(task.points))
  const [links, setLinks] = useState(task.links.join("\n"))
  const [hints, setHints] = useState(task.hints.join("\n"))
  const [existingFiles, setExistingFiles] = useState<string[]>(task.files)
  const [newFiles, setNewFiles] = useState<File[]>([])

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files
    if (!list) return
    setNewFiles((prev) => [...prev, ...Array.from(list)])
    e.target.value = ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const pointsNum = Number(points)
    if (!Number.isInteger(pointsNum) || pointsNum < 100 || pointsNum > 1000) {
      toast.error("Стоимость должна быть от 100 до 1000 поинтов")
      return
    }

    setLoading(true)
    try {
      // 1. Загружаем новые файлы
      let uploadedPaths: string[] = []
      if (newFiles.length > 0) {
        const formData = new FormData()
        for (const file of newFiles) {
          formData.append("files", file)
        }
        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        })
        const uploadData = (await uploadRes.json()) as { error?: string; paths?: string[] }
        if (!uploadRes.ok) {
          toast.error(uploadData.error ?? "Не удалось загрузить файлы")
          setLoading(false)
          return
        }
        uploadedPaths = uploadData.paths ?? []
      }

      // 2. Обновляем таск
      const res = await fetch(`/api/admin/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          author,
          flag, // пустая строка = оставить прежний флаг
          points: pointsNum,
          links: links.split("\n"),
          hints: hints.split("\n"),
          files: [...existingFiles, ...uploadedPaths],
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast.error(data.error ?? "Не удалось сохранить таск")
        return
      }
      toast.success("Таск обновлён")
      onClose()
      router.refresh()
    } catch {
      toast.error("Ошибка сети")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono">Редактирование таска</DialogTitle>
          <DialogDescription>
            Оставьте поле флага пустым, чтобы не менять его.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit-title">Название</FieldLabel>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-category">Категория</FieldLabel>
              <Select value={category} onValueChange={(value) => setCategory(value ?? task.category)}>
                <SelectTrigger id="edit-category" className="w-full">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-points">Стоимость (поинты)</FieldLabel>
              <Input
                id="edit-points"
                type="number"
                min={100}
                max={1000}
                step={1}
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                required
                className="font-mono"
              />
              <FieldDescription>От 100 до 1000 поинтов.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-description">Описание</FieldLabel>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-author">Автор</FieldLabel>
              <Input
                id="edit-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-flag">Новый флаг</FieldLabel>
              <Input
                id="edit-flag"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                className="font-mono"
                placeholder="Оставьте пустым, чтобы не менять"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-hints">Подсказки</FieldLabel>
              <Textarea
                id="edit-hints"
                value={hints}
                onChange={(e) => setHints(e.target.value)}
                rows={3}
              />
              <FieldDescription>По одной подсказке на строку.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-links">Ссылки</FieldLabel>
              <Textarea
                id="edit-links"
                value={links}
                onChange={(e) => setLinks(e.target.value)}
                rows={3}
              />
              <FieldDescription>По одной ссылке на строку.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-files">Файлы</FieldLabel>
              <input
                ref={fileInputRef}
                id="edit-files"
                type="file"
                multiple
                onChange={handleFilesChange}
                className="sr-only"
              />
              <div className="flex flex-col gap-2">
                {existingFiles.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {existingFiles.map((filePath) => (
                      <li
                        key={filePath}
                        className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-1.5 text-sm"
                      >
                        <span className="truncate font-mono">{filePath.split("/").pop()}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setExistingFiles((prev) => prev.filter((f) => f !== filePath))
                          }
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Убрать файл ${filePath.split("/").pop()}`}
                        >
                          <XIcon className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {newFiles.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {newFiles.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between gap-2 rounded-md border border-dashed border-border px-3 py-1.5 text-sm"
                      >
                        <span className="truncate font-mono">
                          {file.name}
                          <span className="ml-2 text-xs text-muted-foreground">(новый)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setNewFiles((prev) => prev.filter((_, i) => i !== index))}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Убрать файл ${file.name}`}
                        >
                          <XIcon className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileIcon data-icon="inline-start" />
                  Добавить файлы
                </Button>
              </div>
              <FieldDescription>
                Убранные файлы будут удалены с диска после сохранения.
              </FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner data-icon="inline-start" />}
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
