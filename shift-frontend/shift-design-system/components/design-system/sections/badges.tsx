import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, AlertTriangle, Info, Clock, Zap, Star, Crown } from "lucide-react"

export function BadgesSection() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Badges & Tags</h1>
        <p className="max-w-2xl text-muted-foreground">
          Small visual indicators for status, categories, or metadata. 
          Use badges to highlight information or categorize content.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>
            Different badge styles for various contexts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>With Icons</CardTitle>
          <CardDescription>
            Badges can include icons for visual context
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">
              <Check className="size-3" /> Completed
            </Badge>
            <Badge variant="destructive">
              <X className="size-3" /> Failed
            </Badge>
            <Badge variant="secondary">
              <Clock className="size-3" /> Pending
            </Badge>
            <Badge variant="outline">
              <Info className="size-3" /> Info
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Badges</CardTitle>
          <CardDescription>
            Common patterns for indicating status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Workflow Status</p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-success text-success-foreground hover:bg-success/90">Active</Badge>
                <Badge className="bg-warning text-warning-foreground hover:bg-warning/90">In Review</Badge>
                <Badge className="bg-info text-info-foreground hover:bg-info/90">Draft</Badge>
                <Badge className="bg-muted text-muted-foreground hover:bg-muted/90">Archived</Badge>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Priority Levels</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="destructive">
                  <AlertTriangle className="size-3" /> Critical
                </Badge>
                <Badge className="bg-warning text-warning-foreground hover:bg-warning/90">High</Badge>
                <Badge variant="secondary">Medium</Badge>
                <Badge variant="outline">Low</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature Tags</CardTitle>
          <CardDescription>
            Highlight features or capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              <Zap className="size-3" /> Fast
            </Badge>
            <Badge variant="outline">
              <Star className="size-3" /> Popular
            </Badge>
            <Badge variant="outline">
              <Crown className="size-3" /> Premium
            </Badge>
            <Badge variant="default">New</Badge>
            <Badge variant="secondary">Beta</Badge>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pill Badges</CardTitle>
          <CardDescription>
            Rounded badges for tags and categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge className="rounded-full">Design</Badge>
            <Badge className="rounded-full" variant="secondary">Development</Badge>
            <Badge className="rounded-full" variant="outline">Marketing</Badge>
            <Badge className="rounded-full" variant="secondary">Product</Badge>
            <Badge className="rounded-full" variant="outline">Engineering</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Badge Groups</CardTitle>
          <CardDescription>
            Combining multiple badges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Tags:</span>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">React</Badge>
                <Badge variant="secondary" className="text-xs">TypeScript</Badge>
                <Badge variant="secondary" className="text-xs">Tailwind</Badge>
                <Badge variant="secondary" className="text-xs">Next.js</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Skills:</span>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">Frontend</Badge>
                <Badge variant="outline" className="text-xs">Backend</Badge>
                <Badge variant="outline" className="text-xs">DevOps</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>In Context</CardTitle>
          <CardDescription>
            Examples of badges used in common UI patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Premium Plan</p>
                  <Badge>Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground">$29/month</p>
              </div>
              <Badge variant="secondary">Most Popular</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Feature Request #142</p>
                  <Badge variant="outline">Open</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Created 2 days ago</p>
              </div>
              <Badge className="bg-warning text-warning-foreground">High Priority</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
