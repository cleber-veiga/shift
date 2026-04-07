"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Spinner } from "@/components/ui/spinner"
import { Plus, ArrowRight, Download, Trash2, ChevronDown, Mail, Settings } from "lucide-react"

export function ButtonsSection() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Buttons</h1>
        <p className="max-w-2xl text-muted-foreground">
          Interactive elements for triggering actions. Buttons come in various 
          styles and sizes to suit different contexts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>
            Different visual styles for various purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sizes</CardTitle>
          <CardDescription>
            Multiple sizes for different contexts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>With Icons</CardTitle>
          <CardDescription>
            Buttons can include icons for visual clarity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button>
              <Plus /> New Item
            </Button>
            <Button variant="secondary">
              <Download /> Download
            </Button>
            <Button variant="outline">
              Continue <ArrowRight />
            </Button>
            <Button variant="destructive">
              <Trash2 /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Icon Only</CardTitle>
          <CardDescription>
            Compact buttons for toolbar and dense UIs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="icon-sm" variant="outline">
              <Plus />
            </Button>
            <Button size="icon" variant="outline">
              <Settings />
            </Button>
            <Button size="icon-lg" variant="outline">
              <Mail />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Button Groups</CardTitle>
          <CardDescription>
            Group related actions together
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ButtonGroup>
            <Button variant="outline">Left</Button>
            <Button variant="outline">Center</Button>
            <Button variant="outline">Right</Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button variant="secondary">
              <Mail /> Email
            </Button>
            <Button variant="secondary" size="icon">
              <ChevronDown />
            </Button>
          </ButtonGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>States</CardTitle>
          <CardDescription>
            Different button states for user feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button>Normal</Button>
            <Button disabled>Disabled</Button>
            <Button disabled>
              <Spinner className="size-4" />
              Loading
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>
            How to use buttons in your code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4 font-mono text-sm">
            <pre className="text-foreground">
              <code>{`import { Button } from "@/components/ui/button"

// Basic usage
<Button>Click me</Button>

// With variant and size
<Button variant="outline" size="lg">
  Large Outline
</Button>

// With icon
<Button>
  <Plus /> Add Item
</Button>

// Icon only
<Button size="icon" variant="ghost">
  <Settings />
</Button>`}</code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
