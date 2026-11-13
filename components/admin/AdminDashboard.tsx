"use client";

import {
  Activity,
  Ban,
  CheckCircle2,
  Gauge,
  Loader2,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Notice, Stat } from "@/components/tools/ui";
import { dictionaries, type Dictionary } from "@/lib/i18n";
import { planCopy, type PlanId } from "@/lib/plans";
import { formatBytes } from "@/lib/utils";
import type { Locale } from "@/lib/site";

interface Overview {
  usersTotal: number;
  usersNew7d: number;
  usersSuspended: number;
  sessionsActive: number;
  usersActive7d: number;
  guests7d: number;
  admins: number;
  runsToday: number;
  runs7d: number;
  runs30d: number;
  runsFailed7d: number;
  runsGuest7d: number;
  avgMs: number;
  bytesSaved: number;
  topTools: { toolSlug: string; runs: number; errors: number; avgMs: number; savedBytes: number }[];
  planBreakdown: { plan: string; users: number }[];
  recentSignups: { id: number; email: string; name: string; role: string; plan: string; status: string; createdAt: string }[];
}

interface AdminUser {
  id: number;
  email: string;
  name: string;
  locale: string;
  role: string;
  plan: string;
  status: string;
  createdAt: string;
  lastSeenAt: string | null;
  lastRunAt: string | null;
  runs7d: number;
  runsTotal: number;
  savedBytes: number;
  sessions: number;
}

interface AdminTool {
  slug: string;
  category: string;
  processing: string;
  isActive: boolean;
  note: string | null;
  runs7d: number;
  runsTotal: number;
  errors: number;
  avgMs: number;
  savedBytes: number;
  lastRunAt: string | null;
}

interface ActivityRun {
  id: number;
  toolSlug: string;
  status: string;
  inputSize: number;
  outputSize: number;
  durationMs: number;
  createdAt: string;
  account: { id: number; email: string; name: string } | null;
  guest: string | null;
}

