import { NextResponse } from "next/server";
import { hasDatabase, query } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json(
      { configured: false, connection: "not-tested" },
      { status: 503 }
    );
  }

  try {
    await query("SELECT 1 AS ok");

    return NextResponse.json(
      { configured: true, connection: "success", query: "success" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : "UNKNOWN";

    return NextResponse.json(
      { configured: true, connection: "failed", errorCode: code },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
