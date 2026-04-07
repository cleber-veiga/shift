"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Field, FieldLabel, FieldDescription, FieldError, FieldGroup, FieldSet, FieldLegend } from "@/components/ui/field"
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group"
import { Mail, Search, DollarSign } from "lucide-react"

export function FormsSection() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Forms</h1>
        <p className="max-w-2xl text-muted-foreground">
          Form elements and input components for collecting user data. 
          All components are accessible and support validation states.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Text Inputs</CardTitle>
          <CardDescription>
            Basic text input variations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="default">Default Input</FieldLabel>
              <Input id="default" placeholder="Enter text..." />
            </Field>
            <Field>
              <FieldLabel htmlFor="disabled">Disabled Input</FieldLabel>
              <Input id="disabled" placeholder="Disabled" disabled />
            </Field>
            <Field>
              <FieldLabel htmlFor="with-description">With Description</FieldLabel>
              <Input id="with-description" placeholder="Enter email..." />
              <FieldDescription>We will never share your email.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="with-error">With Error</FieldLabel>
              <Input id="with-error" placeholder="Invalid input" aria-invalid />
              <FieldError>This field is required.</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Input Groups</CardTitle>
          <CardDescription>
            Inputs with icons and addons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>With Leading Icon</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Search className="size-4" />
                </InputGroupAddon>
                <InputGroupInput placeholder="Search..." />
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel>With Leading Text</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <DollarSign className="size-4" />
                </InputGroupAddon>
                <InputGroupInput type="number" placeholder="0.00" />
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel>Email Input</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Mail className="size-4" />
                </InputGroupAddon>
                <InputGroupInput type="email" placeholder="you@example.com" />
              </InputGroup>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Textarea</CardTitle>
          <CardDescription>
            Multi-line text input
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="message">Message</FieldLabel>
            <Textarea id="message" placeholder="Type your message here..." rows={4} />
            <FieldDescription>Maximum 500 characters.</FieldDescription>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select</CardTitle>
          <CardDescription>
            Dropdown selection component
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Choose a framework</FieldLabel>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="next">Next.js</SelectItem>
                  <SelectItem value="remix">Remix</SelectItem>
                  <SelectItem value="astro">Astro</SelectItem>
                  <SelectItem value="nuxt">Nuxt</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checkboxes</CardTitle>
          <CardDescription>
            Multiple selection options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldSet>
            <FieldLegend>Notifications</FieldLegend>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="email-notif" />
                <Label htmlFor="email-notif">Email notifications</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="sms-notif" />
                <Label htmlFor="sms-notif">SMS notifications</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="push-notif" defaultChecked />
                <Label htmlFor="push-notif">Push notifications</Label>
              </div>
            </div>
          </FieldSet>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Radio Group</CardTitle>
          <CardDescription>
            Single selection from multiple options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldSet>
            <FieldLegend>Select a plan</FieldLegend>
            <RadioGroup defaultValue="pro">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="free" id="free" />
                <Label htmlFor="free">Free</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="pro" id="pro" />
                <Label htmlFor="pro">Pro</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="enterprise" id="enterprise" />
                <Label htmlFor="enterprise">Enterprise</Label>
              </div>
            </RadioGroup>
          </FieldSet>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Switch</CardTitle>
          <CardDescription>
            Toggle between two states
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <Label>Airplane Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Disable all wireless connections
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Use dark theme across the app
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Slider</CardTitle>
          <CardDescription>
            Select a value from a range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel>Volume</FieldLabel>
            <Slider defaultValue={[50]} max={100} step={1} className="w-full" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Complete Form Example</CardTitle>
          <CardDescription>
            A sample form combining multiple elements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="first-name">First name</FieldLabel>
                  <Input id="first-name" placeholder="John" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="last-name">Last name</FieldLabel>
                  <Input id="last-name" placeholder="Doe" />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="email-form">Email</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <Mail className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput id="email-form" type="email" placeholder="john@example.com" />
                </InputGroup>
              </Field>
              <Field>
                <FieldLabel>Role</FieldLabel>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="bio">Bio</FieldLabel>
                <Textarea id="bio" placeholder="Tell us about yourself..." />
              </Field>
            </FieldGroup>
            <div className="flex items-center gap-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms">I agree to the terms and conditions</Label>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline">Cancel</Button>
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
