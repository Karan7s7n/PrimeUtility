import { destroySession } from "@/lib/auth";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST() {
  await destroySession();
  return json({ ok: true });
}
