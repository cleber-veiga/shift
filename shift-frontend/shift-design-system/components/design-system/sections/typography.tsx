import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const typographyScale = [
  { name: "Display", class: "text-5xl font-bold", example: "The quick brown fox" },
  { name: "Heading 1", class: "text-4xl font-bold", example: "The quick brown fox" },
  { name: "Heading 2", class: "text-3xl font-semibold", example: "The quick brown fox" },
  { name: "Heading 3", class: "text-2xl font-semibold", example: "The quick brown fox" },
  { name: "Heading 4", class: "text-xl font-semibold", example: "The quick brown fox" },
  { name: "Body Large", class: "text-lg", example: "The quick brown fox jumps over the lazy dog" },
  { name: "Body", class: "text-base", example: "The quick brown fox jumps over the lazy dog" },
  { name: "Body Small", class: "text-sm", example: "The quick brown fox jumps over the lazy dog" },
  { name: "Caption", class: "text-xs", example: "The quick brown fox jumps over the lazy dog" },
]

const fontWeights = [
  { name: "Regular", class: "font-normal", weight: "400" },
  { name: "Medium", class: "font-medium", weight: "500" },
  { name: "Semibold", class: "font-semibold", weight: "600" },
  { name: "Bold", class: "font-bold", weight: "700" },
]

export function TypographySection() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Typography</h1>
        <p className="max-w-2xl text-muted-foreground">
          Built with Geist Sans and Geist Mono - specifically designed for 
          developers and designers. Clean, legible, and modern.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Font Families</CardTitle>
          <CardDescription>
            Two typefaces for different purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 rounded-lg border border-border p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sans Serif
            </p>
            <p className="font-sans text-4xl font-medium">Geist Sans</p>
            <p className="text-muted-foreground">
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
          <div className="space-y-2 rounded-lg border border-border p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Monospace
            </p>
            <p className="font-mono text-4xl font-medium">Geist Mono</p>
            <p className="font-mono text-muted-foreground">
              {"const greeting = 'Hello, World!'"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Type Scale</CardTitle>
          <CardDescription>
            Consistent sizing across the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {typographyScale.map((item) => (
              <div
                key={item.name}
                className="flex flex-col gap-2 border-b border-border pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="w-24 shrink-0 text-sm text-muted-foreground">
                    {item.name}
                  </span>
                  <code className="hidden rounded bg-muted px-2 py-1 font-mono text-xs sm:block">
                    {item.class}
                  </code>
                </div>
                <p className={item.class}>{item.example}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Font Weights</CardTitle>
          <CardDescription>
            Available weights for text styling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {fontWeights.map((weight) => (
              <div key={weight.name} className="space-y-2">
                <p className={`text-3xl ${weight.class}`}>Aa</p>
                <p className="text-sm font-medium">{weight.name}</p>
                <p className="text-xs text-muted-foreground">{weight.weight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Text Utilities</CardTitle>
          <CardDescription>
            Helpful classes for text formatting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
              text-balance
            </code>
            <p className="max-w-md text-balance text-lg font-medium">
              This heading uses text-balance for optimal line breaks in headings and titles.
            </p>
          </div>
          <div className="space-y-2">
            <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
              text-pretty
            </code>
            <p className="max-w-md text-pretty text-muted-foreground">
              This paragraph uses text-pretty to avoid orphans and widows in body text, 
              making the reading experience much better.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
