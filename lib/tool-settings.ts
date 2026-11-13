import { hasDatabase, one, query } from "./db";

export interface ToolSetting {
  slug: string;
  isActive: boolean;
  note: string | null;
}

/**
 * Tool switches come from the database so the admin dashboard can turn a tool
 * off without a redeploy. Any problem (no database, missing table during a
 * build in CI) leaves every tool enabled rather than hiding the site.
 */
export async function toolSettings(): Promise<Record<string, ToolSetting>> {
  if (!hasDatabase()) return {};
  try {
    const rows = await query<{ slug: string; is_active: boolean; note: string | null }>(
      "SELECT slug, is_active, note FROM tool_settings",
    );
    return Object.fromEntries(
      rows.map((row) => [row.slug, { slug: row.slug, isActive: row.is_active, note: row.note }]),
    );
  } catch {
    return {};
  }
}

export async function settingsFor(slug: string): Promise<ToolSetting | null> {
  if (!hasDatabase()) return null;
  try {
    const row = await one<{ slug: string; is_active: boolean; note: string | null }>(
      "SELECT slug, is_active, note FROM tool_settings WHERE slug = $1",
      [slug],
    );
    return row ? { slug: row.slug, isActive: row.is_active, note: row.note } : null;
  } catch {
    return null;
  }
}

/** Slugs switched off in the admin dashboard; empty when nothing is configured. */
export async function disabledToolSlugs(): Promise<string[]> {
  const settings = await toolSettings();
  return Object.values(settings)
    .filter((setting) => !setting.isActive)
    .map((setting) => setting.slug);
}

export const withoutDisabled = <T extends { slug: string }>(list: T[], disabled: string[]): T[] =>
  disabled.length === 0 ? list : list.filter((item) => !disabled.includes(item.slug));
