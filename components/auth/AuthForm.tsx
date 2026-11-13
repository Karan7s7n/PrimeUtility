"use client";

import { Loader2, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Notice } from "@/components/tools/ui";
import { dictionaries } from "@/lib/i18n";
import { refreshSession, useSession } from "@/lib/session";
import type { Locale } from "@/lib/site";
import { href } from "@/lib/urls";

export function AuthForm({ mode, locale }: { mode: "login" | "register"; locale: Locale }) {
  const dict = dictionaries[locale];
  const labels = dict.auth;
  const router = useRouter();
  const { database } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(isRegister ? "/api/auth/register/" : "/api/auth/login/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(isRegister ? { name, email, password, locale } : { email, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(labels.errors[data.error ?? ""] ?? labels.errors.generic);
        return;
      }
      await refreshSession();
      router.push(href(locale, "account"));
      router.refresh();
    } catch {
      setError(labels.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="surface p-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {isRegister ? labels.registerTitle : labels.loginTitle}
        </h1>
        <p className="mt-2 text-[13.5px] leading-6 text-slate-600 dark:text-slate-400">
          {isRegister ? labels.registerSubtitle : labels.loginSubtitle}
        </p>

        {database === false && (
          <div className="mt-4">
            <Notice tone="warn">{labels.databaseOff}</Notice>
          </div>
        )}

        <form className="mt-5 space-y-4" onSubmit={submit} noValidate>
          {isRegister && (
            <div>
              <label className="label" htmlFor="auth-name">
                {labels.name}
              </label>
              <input
                id="auth-name"
                className="input"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
          )}
          <div>
            <label className="label" htmlFor="auth-email">
              {labels.email}
            </label>
            <input
              id="auth-email"
              type="email"
              dir="ltr"
              className="input"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="auth-password">
              {labels.password}
            </label>
            <input
              id="auth-password"
              type="password"
              dir="ltr"
              className="input"
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {isRegister && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{labels.passwordHint}</p>}
          </div>

          {error && <Notice tone="error">{error}</Notice>}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : isRegister ? <UserPlus className="size-4" /> : <LogIn className="size-4" />}
            {busy ? labels.submitWorking : isRegister ? labels.submitSignUp : labels.submitSignIn}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600 dark:text-slate-400">
          {isRegister ? labels.haveAccount : labels.noAccount}{" "}
          <Link href={href(locale, isRegister ? "login" : "register")} className="link">
            {isRegister ? labels.signIn : labels.signUp}
          </Link>
        </p>
      </div>

      <p className="mt-4 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">{labels.guestNote}</p>
    </div>
  );
}
