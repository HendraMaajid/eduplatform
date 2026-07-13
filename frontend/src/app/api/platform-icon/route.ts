import { NextResponse, type NextRequest } from "next/server";
import { getPlatformSettings } from "@/lib/platform-settings";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const apiOrigin = apiBase.replace(/\/+$/, "").replace(/\/api$/, "");

function logoTarget(request: NextRequest, logoUrl: string) {
  const value = logoUrl.trim();
  if (value.startsWith("/uploads/")) return new URL(`${apiOrigin}${value}`);
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url;
  } catch {
    // Invalid or empty custom values use the bundled safe fallback below.
  }
  return new URL("/brand/eduplatform-mark.svg", request.url);
}

export async function GET(request: NextRequest) {
  const settings = await getPlatformSettings();
  const response = NextResponse.redirect(logoTarget(request, settings.logoUrl), 307);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
