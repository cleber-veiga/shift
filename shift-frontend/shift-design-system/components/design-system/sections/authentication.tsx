"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Github, Mail, Chrome, Apple, Lock, User, ArrowRight, KeyRound, Smartphone } from "lucide-react"

export function AuthenticationSection() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Authentication</h1>
        <p className="mt-2 text-muted-foreground">
          Pre-built authentication forms and flows for your SaaS application.
        </p>
      </div>

      {/* Login Forms */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Login Forms</h2>
          <p className="text-sm text-muted-foreground">Different login form variations</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Simple Login */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-1">Email</Label>
                <Input id="email-1" type="email" placeholder="name@example.com" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password-1">Password</Label>
                  <button className="text-sm text-muted-foreground hover:text-foreground">
                    Forgot password?
                  </button>
                </div>
                <Input id="password-1" type="password" placeholder="Enter your password" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="remember-1" />
                <Label htmlFor="remember-1" className="text-sm font-normal">
                  Remember me for 30 days
                </Label>
              </div>
              <Button className="w-full">Sign in</Button>
            </CardContent>
            <CardFooter className="justify-center">
              <p className="text-sm text-muted-foreground">
                {"Don't have an account? "}
                <button className="font-medium text-foreground hover:underline">Sign up</button>
              </p>
            </CardFooter>
          </Card>

          {/* Login with Social */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Sign in</CardTitle>
              <CardDescription>Choose your preferred sign in method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="w-full">
                  <Github className="size-4" />
                </Button>
                <Button variant="outline" className="w-full">
                  <Chrome className="size-4" />
                </Button>
                <Button variant="outline" className="w-full">
                  <Apple className="size-4" />
                </Button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-2">Email</Label>
                <Input id="email-2" type="email" placeholder="name@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-2">Password</Label>
                <Input id="password-2" type="password" />
              </div>
              <Button className="w-full">Sign in with Email</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Registration Forms */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Registration Forms</h2>
          <p className="text-sm text-muted-foreground">User signup and onboarding forms</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Simple Registration */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Create an account</CardTitle>
              <CardDescription>Enter your details to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input id="first-name" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input id="last-name" placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-3">Email</Label>
                <Input id="email-3" type="email" placeholder="name@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-3">Password</Label>
                <Input id="password-3" type="password" placeholder="Create a strong password" />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox id="terms" className="mt-0.5" />
                <Label htmlFor="terms" className="text-sm font-normal leading-tight">
                  I agree to the{" "}
                  <button className="underline hover:text-foreground">Terms of Service</button>
                  {" and "}
                  <button className="underline hover:text-foreground">Privacy Policy</button>
                </Label>
              </div>
              <Button className="w-full">Create account</Button>
            </CardContent>
            <CardFooter className="justify-center">
              <p className="text-sm text-muted-foreground">
                {"Already have an account? "}
                <button className="font-medium text-foreground hover:underline">Sign in</button>
              </p>
            </CardFooter>
          </Card>

          {/* Registration with Steps */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-xs font-medium text-background">
                  1
                </span>
                <span className="h-px flex-1 bg-border"></span>
                <span className="flex size-6 items-center justify-center rounded-full border border-border text-xs">
                  2
                </span>
                <span className="h-px flex-1 bg-border"></span>
                <span className="flex size-6 items-center justify-center rounded-full border border-border text-xs">
                  3
                </span>
              </div>
              <CardTitle className="mt-4">Account details</CardTitle>
              <CardDescription>Step 1 of 3 - Basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                    acme.io/
                  </span>
                  <Input id="username" className="rounded-l-none" placeholder="johndoe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-4">Work email</Label>
                <Input id="email-4" type="email" placeholder="john@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company name</Label>
                <Input id="company" placeholder="Acme Inc." />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" disabled>Back</Button>
              <Button>
                Continue
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Password Recovery */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Password Recovery</h2>
          <p className="text-sm text-muted-foreground">Forgot password and reset flows</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Forgot Password */}
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <Mail className="size-6 text-muted-foreground" />
              </div>
              <CardTitle>Forgot password?</CardTitle>
              <CardDescription>
                {"No worries, we'll send you reset instructions."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-5">Email</Label>
                <Input id="email-5" type="email" placeholder="name@example.com" />
              </div>
              <Button className="w-full">Send reset link</Button>
            </CardContent>
            <CardFooter className="justify-center">
              <button className="text-sm text-muted-foreground hover:text-foreground">
                Back to sign in
              </button>
            </CardFooter>
          </Card>

          {/* Check Email */}
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-success/10">
                <Mail className="size-6 text-success" />
              </div>
              <CardTitle>Check your email</CardTitle>
              <CardDescription>
                We sent a password reset link to
                <br />
                <span className="font-medium text-foreground">john@example.com</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" variant="outline">
                Open email app
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {"Didn't receive the email? "}
                <button className="font-medium text-foreground hover:underline">
                  Click to resend
                </button>
              </p>
            </CardContent>
            <CardFooter className="justify-center">
              <button className="text-sm text-muted-foreground hover:text-foreground">
                Back to sign in
              </button>
            </CardFooter>
          </Card>

          {/* Reset Password */}
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <Lock className="size-6 text-muted-foreground" />
              </div>
              <CardTitle>Set new password</CardTitle>
              <CardDescription>
                Must be at least 8 characters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button className="w-full">Reset password</Button>
            </CardContent>
            <CardFooter className="justify-center">
              <button className="text-sm text-muted-foreground hover:text-foreground">
                Back to sign in
              </button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Two-Factor Authentication */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
          <p className="text-sm text-muted-foreground">MFA and verification flows</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* OTP Input */}
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <Smartphone className="size-6 text-muted-foreground" />
              </div>
              <CardTitle>Enter verification code</CardTitle>
              <CardDescription>
                {"We've sent a 6-digit code to your phone ending in ****1234"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Input
                    key={i}
                    className="size-12 text-center text-lg font-semibold"
                    maxLength={1}
                    placeholder="-"
                  />
                ))}
              </div>
              <Button className="w-full">Verify</Button>
              <p className="text-center text-sm text-muted-foreground">
                {"Didn't receive code? "}
                <button className="font-medium text-foreground hover:underline">
                  Resend
                </button>
              </p>
            </CardContent>
          </Card>

          {/* Authenticator App */}
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <KeyRound className="size-6 text-muted-foreground" />
              </div>
              <CardTitle>Authenticator app</CardTitle>
              <CardDescription>
                Enter the code from your authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-dashed border-border bg-muted/50 p-4">
                <div className="mx-auto size-32 rounded-lg bg-foreground/10" />
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Scan this QR code with your authenticator app
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-code">Or enter code manually</Label>
                <Input id="auth-code" placeholder="Enter 6-digit code" />
              </div>
              <Button className="w-full">Enable 2FA</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Magic Link */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Passwordless Authentication</h2>
          <p className="text-sm text-muted-foreground">Magic link and passkey options</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Sign in with magic link</CardTitle>
              <CardDescription>
                {"We'll email you a magic link for a password-free sign in"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-magic">Email address</Label>
                <Input id="email-magic" type="email" placeholder="name@example.com" />
              </div>
              <Button className="w-full">
                <Mail className="mr-2 size-4" />
                Send magic link
              </Button>
            </CardContent>
            <CardFooter>
              <div className="w-full space-y-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Sign in with password
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <User className="size-6 text-muted-foreground" />
              </div>
              <CardTitle>Welcome back, John</CardTitle>
              <CardDescription>
                Sign in to continue to your workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <User className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">john@example.com</p>
                  <p className="text-xs text-muted-foreground">Personal account</p>
                </div>
                <Button size="sm">Continue</Button>
              </div>
              <Button variant="outline" className="w-full">
                Use a different account
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
