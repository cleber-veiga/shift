import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

const semanticColors = [
  { name: "Background", variable: "--background", class: "bg-background" },
  { name: "Foreground", variable: "--foreground", class: "bg-foreground" },
  { name: "Card", variable: "--card", class: "bg-card" },
  { name: "Primary", variable: "--primary", class: "bg-primary" },
  { name: "Secondary", variable: "--secondary", class: "bg-secondary" },
  { name: "Muted", variable: "--muted", class: "bg-muted" },
  { name: "Accent", variable: "--accent", class: "bg-accent" },
  { name: "Destructive", variable: "--destructive", class: "bg-destructive" },
  { name: "Border", variable: "--border", class: "bg-border" },
  { name: "Input", variable: "--input", class: "bg-input" },
]

const chartColors = [
  { name: "Chart 1", class: "bg-chart-1" },
  { name: "Chart 2", class: "bg-chart-2" },
  { name: "Chart 3", class: "bg-chart-3" },
  { name: "Chart 4", class: "bg-chart-4" },
  { name: "Chart 5", class: "bg-chart-5" },
]

const statusColors = [
  { name: "Success", class: "bg-success" },
  { name: "Warning", class: "bg-warning" },
  { name: "Info", class: "bg-info" },
  { name: "Destructive", class: "bg-destructive" },
]

export function ColorsSection() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Colors</h1>
        <p className="max-w-2xl text-muted-foreground">
          A high contrast, accessible color system. All colors are defined as CSS 
          variables using OKLCH color space for better perceptual uniformity.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme Comparison</CardTitle>
          <CardDescription>
            Side by side comparison of light and dark themes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Light Theme Preview */}
            <div className="overflow-hidden rounded-lg border border-neutral-200">
              <div className="bg-neutral-100 px-4 py-2">
                <span className="text-sm font-medium text-neutral-900">Light Theme</span>
              </div>
              <div className="bg-[#fafafa] p-4">
                <div className="rounded-lg border border-neutral-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-semibold text-neutral-900">Card Title</h4>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">Badge</span>
                  </div>
                  <p className="mb-4 text-sm text-neutral-500">
                    This is how content looks in light mode with proper contrast.
                  </p>
                  <div className="flex gap-2">
                    <button className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white">
                      Primary
                    </button>
                    <button className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-900">
                      Secondary
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                      <Check className="size-4" /> Success
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <X className="size-4" /> Error
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dark Theme Preview */}
            <div className="overflow-hidden rounded-lg border border-neutral-800">
              <div className="bg-neutral-900 px-4 py-2">
                <span className="text-sm font-medium text-neutral-100">Dark Theme</span>
              </div>
              <div className="bg-[#0a0a0a] p-4">
                <div className="rounded-lg border border-neutral-800 bg-[#171717] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-semibold text-neutral-100">Card Title</h4>
                    <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">Badge</span>
                  </div>
                  <p className="mb-4 text-sm text-neutral-400">
                    This is how content looks in dark mode with proper contrast.
                  </p>
                  <div className="flex gap-2">
                    <button className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-neutral-900">
                      Primary
                    </button>
                    <button className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm font-medium text-neutral-100">
                      Secondary
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-green-500">
                      <Check className="size-4" /> Success
                    </span>
                    <span className="flex items-center gap-1 text-red-500">
                      <X className="size-4" /> Error
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Semantic Colors</CardTitle>
          <CardDescription>
            Core colors used throughout the interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {semanticColors.map((color) => (
              <div key={color.name} className="space-y-2">
                <div
                  className={`aspect-square rounded-lg border border-border ${color.class}`}
                />
                <div>
                  <p className="text-sm font-medium">{color.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {color.variable}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chart Colors</CardTitle>
          <CardDescription>
            Colors optimized for data visualization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {chartColors.map((color) => (
              <div key={color.name} className="flex-1 space-y-2">
                <div
                  className={`h-24 rounded-lg ${color.class}`}
                />
                <p className="text-center text-xs text-muted-foreground">
                  {color.name}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Colors</CardTitle>
          <CardDescription>
            Colors for indicating state and feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {statusColors.map((color) => (
              <div key={color.name} className="space-y-2">
                <div
                  className={`h-16 rounded-lg ${color.class}`}
                />
                <p className="text-center text-sm font-medium">{color.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>
            How to use colors in your components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4 font-mono text-sm">
            <pre className="text-foreground">
              <code>{`// Using Tailwind classes
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Click me
  </button>
</div>

// Using CSS variables
.custom-element {
  background-color: var(--primary);
  color: var(--primary-foreground);
}`}</code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
