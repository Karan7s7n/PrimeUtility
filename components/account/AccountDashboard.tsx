"use client";

import { BarChart3, History, Loader2, LogOut, RefreshCw, ShieldCheck, Trash2, UserCog, Zap } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Notice, Stat } from "@/components/tools/ui";
import { dictionaries } from "@/lib/i18n";
import { planCopy } from "@/lib/plans";
import { refreshSession, signOut, useSession } from "@/lib/session";
import type { Locale } from "@/lib/site";
import { formatBytes } from "@/lib/utils";
import { href } from "@/lib/urls";

interface RunItem {
  id: number;
  toolSlug: string;
  inputSize: number;
  outputSize: number;
  durationMs: number;
  status: string;
  createdAt: string;
}

type Tab = "overview" | "history" | "profile" | "security";

export function AccountDashboard({
  locale,
  toolNames,
}: {
  locale: Locale;
  toolNames: Record<string, string>;
}) {
  const dict = dictionaries[locale];
  const auth = dict.auth;
  const labels = dict.account;
  const session = useSession();
  const [tab, setTab] = useState<Tab>("overview");
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);

  const loadRuns = useCallback(async () => {
    setLoadingRuns(true);
    try {
      const response = await fetch("/api/history/?limit=50", { cache: "no-store" });
      const data = (await response.json()) as { runs?: RunItem[] };
      setRuns(data.runs ?? []);
    } catch {
      setRuns([]);
    } finally {
      setLoadingRuns(false);
    }
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const removeRun = async (id: number) => {
    await fetch(`/api/history/?id=${id}`, { method: "DELETE" });
    setRuns((prev) => prev.filter((run) => run.id !== id));
    void refreshSession();
  };

  const clearHistory = async () => {
    if (!window.confirm(labels.clearConfirm)) return;
    await fetch("/api/history/", { method: "DELETE" });
    setRuns([]);
    void refreshSession();
  };

  const usage = session.usage;
  const user = session.user;
  const plan = usage?.plan ?? (user ? "free" : "guest");
  const maxToolRuns = Math.max(1, ...(usage?.byTool.map((entry) => entry.runs) ?? [1]));

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const tabs: { id: Tab; label: string; icon: typeof BarChart3; authed: boolean }[] = [
    { id: "overview", label: labels.plan, icon: BarChart3, authed: false },
    { id: "history", label: labels.history, icon: History, authed: false },
    { id: "profile", label: labels.profile, icon: UserCog, authed: true },
    { id: "security", label: labels.security, icon: ShieldCheck, authed: true },
  ];

  return (
    <div className="container-x py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {user ? `${labels.greeting} ${user.name}` : labels.guestTitle}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {user ? user.email : session.status === "loading" ? "…" : labels.guestNote}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={href(locale, "tools")} className="btn-secondary btn-sm">
            <Zap className="size-3.5" />
            {dict.nav.tools}
          </Link>
          {user && (user.role === "admin" || user.role === "super_admin") && (
            <Link href={href(locale, "admin")} className="btn-secondary btn-sm">
              <ShieldCheck className="size-3.5" />
              {dict.nav.admin}
            </Link>
          )}
          {user ? (
            <button type="button" className="btn-ghost btn-sm" onClick={() => void signOut()}>
              <LogOut className="size-3.5" />
              {auth.signOut}
            </button>
          ) : (
            <Link href={href(locale, "register")} className="btn-primary btn-sm">
              {auth.signUp}
            </Link>
          )}
        </div>
      </header>

      {session.database === false && (
        <div className="mt-5">
          <Notice tone="warn">{auth.databaseOff}</Notice>
        </div>
      )}

      {session.status === "error" && (
        <div className="mt-5">
          <Notice tone="warn">
            <p>{labels.loadError}</p>
            <button type="button" className="btn-ghost btn-sm mt-2" onClick={() => void refreshSession()}>
              <RefreshCw className="size-3.5" />
              {labels.retry}
            </button>
          </Notice>
        </div>
      )}

      {usage && usage.remaining === 0 && (
        <div className="mt-5">
          <Notice tone="warn">
            <p className="font-semibold">{labels.limitReached.replace("{limit}", String(usage.dailyLimit))}</p>
            <p className="mt-1 text-[13px]">{labels.limitReachedHint}</p>
          </Notice>
        </div>
      )}

      <nav className="mt-6 flex flex-wrap gap-1.5" aria-label={labels.title}>
        {tabs
          .filter((entry) => !entry.authed || user)
          .map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={`btn-sm btn ${
                tab === entry.id
                  ? "bg-white text-brand-700 shadow-sm dark:bg-white/15 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
              aria-current={tab === entry.id}
            >
              <entry.icon className="size-3.5" />
              {entry.label}
            </button>
          ))}
      </nav>

      {tab === "overview" && (
        <section className="mt-6 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={labels.plan} value={planCopy(plan, locale)} tone="brand" />
            <Stat
              label={labels.usedToday}
              value={usage ? `${usage.usedToday} / ${usage.dailyLimit}` : "—"}
            />
            <Stat
              label={labels.remainingToday}
              value={usage ? usage.remaining : "—"}
              tone={usage && usage.remaining > 0 ? "good" : "bad"}
            />
            <Stat label={labels.totalRuns} value={usage ? usage.totalRuns : "—"} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label={labels.savedBytes} value={usage ? formatBytes(usage.bytesSaved) : "—"} tone="good" />
            <Stat label={dict.nav.pricing} value={plan === "guest" || plan === "free" ? dict.card.free : planCopy(plan, locale)} />
          </div>

          <div className="panel">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{labels.byTool}</h2>
            {usage && usage.byTool.length > 0 ? (
              <ul className="mt-3 space-y-2.5">
                {usage.byTool.map((entry) => (
                  <li key={entry.toolSlug}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <Link href={href(locale, `tools/${entry.toolSlug}`)} className="link">
                        {toolNames[entry.toolSlug] ?? entry.toolSlug}
                      </Link>
                      <span className="text-slate-500 tabular-nums dark:text-slate-400">
                        {entry.runs} {labels.runs}
                        {entry.savedBytes > 0 && ` · ${formatBytes(entry.savedBytes)}`}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                        style={{ width: `${Math.max(6, (entry.runs / maxToolRuns) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{labels.noUsageYet}</p>
            )}
          </div>
        </section>
      )}

      {tab === "history" && (
        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{labels.history}</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{labels.historyHint}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary btn-sm" onClick={() => void loadRuns()} disabled={loadingRuns}>
                {loadingRuns ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                {labels.refresh}
              </button>
              {runs.length > 0 && (
                <button type="button" className="btn-ghost btn-sm" onClick={() => void clearHistory()}>
                  <Trash2 className="size-3.5" />
                  {labels.clearHistory}
                </button>
              )}
            </div>
          </div>

          {runs.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{labels.historyEmpty}</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {runs.map((run) => {
                const saved = run.inputSize - run.outputSize;
                return (
                  <li key={run.id} className="panel flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {toolNames[run.toolSlug] ?? run.toolSlug}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(run.createdAt)}
                        {run.inputSize > 0 && ` · ${formatBytes(run.inputSize)}`}
                        {run.outputSize > 0 && ` → ${formatBytes(run.outputSize)}`}
                        {saved > 0 && ` · −${formatBytes(saved)}`}
                        {run.durationMs > 0 && ` · ${(run.durationMs / 1000).toFixed(1)}s`}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      onClick={() => void removeRun(run.id)}
                      aria-label={labels.remove}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {tab === "profile" && user && <ProfileForm locale={locale} />}
      {tab === "security" && user && <SecurityForm locale={locale} />}
    </div>
  );
}

function ProfileForm({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale];
  const labels = dict.account;
  const auth = dict.auth;
  const { user } = useSession();
  const [name, setName] = useState(user?.name ?? "");
  
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/auth/profile/", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name}),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(auth.errors[data.error ?? ""] ?? auth.errors.generic);
        return;
      }
      await refreshSession();
      setMessage(labels.updated);
    } catch {
      setError(auth.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-6 max-w-lg">
      <form className="panel space-y-4" onSubmit={submit}>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{labels.profile}</h2>
        <div>
          <label className="label" htmlFor="profile-name">
            {auth.name}
          </label>
          <input id="profile-name" className="input" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="profile-email">
            {auth.email}
          </label>
          <input id="profile-email" className="input" dir="ltr" value={user?.email ?? ""} disabled />
        </div>
        
        {message && <Notice tone="success">{message}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {busy ? auth.submitWorking : labels.save}
        </button>
      </form>
    </section>
  );
}

function SecurityForm({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale];
  const labels = dict.account;
  const auth = dict.auth;
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/auth/password/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(auth.errors[data.error ?? ""] ?? auth.errors.generic);
        return;
      }
      setCurrent("");
      setNext("");
      setMessage(labels.updated);
    } catch {
      setError(auth.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-6 max-w-lg">
      <form className="panel space-y-4" onSubmit={submit}>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{labels.changePassword}</h2>
        <div>
          <label className="label" htmlFor="current-password">
            {auth.currentPassword}
          </label>
          <input
            id="current-password"
            type="password"
            dir="ltr"
            className="input"
            autoComplete="current-password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="new-password">
            {auth.newPassword}
          </label>
          <input
            id="new-password"
            type="password"
            dir="ltr"
            className="input"
            autoComplete="new-password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{auth.passwordHint}</p>
        </div>
        {message && <Notice tone="success">{message}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {busy ? auth.submitWorking : labels.changePassword}
        </button>
      </form>
    </section>
  );
}
