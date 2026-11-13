import { cleanNumber, json, jsonReadError, readJson, resolveScope } from "@/lib/api";
import { plans, planForUser } from "@/lib/plans";
import { toolSlugs } from "@/lib/tools";
import { reserveRun } from "@/lib/usage";

export const dynamic = "force-dynamic";

interface RunBody {
  toolSlug?: string;
  inputSize?: number;
  outputSize?: number;
  durationMs?: number;
  status?: string;
}

/** Hard caps for client-reported statistics (bytes / milliseconds). */
const MAX_BYTES = 1_073_741_824;
const MAX_DURATION_MS = 3_600_000;

export async function POST(request: Request) {
  const scope = await resolveScope({ createGuest: true });
  if (!scope) return json({ ok: false, database: false }, 200);

  const body = await readJson<RunBody>(request);
  if (!body.ok) return jsonReadError(body.error);

  const toolSlug = body.data.toolSlug;
  if (!toolSlug || !toolSlugs.includes(toolSlug)) {
    return json({ ok: false, error: "unknown_tool" }, 400);
  }

  const plan = planForUser(scope.user);
  const limit = plans[plan].dailyLimit;

  // Sizes and durations are self-reported by the browser: they are validated and
  // clamped for statistics and history, and must never be used as billing truth.
  // Anything charged for later has to be measured on the server.
  const reservation = await reserveRun(scope, limit, {
    toolSlug,
    inputSize: cleanNumber(body.data.inputSize, MAX_BYTES),
    outputSize: cleanNumber(body.data.outputSize, MAX_BYTES),
    durationMs: cleanNumber(body.data.durationMs, MAX_DURATION_MS),
    status: body.data.status === "error" ? "error" : "ok",
  });

  if (!reservation.allowed) {
    return json(
      { ok: false, limited: true, plan, limit, used: reservation.used, remaining: 0 },
      429,
    );
  }

  // The reservation counted the allowance inside its own transaction, so these
  // numbers are exact even when many runs are recorded at the same moment.
  return json({
    ok: true,
    limited: false,
    plan,
    limit,
    used: reservation.used,
    remaining: reservation.remaining,
  });
}
