"use client";

import { FormEvent, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/auth-context";
import {
  Field,
  inputClass,
  PrimaryButton,
  Surface,
} from "@/components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("khaled@physio.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not sign in. Is the API running?";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-stone-900 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center text-white">
          <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
            Physio Vision
          </p>
          <p className="mt-2 text-sm text-teal-100/80">
            Sign in to your clinic and private workspaces
          </p>
        </div>

        <Surface className="p-6 shadow-xl">
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Email">
              <input
                required
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Password">
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </Field>

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <PrimaryButton
              type="submit"
              disabled={submitting}
              className="min-h-12 w-full text-base"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </PrimaryButton>
          </form>
        </Surface>
      </div>
    </div>
  );
}
