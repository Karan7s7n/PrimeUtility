import { json } from "@/lib/api";
import { disabledToolSlugs } from "@/lib/tool-settings";

export const dynamic = "force-dynamic";

/**
 * Which tools are switched off right now. The tool pages are static, so they ask
 * this once on load instead of baking the answer into their HTML.
 */
export async function GET() {
  return json({ paused: await disabledToolSlugs() });
}
