"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<string>("MISC")
  const [author, setAuthor] = useState("")
  const [flag, setFlag] = useState("")
  const [links, setLinks] = useState("")
  const [files, setFiles] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          author,
          flag,
          links: links.split("\n"),
          files: files.split("\n"),
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
      setLinks("")
      setFiles("")
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
              <Select value={category} onValueChange={setCategory}>
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
              <Textarea
                id="task-files"
                value={files}
                onChange={(e) => setFiles(e.target.value)}
                rows={3}
                placeholder={"https://cdn.example.com/task.zip"}
              />
              <FieldDescription>По одному URL файла на строку.</FieldDescription>
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
