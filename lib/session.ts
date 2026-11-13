"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  locale: string;
  role: string;
  createdAt: string;
}

export interface SessionUsage {
  plan: "guest" | "free" | "pro" | "business";
  dailyLimit: number;
  usedToday: number;
  remaining: number;
  totalRuns: number;
  runsLast30: number;
  bytesSaved: number;
  byTool: { toolSlug: string; runs: number; savedBytes: number }[];
}

/**
 * `status` keeps four distinct situations apart, so a temporary network or
 * server problem is never shown to the visitor as "signed out":
 * - loading: the first answer is still on its way
 * - authenticated: we have a session
 * - guest: the server answered, there is no session
 * - error: the server could not be reached; whatever we knew before is kept
 */
export type SessionStatus = "loading" | "authenticated" | "guest" | "error";

export interface SessionState {
  user: SessionUser | null;
  usage: SessionUsage | null;
  database: boolean;
  status: SessionStatus;
  /** Kept for convenience: true only while the very first answer is pending. */
  loading: boolean;
}

const initialState: SessionState = {
  user: null,
  usage: null,
  database: true,
  status: "loading",
  loading: true,
};

let state: SessionState = initialState;
const listeners = new Set<() => void>();
let loaded = false;

const emit = () => {
  for (const listener of listeners) listener();
};

const setState = (next: Partial<SessionState>) => {
  state = { ...state, ...next };
  emit();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => state;
const getServerSnapshot = () => initialState;

export async function refreshSession(): Promise<SessionState> {
  try {
    const response = await fetch("/api/auth/me/", { cache: "no-store" });
    if (!response.ok) throw new Error(`session request failed: ${response.status}`);
    const data = (await response.json()) as {
      user: SessionUser | null;
      usage: SessionUsage | null;
      database?: boolean;
    };
    setState({
      user: data.user ?? null,
      usage: data.usage ?? null,
      database: data.database !== false,
      status: data.user ? "authenticated" : "guest",
      loading: false,
    });
  } catch {
    // A temporary failure must not look like a sign-out: keep what we knew and
    // mark the state as an error so the UI can say so instead of guessing.
    setState({ status: "error", loading: false });
  }
  loaded = true;
  return state;
}

function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  void refreshSession();
}

/** Shared session state — the header and the account page read the same snapshot. */
export function useSession(): SessionState {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    ensureLoaded();
  }, []);
  return snapshot;
}

export interface RunResult {
  ok: boolean;
  limited: boolean;
  remaining: number | null;
  plan?: SessionUsage["plan"];
  limit?: number;
}

/**
 * Records a finished tool run for the daily allowance and the history page.
 * A limit stop is reported back so the tool can explain it to the visitor.
 */
export async function logRun(payload: {
  toolSlug: string;
  inputSize?: number;
  outputSize?: number;
  durationMs?: number;
  status?: "ok" | "error";
}): Promise<RunResult> {
  try {
    const response = await fetch("/api/runs/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      // Survives a navigation that happens right after the tool finishes.
      keepalive: true,
    });
    const data = (await response.json()) as {
      ok?: boolean;
      limited?: boolean;
      used?: number;
      remaining?: number;
      plan?: SessionUsage["plan"];
      limit?: number;
      database?: boolean;
    };
    if (data.database === false) return { ok: false, limited: false, remaining: null };
    if (data.ok && state.usage) {
      setState({
        usage: {
          ...state.usage,
          usedToday: typeof data.used === "number" ? data.used : state.usage.usedToday + 1,
          remaining: data.remaining ?? Math.max(0, state.usage.remaining - 1),
        },
      });
    }
    return {
      ok: Boolean(data.ok),
      limited: Boolean(data.limited),
      remaining: typeof data.remaining === "number" ? data.remaining : null,
      plan: data.plan,
      limit: data.limit,
    };
  } catch {
    return { ok: false, limited: false, remaining: null };
  }
}

/** Signs out. Returns false when the server could not be reached, so the UI can say so. */
export async function signOut(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/logout/", { method: "POST" });
    if (!response.ok) return false;
  } catch {
    return false;
  }
  loaded = true;
  await refreshSession();
  return state.status === "guest";
}

export interface RunPayload {
  inputSize?: number;
  outputSize?: number;
  durationMs?: number;
  status?: "ok" | "error";
}

/**
 * Records tool runs for the history page and the daily allowance.
 * `track` returns false when the daily allowance is used up, so a tool can
 * explain the stop instead of pretending the work succeeded.
 */
export function useRunTracker(toolSlug: string) {
  const [limit, setLimit] = useState<number | null>(null);
  const once = useRef(false);

  const track = useCallback(
    async (payload: RunPayload = {}) => {
      const result = await logRun({ toolSlug, ...payload });
      if (result.limited) setLimit(result.limit ?? 0);
      return result;
    },
    [toolSlug],
  );

  /** For instant tools: counts the first use per page view only. */
  const trackOnce = useCallback(
    async (payload: RunPayload = {}) => {
      if (once.current) return null;
      once.current = true;
      return track(payload);
    },
    [track],
  );

  return { track, trackOnce, limitReached: limit };
}
