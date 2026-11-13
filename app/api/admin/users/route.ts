import { applyUserAction, adminGuard, guardStatus, listUsers, type UserAction } from "@/lib/admin";
import { json, jsonReadError, readJson, resolveScope } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const scope = await resolveScope();
  const guard = adminGuard(scope);
  if ("error" in guard) return json({ error: guard.error }, guardStatus(guard.error));

  const url = new URL(request.url);
  const users = await listUsers({
    q: url.searchParams.get("q") ?? "",
    plan: url.searchParams.get("plan") ?? "",
    role: url.searchParams.get("role") ?? "",
    status: url.searchParams.get("status") ?? "",
    page: Number(url.searchParams.get("page") ?? 1),
  });

  return json(users);
}

interface ActionBody {
  userId?: number;
  action?: string;
  value?: string;
}

export async function POST(request: Request) {
  const scope = await resolveScope();
  const guard = adminGuard(scope);
  if ("error" in guard) return json({ error: guard.error }, guardStatus(guard.error));

  const body = await readJson<ActionBody>(request);
  if (!body.ok) return jsonReadError(body.error);

  const userId = Number(body.data.userId);
  if (!Number.isInteger(userId) || userId <= 0) return json({ error: "invalid_user" }, 400);

  const action = body.data.action;
  const value = body.data.value;
  let input: UserAction;

  if (action === "set_plan" && (value === "free" || value === "pro" || value === "business")) {
    input = { action: "set_plan", plan: value };
  } else if (action === "set_role" && (value === "user" || value === "admin" || value === "super_admin")) {
    input = { action: "set_role", role: value };
  } else if (action === "set_status" && (value === "active" || value === "suspended")) {
    input = { action: "set_status", status: value };
  } else if (action === "delete") {
    input = { action: "delete" };
  } else {
    return json({ error: "invalid_action" }, 400);
  }

  const result = await applyUserAction(guard.user, userId, input);
  if (!result.ok) return json({ error: result.error }, result.error === "user_not_found" ? 404 : 403);

  return json({ ok: true });
}