interface AuditEntry {
  id: number;
  actorEmail: string | null;
  action: string;
  target: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

type Tab = "overview" | "users" | "tools" | "activity" | "audit";

export function AdminDashboard({
  locale,
  toolNames,
  role,
}: {
  locale: Locale;
  toolNames: Record<string, string>;
  role: string;
}) {
  const dict = dictionaries[locale];
  const labels = dict.admin;
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userPages, setUserPages] = useState({ page: 1, pages: 1, total: 0 });
  const [userFilters, setUserFilters] = useState({ q: "", plan: "", role: "", status: "" });
  const [tools, setTools] = useState<AdminTool[]>([]);
  const [runs, setRuns] = useState<ActivityRun[]>([]);
  const [runPages, setRunPages] = useState({ page: 1, pages: 1, total: 0 });
  const [runFilters, setRunFilters] = useState({ tool: "", status: "" });
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  const get = useCallback(async <T,>(url: string): Promise<T | null> => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        setError(response.status === 403 ? labels.noAccess : labels.loadError);
        return null;
      }
      return (await response.json()) as T;
    } catch {
      setError(labels.loadError);
      return null;
    } finally {
      setBusy(false);
    }
  }, [labels.loadError, labels.noAccess]);

  const loadOverview = useCallback(async () => {
    const data = await get<{ overview: Overview }>("/api/admin/overview/");
    if (data) setOverview(data.overview);
  }, [get]);

  const loadUsers = useCallback(
    async (page = 1) => {
      const params = new URLSearchParams({ page: String(page) });
      if (userFilters.q) params.set("q", userFilters.q);
      if (userFilters.plan) params.set("plan", userFilters.plan);
      if (userFilters.role) params.set("role", userFilters.role);
      if (userFilters.status) params.set("status", userFilters.status);
      const data = await get<{ users: AdminUser[]; page: number; pages: number; total: number }>(
        `/api/admin/users/?${params.toString()}`,
      );
      if (data) {
        setUsers(data.users);
        setUserPages({ page: data.page, pages: data.pages, total: data.total });
      }
    },
    [get, userFilters],
  );

  const loadTools = useCallback(async () => {
    const data = await get<{ tools: AdminTool[] }>("/api/admin/tools/");
    if (data) setTools(data.tools);
  }, [get]);

  const loadRuns = useCallback(
    async (page = 1) => {
      const params = new URLSearchParams({ page: String(page) });
      if (runFilters.tool) params.set("tool", runFilters.tool);
      if (runFilters.status) params.set("status", runFilters.status);
      const data = await get<{ runs: ActivityRun[]; page: number; pages: number; total: number }>(
        `/api/admin/activity/?${params.toString()}`,
      );
      if (data) {
        setRuns(data.runs);
        setRunPages({ page: data.page, pages: data.pages, total: data.total });
      }
    },
    [get, runFilters],
  );

  const loadAudit = useCallback(async () => {
    const data = await get<{ entries: AuditEntry[] }>("/api/admin/audit/");
    if (data) setAudit(data.entries);
  }, [get]);

  useEffect(() => {
    if (tab === "overview") void loadOverview();
    if (tab === "users") void loadUsers(1);
    if (tab === "tools") void loadTools();
    if (tab === "activity") void loadRuns(1);
    if (tab === "audit") void loadAudit();
  }, [tab, loadOverview, loadUsers, loadTools, loadRuns, loadAudit]);

  const post = async (url: string, body: unknown) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        const messages = labels.errors as Record<string, string>;
        setError(data.error ? messages[data.error] ?? data.error : labels.loadError);
        return false;
      }
      return true;
    } catch {
      setError(labels.loadError);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const userAction = async (user: AdminUser, action: string, value?: string) => {
    if (action === "delete" && !window.confirm(labels.confirmDelete.replace("{email}", user.email))) return;
    const done = await post("/api/admin/users/", { userId: user.id, action, value });
    // Only the list needs to refresh here; the overview reloads when it is opened.
    if (done) await loadUsers(userPages.page);
  };

  const toggleTool = async (tool: AdminTool, note: string) => {
    const done = await post("/api/admin/tools/", { slug: tool.slug, isActive: !tool.isActive, note });
    if (done) await loadTools();
  };

  const saveNote = async (tool: AdminTool, note: string) => {
    const done = await post("/api/admin/tools/", { slug: tool.slug, isActive: tool.isActive, note });
    if (done) await loadTools();
  };

  const time = (value: string | null) =>
    value ? new Date(value).toLocaleString(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "short", timeStyle: "short" }) : "—";

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: labels.tabs.overview, icon: <Gauge className="size-4" /> },
    { id: "users", label: labels.tabs.users, icon: <Users className="size-4" /> },
    { id: "tools", label: labels.tabs.tools, icon: <Wrench className="size-4" /> },
    { id: "activity", label: labels.tabs.activity, icon: <Activity className="size-4" /> },
    { id: "audit", label: labels.tabs.audit, icon: <ScrollText className="size-4" /> },
  ];

  const pager = (
    state: { page: number; pages: number; total: number },
    onGo: (page: number) => void,
  ) => (
    <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
      <span>
        {labels.page} {state.page} / {state.pages} — {state.total} {labels.rows}
      </span>
      <div className="flex gap-2">
        <button type="button" className="btn-secondary btn-sm" disabled={state.page <= 1 || busy} onClick={() => onGo(state.page - 1)}>
          {labels.previous}
        </button>
        <button type="button" className="btn-secondary btn-sm" disabled={state.page >= state.pages || busy} onClick={() => onGo(state.page + 1)}>
          {labels.next}
        </button>
      </div>
    </div>
  );

  return (
    <div className="container-x py-8 sm:py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="chip">
            <ShieldCheck className="size-3.5 text-brand-600 dark:text-brand-300" />
            {role === "super_admin" ? labels.superAdmin : labels.adminRole}
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            {labels.title}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-7 text-slate-600 dark:text-slate-300">{labels.subtitle}</p>
        </div>
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => (tab === "overview" ? void loadOverview() : tab === "users" ? void loadUsers(userPages.page) : tab === "tools" ? void loadTools() : tab === "activity" ? void loadRuns(runPages.page) : void loadAudit())}
          disabled={busy}
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          {labels.refresh}
        </button>
      </header>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label={labels.title}>
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            className={tab === entry.id ? "chip border-brand-400 bg-brand-50 dark:bg-brand-500/10" : "chip hover:border-brand-400"}
            onClick={() => setTab(entry.id)}
          >
            {entry.icon}
            {entry.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-5">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {tab === "overview" && (
        <section className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={labels.overview.users} value={overview ? String(overview.usersTotal) : "—"} hint={`+${overview?.usersNew7d ?? 0} ${labels.overview.last7}`} />
            <Stat label={labels.overview.active} value={overview ? String(overview.usersActive7d) : "—"} hint={labels.overview.last7} />
            <Stat label={labels.overview.sessions} value={overview ? String(overview.sessionsActive) : "—"} hint={labels.overview.live} />
            <Stat label={labels.overview.runsToday} value={overview ? String(overview.runsToday) : "—"} hint={`${labels.overview.used} ${overview?.runs7d ?? 0}`} />
            <Stat label={labels.overview.runs7d} value={overview ? String(overview.runs7d) : "—"} hint={`${overview?.runs30d ?? 0} / 30`} />
            <Stat label={labels.overview.failures} value={overview ? String(overview.runsFailed7d) : "—"} hint={labels.overview.last7} />
            <Stat label={labels.overview.guests} value={overview ? String(overview.guests7d) : "—"} hint={`${overview?.runsGuest7d ?? 0} ${labels.overview.runs}`} />
            <Stat label={labels.overview.saved} value={overview ? formatBytes(overview.bytesSaved) : "—"} hint={`${labels.overview.avg} ${overview?.avgMs ?? 0} ms`} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="panel">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{labels.overview.topTools}</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{labels.overview.last7}</p>
              <ul className="mt-4 space-y-2">
                {(overview?.topTools ?? []).map((tool) => (
                  <li key={tool.toolSlug} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 px-3 py-2 text-sm dark:border-white/10">
                    <span className="font-medium text-slate-800 dark:text-slate-100">{toolNames[tool.toolSlug] ?? tool.toolSlug}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {tool.runs} {labels.overview.runs} · {tool.errors} {labels.overview.errors} · {tool.avgMs} ms · {formatBytes(tool.savedBytes)}
                    </span>
                  </li>
                ))}
                {(overview?.topTools.length ?? 0) === 0 && <li className="text-sm text-slate-500 dark:text-slate-400">{labels.empty}</li>}
              </ul>
            </div>

            <div className="panel">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{labels.overview.plans}</h2>
              <ul className="mt-4 space-y-2">
                {(overview?.planBreakdown ?? []).map((row) => (
                  <li key={row.plan} className="flex items-center justify-between rounded-xl border border-slate-200/80 px-3 py-2 text-sm dark:border-white/10">
                    <span className="text-slate-700 dark:text-slate-200">{planCopy(row.plan as PlanId, locale) ?? row.plan}</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{row.users}</span>
                  </li>
                ))}
              </ul>

              <h3 className="mt-6 text-sm font-semibold text-slate-800 dark:text-slate-100">{labels.overview.newest}</h3>
              <ul className="mt-3 space-y-2">
                {(overview?.recentSignups ?? []).map((user) => (
                  <li key={user.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="truncate text-slate-700 dark:text-slate-200">{user.email}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{time(user.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {tab === "users" && (
        <section className="mt-6">
          <div className="panel">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                className="input"
                placeholder={labels.users.search}
                aria-label={labels.users.search}
                value={userFilters.q}
                onChange={(event) => setUserFilters((prev) => ({ ...prev, q: event.target.value }))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void loadUsers(1);
                }}
              />
              <select className="input" aria-label={labels.users.plan} value={userFilters.plan} onChange={(event) => setUserFilters((prev) => ({ ...prev, plan: event.target.value }))}>
                <option value="">{labels.users.allPlans}</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="business">Business</option>
              </select>
              <select className="input" aria-label={labels.users.role} value={userFilters.role} onChange={(event) => setUserFilters((prev) => ({ ...prev, role: event.target.value }))}>
                <option value="">{labels.users.allRoles}</option>
                <option value="user">user</option>
                <option value="admin">admin</option>
                <option value="super_admin">super_admin</option>
              </select>
              <select className="input" aria-label={labels.users.status} value={userFilters.status} onChange={(event) => setUserFilters((prev) => ({ ...prev, status: event.target.value }))}>
                <option value="">{labels.users.allStatuses}</option>
                <option value="active">active</option>
                <option value="suspended">suspended</option>
              </select>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn-primary btn-sm" onClick={() => void loadUsers(1)} disabled={busy}>
                {labels.users.apply}
              </button>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => {
                  setUserFilters({ q: "", plan: "", role: "", status: "" });
                  void loadUsers(1);
                }}
                disabled={busy}
              >
                {labels.users.clear}
              </button>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {users.map((user) => (
              <li key={user.id} className="panel">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user.name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={user.status === "active" ? "chip" : "chip border-amber-300 text-amber-700 dark:text-amber-300"}>
                      {user.status === "active" ? <CheckCircle2 className="size-3" /> : <Ban className="size-3" />}
                      {user.status}
                    </span>
                    <span className="chip">{user.role}</span>
                    <span className="chip">{planCopy(user.plan as PlanId, locale) ?? user.plan}</span>
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 sm:grid-cols-4 dark:text-slate-400">
                  <div>
                    <dt className="font-medium">{labels.users.runs7d}</dt>
                    <dd className="tabular-nums text-slate-800 dark:text-slate-100">{user.runs7d}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">{labels.users.runsTotal}</dt>
                    <dd className="tabular-nums text-slate-800 dark:text-slate-100">{user.runsTotal}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">{labels.users.sessions}</dt>
                    <dd className="tabular-nums text-slate-800 dark:text-slate-100">{user.sessions}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">{labels.users.lastRun}</dt>
                    <dd className="text-slate-800 dark:text-slate-100">{time(user.lastRunAt)}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <select
                    className="input !w-auto !py-1.5 text-xs"
                    aria-label={`${labels.users.plan} ${user.email}`}
                    value={user.plan}
                    onChange={(event) => void userAction(user, "set_plan", event.target.value)}
                    disabled={busy}
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                  </select>

                  {role === "super_admin" && (
                    <select
                      className="input !w-auto !py-1.5 text-xs"
                      aria-label={`${labels.users.role} ${user.email}`}
                      value={user.role}
                      onChange={(event) => void userAction(user, "set_role", event.target.value)}
                      disabled={busy}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                      <option value="super_admin">super_admin</option>
                    </select>
                  )}

                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => void userAction(user, "set_status", user.status === "active" ? "suspended" : "active")}
                    disabled={busy}
                  >
                    {user.status === "active" ? <Ban className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                    {user.status === "active" ? labels.users.suspend : labels.users.activate}
                  </button>

                  {role === "super_admin" && (
                    <button type="button" className="btn-ghost btn-sm text-rose-600 dark:text-rose-400" onClick={() => void userAction(user, "delete")} disabled={busy}>
                      <Trash2 className="size-3.5" />
                      {labels.users.delete}
                    </button>
                  )}
                </div>
              </li>
            ))}
            {users.length === 0 && <li className="panel text-sm text-slate-500 dark:text-slate-400">{labels.empty}</li>}
          </ul>

          {pager(userPages, (page) => void loadUsers(page))}
        </section>
      )}

      {tab === "tools" && (
        <section className="mt-6">
          <ul className="space-y-3">
            {tools.map((tool) => (
              <ToolRow
                key={tool.slug}
                tool={tool}
                name={toolNames[tool.slug] ?? tool.slug}
                labels={labels}
                busy={busy}
                onToggle={(note) => void toggleTool(tool, note)}
                onSaveNote={(note) => void saveNote(tool, note)}
                time={time}
              />
            ))}
          </ul>
        </section>
      )}

      {tab === "activity" && (
        <section className="mt-6">
          <div className="panel grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select className="input" aria-label={labels.activity.tool} value={runFilters.tool} onChange={(event) => setRunFilters((prev) => ({ ...prev, tool: event.target.value }))}>
              <option value="">{labels.activity.allTools}</option>
              {tools.length === 0
                ? Object.keys(toolNames).map((slug) => (
                    <option key={slug} value={slug}>
                      {toolNames[slug]}
                    </option>
                  ))
                : tools.map((tool) => (
                    <option key={tool.slug} value={tool.slug}>
                      {toolNames[tool.slug] ?? tool.slug}
                    </option>
                  ))}
            </select>
            <select className="input" aria-label={labels.activity.status} value={runFilters.status} onChange={(event) => setRunFilters((prev) => ({ ...prev, status: event.target.value }))}>
              <option value="">{labels.activity.allStatuses}</option>
              <option value="ok">ok</option>
              <option value="error">error</option>
            </select>
            <button type="button" className="btn-primary btn-sm" onClick={() => void loadRuns(1)} disabled={busy}>
              {labels.users.apply}
            </button>
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => {
                setRunFilters({ tool: "", status: "" });
                void loadRuns(1);
              }}
              disabled={busy}
            >
              {labels.users.clear}
            </button>
          </div>

          <ul className="mt-4 space-y-2">
            {runs.map((run) => (
              <li key={run.id} className="panel flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{toolNames[run.toolSlug] ?? run.toolSlug}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {run.account ? run.account.email : `${labels.activity.guest} ${run.guest ?? ""}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className={run.status === "ok" ? "chip" : "chip border-rose-300 text-rose-700 dark:text-rose-300"}>{run.status}</span>
                  <span className="tabular-nums">
                    {formatBytes(run.inputSize)} → {formatBytes(run.outputSize)}
                  </span>
                  <span className="tabular-nums">{run.durationMs} ms</span>
                  <span>{time(run.createdAt)}</span>
                </div>
              </li>
            ))}
            {runs.length === 0 && <li className="panel text-sm text-slate-500 dark:text-slate-400">{labels.empty}</li>}
          </ul>

          {pager(runPages, (page) => void loadRuns(page))}
        </section>
      )}

      {tab === "audit" && (
        <section className="mt-6">
          <ul className="space-y-2">
            {audit.map((entry) => (
              <li key={entry.id} className="panel flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{entry.action}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {entry.actorEmail ?? "—"}
                    {entry.target ? ` → ${entry.target}` : ""}
                    {entry.metadata ? ` · ${JSON.stringify(entry.metadata)}` : ""}
                  </p>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{time(entry.createdAt)}</span>
              </li>
            ))}
            {audit.length === 0 && <li className="panel text-sm text-slate-500 dark:text-slate-400">{labels.empty}</li>}
          </ul>
        </section>
      )}
    </div>
  );
}

function ToolRow({
  tool,
  name,
  labels,
  busy,
  onToggle,
  onSaveNote,
  time,
}: {
  tool: AdminTool;
  name: string;
  labels: Dictionary["admin"];
  busy: boolean;
  onToggle: (note: string) => void;
  onSaveNote: (note: string) => void;
  time: (value: string | null) => string;
}) {
  const [note, setNote] = useState(tool.note ?? "");
  const t = labels.toolsTab;

  return (
    <li className="panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tool.category} · {t.processing}: {tool.processing} · {tool.slug}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={tool.isActive ? "chip" : "chip border-amber-300 text-amber-700 dark:text-amber-300"}>{tool.isActive ? t.active : t.inactive}</span>
          <button type="button" className={tool.isActive ? "btn-secondary btn-sm" : "btn-primary btn-sm"} onClick={() => onToggle(note)} disabled={busy}>
            {tool.isActive ? t.disable : t.enable}
          </button>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 sm:grid-cols-4 dark:text-slate-400">
        <div>
          <dt className="font-medium">{t.runs7d}</dt>
          <dd className="tabular-nums text-slate-800 dark:text-slate-100">{tool.runs7d}</dd>
        </div>
        <div>
          <dt className="font-medium">{t.runsTotal}</dt>
          <dd className="tabular-nums text-slate-800 dark:text-slate-100">{tool.runsTotal}</dd>
        </div>
        <div>
          <dt className="font-medium">{t.errors}</dt>
          <dd className="tabular-nums text-slate-800 dark:text-slate-100">{tool.errors}</dd>
        </div>
        <div>
          <dt className="font-medium">{t.lastRun}</dt>
          <dd className="text-slate-800 dark:text-slate-100">{time(tool.lastRunAt)}</dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input className="input flex-1" aria-label={t.note} placeholder={t.note} value={note} onChange={(event) => setNote(event.target.value)} maxLength={200} />
        <button type="button" className="btn-secondary btn-sm" onClick={() => onSaveNote(note)} disabled={busy}>
          {t.saveNote}
        </button>
      </div>
    </li>
  );
}
