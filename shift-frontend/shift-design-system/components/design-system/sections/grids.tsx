import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function GridsSection() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Grids</h1>
        <p className="max-w-2xl text-muted-foreground">
          Flexible layout primitives for building responsive interfaces. 
          Built with CSS Grid and Flexbox for maximum flexibility.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Grid</CardTitle>
          <CardDescription>
            Simple equal-width columns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex h-20 items-center justify-center rounded-lg border border-border bg-muted"
              >
                <span className="text-sm text-muted-foreground">{i}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-md bg-muted p-3 font-mono text-xs">
            <code>{"grid grid-cols-3 gap-4"}</code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responsive Grid</CardTitle>
          <CardDescription>
            Columns that adapt to screen size
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="flex h-20 items-center justify-center rounded-lg border border-border bg-muted"
              >
                <span className="text-sm text-muted-foreground">{i}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-md bg-muted p-3 font-mono text-xs">
            <code>{"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"}</code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auto-fit Grid</CardTitle>
          <CardDescription>
            Automatically fill columns based on minimum width
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex h-20 items-center justify-center rounded-lg border border-border bg-muted"
              >
                <span className="text-sm text-muted-foreground">{i}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-md bg-muted p-3 font-mono text-xs">
            <code>{"grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4"}</code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asymmetric Grid</CardTitle>
          <CardDescription>
            Different column widths for complex layouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 flex h-32 items-center justify-center rounded-lg border border-border bg-muted">
              <span className="text-sm text-muted-foreground">2/3</span>
            </div>
            <div className="flex h-32 items-center justify-center rounded-lg border border-border bg-muted">
              <span className="text-sm text-muted-foreground">1/3</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex h-24 items-center justify-center rounded-lg border border-border bg-muted">
              <span className="text-sm text-muted-foreground">1/4</span>
            </div>
            <div className="col-span-3 flex h-24 items-center justify-center rounded-lg border border-border bg-muted">
              <span className="text-sm text-muted-foreground">3/4</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bento Grid</CardTitle>
          <CardDescription>
            Modern asymmetric layout pattern
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2 row-span-2 flex h-48 items-center justify-center rounded-lg border border-border bg-muted">
              <span className="text-sm text-muted-foreground">Featured</span>
            </div>
            <div className="flex h-[5.5rem] items-center justify-center rounded-lg border border-border bg-muted">
              <span className="text-sm text-muted-foreground">1</span>
            </div>
            <div className="flex h-[5.5rem] items-center justify-center rounded-lg border border-border bg-muted">
              <span className="text-sm text-muted-foreground">2</span>
            </div>
            <div className="col-span-2 flex h-[5.5rem] items-center justify-center rounded-lg border border-border bg-muted">
              <span className="text-sm text-muted-foreground">3</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gap Scale</CardTitle>
          <CardDescription>
            Available spacing between grid items
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { gap: "gap-1", label: "gap-1 (4px)" },
            { gap: "gap-2", label: "gap-2 (8px)" },
            { gap: "gap-4", label: "gap-4 (16px)" },
            { gap: "gap-6", label: "gap-6 (24px)" },
            { gap: "gap-8", label: "gap-8 (32px)" },
          ].map(({ gap, label }) => (
            <div key={gap}>
              <p className="mb-2 text-xs text-muted-foreground">{label}</p>
              <div className={`grid grid-cols-4 ${gap}`}>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex h-12 items-center justify-center rounded bg-accent"
                  >
                    <span className="text-xs text-muted-foreground">{i}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flexbox Layouts</CardTitle>
          <CardDescription>
            Common flexbox patterns for alignment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">justify-between</p>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="size-10 rounded bg-accent" />
              <div className="size-10 rounded bg-accent" />
              <div className="size-10 rounded bg-accent" />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-muted-foreground">justify-center</p>
            <div className="flex items-center justify-center gap-4 rounded-lg border border-border p-4">
              <div className="size-10 rounded bg-accent" />
              <div className="size-10 rounded bg-accent" />
              <div className="size-10 rounded bg-accent" />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-muted-foreground">flex-col items-center</p>
            <div className="flex flex-col items-center gap-2 rounded-lg border border-border p-4">
              <div className="h-8 w-24 rounded bg-accent" />
              <div className="h-8 w-32 rounded bg-accent" />
              <div className="h-8 w-20 rounded bg-accent" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
