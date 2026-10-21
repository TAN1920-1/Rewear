"use client"

import { useState, type FormEvent } from "react"
import { KeyRound, Loader2 } from "lucide-react"
import { changeOwnPasswordAction } from "@/lib/actions/auth.actions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY_FORM = { currentPassword: "", newPassword: "", confirmPassword: "" }

/**
 * Self-service password change for the signed-in admin/staff account.
 * The server action derives the target account from the session, so this form
 * can only ever change the caller's own password.
 */
export function ChangePasswordCard() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  function update(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setFeedback(null)

    const result = await changeOwnPasswordAction(form)

    setPending(false)
    if (result?.error) {
      setFeedback({ ok: false, text: result.error })
      return
    }
    setForm(EMPTY_FORM)
    setFeedback({ ok: true, text: "Password updated successfully." })
  }

  return (
    <Card className="glass border-white/50 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <KeyRound className="h-5 w-5 text-amber-600" />
          Account Security
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Change the password for your own account. You must confirm your
          current password first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={(event) => update("currentPassword", event.target.value)}
              className="bg-white/80"
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={form.newPassword}
                onChange={(event) => update("newPassword", event.target.value)}
                className="bg-white/80"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) => update("confirmPassword", event.target.value)}
                className="bg-white/80"
                required
              />
            </div>
          </div>

          {feedback ? (
            <p
              role="status"
              aria-live="polite"
              className={`text-xs ${
                feedback.ok ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {feedback.text}
            </p>
          ) : (
            <p className="text-[11px] text-slate-500">
              Minimum 6 characters. You stay signed in after changing it.
            </p>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="w-full gap-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
