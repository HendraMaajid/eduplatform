import { cache } from "react";
import type { PlatformSettings } from "@/lib/types";
import { DEFAULT_PLATFORM_SETTINGS, normalizePlatformSettings } from "@/lib/platform-brand";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api`;

export const getPlatformSettings = cache(async (): Promise<PlatformSettings> => {
  try {
    const response = await fetch(`${API_URL}/platform`, { cache: "no-store" });
    if (!response.ok) return DEFAULT_PLATFORM_SETTINGS;
    return normalizePlatformSettings((await response.json()) as Partial<PlatformSettings>);
  } catch {
    return DEFAULT_PLATFORM_SETTINGS;
  }
});
