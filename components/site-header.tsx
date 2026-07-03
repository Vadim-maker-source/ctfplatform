"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { FlagIcon, LogOutIcon, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SiteHeader({ username }: { username?: string | null }) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/board" className="flex items-center gap-2 font-mono text-sm font-semibold">
            <FlagIcon className="size-4 text-primary" />
            <span>ctf_platform</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/board"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors hover:text-foreground",
                pathname === "/board" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Таски
            </Link>
            <Link
              href="/leaderboard"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors hover:text-foreground",
                pathname === "/leaderboard" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Лидерборд
            </Link>
            <Link
              href="/profile"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors hover:text-foreground",
                pathname === "/profile" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Профиль
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {username && (
            <Link
              href="/profile"
              className="hidden items-center gap-1.5 font-mono text-sm text-muted-foreground hover:text-foreground sm:flex"
            >
              <UserIcon className="size-4" />
              {username}
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOutIcon data-icon="inline-start" />
            Выйти
          </Button>
        </div>
      </div>
    </header>
  )
}
