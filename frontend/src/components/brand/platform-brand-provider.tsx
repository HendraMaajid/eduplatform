"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PlatformSettings } from "@/lib/types";
import { DEFAULT_PLATFORM_SETTINGS } from "@/lib/platform-brand";

type PlatformBrandContextValue = {
  settings: PlatformSettings;
  updateSettings: (settings: PlatformSettings) => void;
};

const PlatformBrandContext = createContext<PlatformBrandContextValue | null>(null);

export function PlatformBrandProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: PlatformSettings;
}) {
  const [settings, setSettings] = useState(initialSettings || DEFAULT_PLATFORM_SETTINGS);

  useEffect(() => {
    const version = encodeURIComponent(settings.updatedAt || settings.logoUrl || "default");
    const href = `/api/platform-icon?v=${version}`;
    const existingLinks = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]'),
    );
    const links = existingLinks.length ? existingLinks : [document.createElement("link")];

    for (const link of links) {
      link.rel = "icon";
      link.href = href;
      if (!link.isConnected) document.head.appendChild(link);
    }
  }, [settings.logoUrl, settings.updatedAt]);

  const value = useMemo(() => ({ settings, updateSettings: setSettings }), [settings]);

  return <PlatformBrandContext.Provider value={value}>{children}</PlatformBrandContext.Provider>;
}

export function usePlatformBrand() {
  const value = useContext(PlatformBrandContext);
  if (!value) {
    throw new Error("usePlatformBrand must be used within PlatformBrandProvider");
  }
  return value;
}
