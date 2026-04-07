"use client"

import { useEffect, useState } from "react"
import { Search, Command, Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

export function DesignSystemHeader() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-foreground">
              <span className="text-sm font-bold text-background">A</span>
            </div>
            <span className="text-lg font-semibold">Acme Design System</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="hidden w-64 justify-between text-muted-foreground md:flex"
          >
            <div className="flex items-center gap-2">
              <Search className="size-4" />
              <span>Search...</span>
            </div>
            <Kbd className="gap-0.5">
              <Command className="size-3" />K
            </Kbd>
          </Button>

          {mounted && (
            <div className="flex items-center rounded-md border border-border">
              <Button 
                variant="ghost" 
                size="icon-sm" 
                className={cn(
                  "rounded-none rounded-l-md",
                  theme === "light" && "bg-accent"
                )}
                onClick={() => setTheme("light")}
                aria-label="Light mode"
              >
                <Sun className="size-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon-sm" 
                className={cn(
                  "rounded-none border-x border-border",
                  theme === "system" && "bg-accent"
                )}
                onClick={() => setTheme("system")}
                aria-label="System mode"
              >
                <Monitor className="size-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon-sm" 
                className={cn(
                  "rounded-none rounded-r-md",
                  theme === "dark" && "bg-accent"
                )}
                onClick={() => setTheme("dark")}
                aria-label="Dark mode"
              >
                <Moon className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
