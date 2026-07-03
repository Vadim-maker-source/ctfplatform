"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsersActivity } from "@/components/admin/users-activity"
import { AttemptsTable } from "@/components/admin/attempts-table"
import { CreateTaskForm } from "@/components/admin/create-task-form"

export interface AdminUser {
  id: string
  name: string
  username: string
  email: string
  role: string
  createdAt: string
  solves: {
    id: number
    createdAt: string
    task: { id: string; title: string; category: string }
  }[]
  _count: { attempts: number }
}

export interface AdminAttempt {
  id: number
  flag: string
  correct: boolean
  createdAt: string
  user: { id: string; username: string }
  task: { id: string; title: string; category: string }
}

export function AdminPanel({
  users,
  attempts,
}: {
  users: AdminUser[]
  attempts: AdminAttempt[]
}) {
  return (
    <Tabs defaultValue="users">
      <TabsList>
        <TabsTrigger value="users">Пользователи</TabsTrigger>
        <TabsTrigger value="attempts">Попытки</TabsTrigger>
        <TabsTrigger value="create">Добавить таск</TabsTrigger>
      </TabsList>
      <TabsContent value="users">
        <UsersActivity users={users} />
      </TabsContent>
      <TabsContent value="attempts">
        <AttemptsTable attempts={attempts} />
      </TabsContent>
      <TabsContent value="create">
        <CreateTaskForm />
      </TabsContent>
    </Tabs>
  )
}
