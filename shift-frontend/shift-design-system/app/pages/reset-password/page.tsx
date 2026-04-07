"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, ArrowLeft, Loader2, Mail, KeyRound, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

type Step = "email" | "sent" | "reset" | "done"

export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>("email")
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")

  const handleEmail = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => { setIsLoading(false); setStep("sent") }, 1500)
  }

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => { setIsLoading(false); setStep("done") }, 1500)
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0a]">

      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-white/[0.03] blur-3xl" />

      <div className="relative z-10 w-full max-w-sm px-4">

        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-bold text-white shadow-lg">
            A
          </div>
        </div>

        {/* Step: Email */}
        {step === "email" && (
          <div>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <KeyRound className="size-5 text-neutral-300" />
              </div>
              <h1 className="text-xl font-semibold text-white">Forgot your password?</h1>
              <p className="mt-2 text-sm text-neutral-500">
                No worries. Enter your email and we&apos;ll send you reset instructions.
              </p>
            </div>
            <form onSubmit={handleEmail} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-400">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 outline-none transition-all focus:border-white/30 focus:ring-2 focus:ring-white/10"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
                  "bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200",
                  "disabled:cursor-not-allowed disabled:opacity-60"
                )}
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <><ArrowRight className="size-4" /> Send instructions</>}
              </button>
            </form>
            <div className="mt-6 flex justify-center">
              <Link href="/pages/login" className="flex items-center gap-1.5 text-xs text-neutral-500 transition-colors hover:text-white">
                <ArrowLeft className="size-3.5" /> Back to sign in
              </Link>
            </div>
          </div>
        )}

        {/* Step: Email sent */}
        {step === "sent" && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <Mail className="size-6 text-neutral-300" />
            </div>
            <h1 className="text-xl font-semibold text-white">Check your email</h1>
            <p className="mt-2 text-sm text-neutral-500">
              We sent a password reset link to{" "}
              <span className="font-medium text-neutral-300">{email}</span>
            </p>

            {/* Code inputs for demo */}
            <div className="my-8 flex items-center justify-center gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  className="size-11 rounded-lg border border-white/10 bg-white/5 text-center text-lg font-semibold text-white outline-none transition-all focus:border-white/30 focus:ring-2 focus:ring-white/10"
                />
              ))}
            </div>

            <button
              onClick={() => setStep("reset")}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 transition-all hover:bg-neutral-100"
            >
              Verify code
              <ArrowRight className="size-4" />
            </button>

            <p className="mt-4 text-xs text-neutral-600">
              {"Didn't receive the email? "}
              <button
                onClick={() => setStep("email")}
                className="text-neutral-400 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                Click to resend
              </button>
            </p>
            <div className="mt-4 flex justify-center">
              <Link href="/pages/login" className="flex items-center gap-1.5 text-xs text-neutral-500 transition-colors hover:text-white">
                <ArrowLeft className="size-3.5" /> Back to sign in
              </Link>
            </div>
          </div>
        )}

        {/* Step: New password */}
        {step === "reset" && (
          <div>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <ShieldCheck className="size-5 text-neutral-300" />
              </div>
              <h1 className="text-xl font-semibold text-white">Set new password</h1>
              <p className="mt-2 text-sm text-neutral-500">
                Must be at least 8 characters and include a number and a special character.
              </p>
            </div>
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-400">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 outline-none transition-all focus:border-white/30 focus:ring-2 focus:ring-white/10"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-400">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    "w-full rounded-lg border bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 outline-none transition-all focus:ring-2 focus:ring-white/10",
                    confirm.length > 0 && confirm !== password
                      ? "border-red-500/50 focus:border-red-500/70"
                      : "border-white/10 focus:border-white/30"
                  )}
                  required
                />
                {confirm.length > 0 && confirm !== password && (
                  <p className="mt-1.5 text-xs text-red-400">Passwords do not match</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading || password !== confirm || password.length < 8}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
                  "bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200",
                  "disabled:cursor-not-allowed disabled:opacity-60"
                )}
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <><ShieldCheck className="size-4" /> Reset password</>}
              </button>
            </form>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <ShieldCheck className="size-6 text-emerald-400" />
            </div>
            <h1 className="text-xl font-semibold text-white">Password reset!</h1>
            <p className="mt-2 text-sm text-neutral-500">
              Your password has been successfully reset. Click below to sign in.
            </p>
            <Link
              href="/pages/login"
              className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 transition-all hover:bg-neutral-100"
            >
              Back to sign in
              <ArrowRight className="size-4" />
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
