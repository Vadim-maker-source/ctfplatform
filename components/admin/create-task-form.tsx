"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { FileIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { CATEGORIES, CATEGORY_LABELS } from "@/app/lib/categories"

export function CreateTaskForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<string>("MISC")
  const [author, setAuthor] = useState("")
  const [flag, setFlag] = useState("")
  const [points, setPoints] = useState("100")
  const [links, setLinks] = useState("")
  const [hints, setHints] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files
    if (!list) return
    setSelectedFiles((prev) => [...prev, ...Array.from(list)])
    e.target.value = ""
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
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
      // 1. Загружаем файлы в public/tasks
      let filePaths: string[] = []
      if (selectedFiles.length > 0) {
        const formData = new FormData()
        for (const file of selectedFiles) {
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
        filePaths = uploadData.paths ?? []
      }

      // 2. Создаём таск
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          author,
          flag,
          points: pointsNum,
          links: links.split("\n"),
          hints: hints.split("\n"),
          files: filePaths,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast.error(data.error ?? "Не удалось создать таск")
        return
      }
      toast.success("Таск создан")
      setTitle("")
      setDescription("")
      setAuthor("")
      setFlag("")
      setPoints("100")
      setLinks("")
      setHints("")
      setSelectedFiles([])
      router.refresh()
    } catch {
      toast.error("Ошибка сети")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="font-mono">Новый таск</CardTitle>
        <CardDescription>
          Заполните данные задания. Флаг хранится на сервере и не отдаётся клиентам.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="task-title">Название</FieldLabel>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="SQL Injection 101"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="task-category">Категория</FieldLabel>
              <Select value={category} onValueChange={(value) => setCategory(value ?? "MISC")}>
                <SelectTrigger id="task-category" className="w-full">
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
              <FieldLabel htmlFor="task-points">Стоимость (поинты)</FieldLabel>
              <Input
                id="task-points"
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
              <FieldLabel htmlFor="task-description">Описание</FieldLabel>
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                placeholder="Описание задания..."
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="task-author">Автор</FieldLabel>
              <Input
                id="task-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ваш ник (по умолчанию — ваш username)"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="task-flag">Флаг</FieldLabel>
              <Input
                id="task-flag"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                required
                className="font-mono"
                placeholder="ctf{...}"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="task-hints">Подсказки</FieldLabel>
              <Textarea
                id="task-hints"
                value={hints}
                onChange={(e) => setHints(e.target.value)}
                rows={3}
                placeholder={"Обратите внимание на заголовки ответа\nПопробуйте другую кодировку"}
              />
              <FieldDescription>По одной подсказке на строку.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="task-links">Ссылки</FieldLabel>
              <Textarea
                id="task-links"
                value={links}
                onChange={(e) => setLinks(e.target.value)}
                rows={3}
                placeholder={"https://target.example.com\nhttps://hint.example.com"}
              />
              <FieldDescription>По одной ссылке на строку.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="task-files">Файлы</FieldLabel>
              <input
                ref={fileInputRef}
                id="task-files"
                type="file"
                multiple
                onChange={handleFilesChange}
                className="sr-only"
              />
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileIcon data-icon="inline-start" />
                  Выбрать файлы
                </Button>
                {selectedFiles.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {selectedFiles.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-1.5 text-sm"
                      >
                        <span className="truncate font-mono">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Убрать файл ${file.name}`}
                        >
                          <XIcon className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <FieldDescription>
                Файлы будут сохранены в public/tasks с уникальным ID в имени.
              </FieldDescription>
            </Field>
            <Field>
              <Button type="submit" disabled={loading}>
                {loading && <Spinner data-icon="inline-start" />}
                Создать таск
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
