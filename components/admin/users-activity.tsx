"use client"

import { useState } from "react"
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { CATEGORY_LABELS, type CategoryValue } from "@/app/lib/categories"
import type { AdminUser } from "@/components/admin/admin-panel"

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function UsersActivity({ users }: { users: AdminUser[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (users.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Нет пользователей</EmptyTitle>
          <EmptyDescription>Пока никто не зарегистрировался.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {users.map((user) => {
        const isOpen = openId === user.id
        return (
          <Card key={user.id}>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpenId(isOpen ? null : user.id)}
                  aria-expanded={isOpen}
                >
                  {isOpen ? (
                    <ChevronDownIcon data-icon="inline-start" />
                  ) : (
                    <ChevronRightIcon data-icon="inline-start" />
                  )}
                  <span className="font-mono">{user.username}</span>
                </Button>
                {user.role === "ADMIN" && <Badge>ADMIN</Badge>}
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <div className="ms-auto flex items-center gap-2">
                  <Badge variant="secondary">
                    {"Решено: "}
                    {user.solves.length}
                  </Badge>
                  <Badge variant="outline">
                    {"Попыток: "}
                    {user._count.attempts}
                  </Badge>
                </div>
              </div>
              {isOpen && (
                <>
                  <Separator className="my-3" />
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">
                      {"Регистрация: "}
                      {formatDate(user.createdAt)}
                    </p>
                    {user.solves.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Нет решённых тасков.
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {user.solves.map((solve) => (
                          <li
                            key={solve.id}
                            className="flex flex-wrap items-center gap-2 text-sm"
                          >
                            <Badge variant="secondary">
                              {CATEGORY_LABELS[solve.task.category as CategoryValue] ??
                                solve.task.category}
                            </Badge>
                            <span className="font-mono text-foreground">
                              {solve.task.title}
                            </span>
                            <span className="text-muted-foreground">
                              {formatDate(solve.createdAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
