"use client"

import { useMemo } from "react"
import { TrophyIcon } from "lucide-react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type LeaderboardEntry = {
  id: string
  username: string
  totalPoints: number
  solveCount: number
  solves: { points: number; solvedAt: string }[]
}

const CHART_COLORS = [
  "var(--chart-1, #10b981)",
  "var(--chart-2, #3b82f6)",
  "var(--chart-3, #f59e0b)",
  "var(--chart-4, #ef4444)",
  "var(--chart-5, #8b5cf6)",
  "var(--chart-6, #14b8a6)",
  "var(--chart-7, #ec4899)",
  "var(--chart-8, #84cc16)",
  "var(--chart-9, #f97316)",
  "var(--chart-10, #06b6d4)",
]

const MAX_CHART_USERS = 10

export function Leaderboard({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[]
  currentUserId: string
}) {
  const chartUsers = useMemo(() => entries.slice(0, MAX_CHART_USERS), [entries])

  const chartData = useMemo(() => {
    // Собираем все события решений топ-пользователей в один таймлайн
    const events: { time: number; username: string; points: number }[] = []
    for (const entry of chartUsers) {
      for (const solve of entry.solves) {
        events.push({
          time: new Date(solve.solvedAt).getTime(),
          username: entry.username,
          points: solve.points,
        })
      }
    }
    events.sort((a, b) => a.time - b.time)

    if (events.length === 0) return []

    const totals: Record<string, number> = {}
    for (const entry of chartUsers) {
      totals[entry.username] = 0
    }

    // Стартовая точка — все с нулём
    const rows: Record<string, number>[] = [
      { time: events[0].time - 1, ...totals },
    ]

    for (const event of events) {
      totals[event.username] += event.points
      rows.push({ time: event.time, ...totals })
    }

    return rows
  }, [chartUsers])

  if (entries.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TrophyIcon />
          </EmptyMedia>
          <EmptyTitle>Пока никто не решил ни одного таска</EmptyTitle>
          <EmptyDescription>
            Лидерборд появится после первых решений.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-base">Прогресс участников</CardTitle>
          <CardDescription>
            Набор поинтов во времени (топ-{Math.min(entries.length, MAX_CHART_USERS)}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  scale="time"
                  tickFormatter={(value: number) =>
                    new Date(value).toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                    })
                  }
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} width={48} />
                <Tooltip
                  labelFormatter={(value) =>
                    new Date(Number(value)).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--popover-foreground)",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                {chartUsers.map((entry, index) => (
                  <Line
                    key={entry.id}
                    type="stepAfter"
                    dataKey={entry.username}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-base">Рейтинг</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Место</TableHead>
                <TableHead>Участник</TableHead>
                <TableHead className="text-right">Решено</TableHead>
                <TableHead className="text-right">Поинты</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, index) => {
                const isCurrentUser = entry.id === currentUserId
                return (
                  <TableRow
                    key={entry.id}
                    className={cn(isCurrentUser && "bg-primary/5")}
                  >
                    <TableCell className="font-mono">
                      {index + 1}
                      {index === 0 && (
                        <TrophyIcon
                          className="ml-1 inline size-3.5 text-primary"
                          aria-label="Первое место"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">{entry.username}</span>
                      {isCurrentUser && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          вы
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">{entry.solveCount}</TableCell>
                    <TableCell className="text-right font-mono text-primary">
                      {entry.totalPoints}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
