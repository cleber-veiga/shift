import {
  Palette,
  Type,
  LayoutGrid,
  Component,
  Paintbrush,
  Accessibility,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: Palette,
    title: "Colors",
    description: "A high contrast, accessible color system designed for dark mode.",
  },
  {
    icon: Type,
    title: "Typography",
    description: "Geist Sans & Mono - specifically designed for developers.",
  },
  {
    icon: Component,
    title: "Components",
    description: "Building blocks for React applications.",
  },
  {
    icon: LayoutGrid,
    title: "Grid System",
    description: "Flexible layout primitives for any screen size.",
  },
  {
    icon: Paintbrush,
    title: "Theming",
    description: "CSS variables for easy customization.",
  },
  {
    icon: Accessibility,
    title: "Accessible",
    description: "WCAG 2.1 compliant components out of the box.",
  },
]

export function IntroSection() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-balance lg:text-5xl">
          Acme Design System
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground text-pretty">
          A comprehensive design system for building consistent SaaS experiences.
          Built with accessibility and developer experience in mind.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="group transition-colors hover:border-foreground/20">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-md bg-accent mb-2">
                <feature.icon className="size-5 text-foreground" />
              </div>
              <CardTitle className="text-base">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Quick Start</h2>
        <div className="rounded-md bg-muted p-4 font-mono text-sm">
          <pre className="text-foreground">
            <code>{`$ npx shadcn@latest init
$ npx shadcn@latest add button card input`}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}
