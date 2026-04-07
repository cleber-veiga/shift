"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { AlertCircle, CheckCircle2, Info, AlertTriangle, FileQuestion, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

export function FeedbackSection() {
  const [progress, setProgress] = useState(45)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 5))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
        <p className="max-w-2xl text-muted-foreground">
          Components for providing user feedback including alerts, progress 
          indicators, loading states, and empty states.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
          <CardDescription>
            Display important messages to users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="size-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              This is an informational alert with some helpful context.
            </AlertDescription>
          </Alert>
          <Alert className="border-success/50 text-success [&>svg]:text-success">
            <CheckCircle2 className="size-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Your changes have been saved successfully.
            </AlertDescription>
          </Alert>
          <Alert className="border-warning/50 text-warning [&>svg]:text-warning">
            <AlertTriangle className="size-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Your subscription will expire in 3 days.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was a problem processing your request.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <CardDescription>
            Show the completion status of a task
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm">25% Complete</span>
              <Progress value={25} />
            </div>
            <div className="space-y-2">
              <span className="text-sm">50% Complete</span>
              <Progress value={50} />
            </div>
            <div className="space-y-2">
              <span className="text-sm">75% Complete</span>
              <Progress value={75} />
            </div>
            <div className="space-y-2">
              <span className="text-sm">100% Complete</span>
              <Progress value={100} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Loading States</CardTitle>
          <CardDescription>
            Indicate that content is loading
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-4 text-sm text-muted-foreground">Spinners</p>
            <div className="flex items-center gap-4">
              <Spinner className="size-4" />
              <Spinner className="size-6" />
              <Spinner className="size-8" />
              <Button disabled>
                <Loader2 className="size-4 animate-spin" />
                Loading...
              </Button>
            </div>
          </div>
          <div>
            <p className="mb-4 text-sm text-muted-foreground">Skeleton Loaders</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="size-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            </div>
          </div>
          <div>
            <p className="mb-4 text-sm text-muted-foreground">Card Skeleton</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-border p-4">
                  <Skeleton className="mb-4 h-32 w-full" />
                  <Skeleton className="mb-2 h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empty States</CardTitle>
          <CardDescription>
            When there is no content to display
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-border p-8">
            <Empty>
              <EmptyMedia>
                <FileQuestion className="size-10 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                Try adjusting your search or filters to find what you are looking for.
              </EmptyDescription>
              <div className="flex gap-2">
                <Button variant="outline">Clear filters</Button>
                <Button>Create new</Button>
              </div>
            </Empty>
          </div>
          <div className="rounded-lg border border-dashed border-border p-8">
            <Empty>
              <EmptyMedia>
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <svg
                    className="size-8 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
              </EmptyMedia>
              <EmptyTitle>Create your first project</EmptyTitle>
              <EmptyDescription>
                Get started by creating a new project to organize your work.
              </EmptyDescription>
              <Button>
                Create project
              </Button>
            </Empty>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inline Notifications</CardTitle>
          <CardDescription>
            Compact inline status indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm text-success">
              <CheckCircle2 className="size-4" />
              Changes saved successfully
            </div>
            <div className="flex items-center gap-2 rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
              <AlertTriangle className="size-4" />
              Your session will expire in 5 minutes
            </div>
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4" />
              Failed to connect to server
            </div>
            <div className="flex items-center gap-2 rounded-md bg-info/10 px-3 py-2 text-sm text-info">
              <Info className="size-4" />
              New version available
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
