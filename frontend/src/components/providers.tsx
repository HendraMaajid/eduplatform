"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { PlatformBrandProvider } from "@/components/brand/platform-brand-provider";
import type { PlatformSettings } from "@/lib/types";

type ProvidersProps = {
  children: React.ReactNode;
  nonce?: string;
  platformSettings?: PlatformSettings;
};

export function Providers({ children, nonce, platformSettings }: ProvidersProps) {
  return (
    <SessionProvider>
      <PlatformBrandProvider initialSettings={platformSettings}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          <TooltipProvider>
            {children}
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </NextThemesProvider>
      </PlatformBrandProvider>
    </SessionProvider>
  );
}
