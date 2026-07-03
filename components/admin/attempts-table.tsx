"use client"

import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CATEGORY_LABELS, type CategoryValue } from "@/app/lib/categories"
import type { AdminAttempt } from "@/components/admin/admin-panel"

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function AttemptsTable({ attempts }: { attempts: AdminAttempt[] }) {
  if (attempts.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Нет попыток</EmptyTitle>
          <EmptyDescription>Пока никто не сдавал флаги.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Время</TableHead>
            <TableHead>Пользователь</TableHead>
            <TableHead>Таск</TableHead>
            <TableHead>Категория</TableHead>
            <TableHead>Флаг</TableHead>
            <TableHead>Результат</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attempts.map((attempt) => (
            <TableRow key={attempt.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(attempt.createdAt)}
              </TableCell>
              <TableCell className="font-mono">{attempt.user.username}</TableCell>
              <TableCell>{attempt.task.title}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {CATEGORY_LABELS[attempt.task.category as CategoryValue] ??
                    attempt.task.category}
                </Badge>
              </TableCell>
              <TableCell className="max-w-48 truncate font-mono text-muted-foreground">
                {attempt.flag}
              </TableCell>
              <TableCell>
                {attempt.correct ? (
                  <Badge>Верно</Badge>
                ) : (
                  <Badge variant="destructive">Неверно</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
