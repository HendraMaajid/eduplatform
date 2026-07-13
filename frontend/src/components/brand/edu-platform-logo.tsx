"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { resourceUrl } from "@/lib/resource-url";
import { usePlatformBrand } from "@/components/brand/platform-brand-provider";

type EduPlatformLogoProps = {
  platformName?: string;
  logoUrl?: string;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
};

export function EduPlatformLogo({
  platformName,
  logoUrl,
  className,
  markClassName,
  wordmarkClassName,
  showWordmark = true,
}: EduPlatformLogoProps) {
  const { settings } = usePlatformBrand();
  const resolvedName = platformName ?? settings.name;
  const resolvedLogoUrl = logoUrl ?? settings.logoUrl;
  const [failedLogoUrl, setFailedLogoUrl] = useState("");
  const showCustomLogo = Boolean(resolvedLogoUrl && failedLogoUrl !== resolvedLogoUrl);

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {showCustomLogo ? (
        // The platform logo can be hosted by the API upload origin or a configured HTTPS URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resourceUrl(resolvedLogoUrl)}
          alt={showWordmark ? "" : resolvedName}
          className={cn("size-10 shrink-0 object-contain", markClassName)}
          onError={() => setFailedLogoUrl(resolvedLogoUrl)}
        />
      ) : (
        <svg
          viewBox="0 0 48 48"
          className={cn("size-10 shrink-0", markClassName)}
          aria-hidden="true"
        >
          <path
            d="M3.5 9.6c7.7-1.3 14.1.7 20.5 6.8v26.1c-5.7-4.5-12.6-6.4-20.5-5.4V9.6Z"
            fill="#2457e6"
          />
          <path
            d="M7.3 13.1c5.2-.3 9.4 1.2 13.1 4.4v18.7c-3.9-2.1-8.3-3-13.1-2.7V13.1Z"
            fill="#dce8ff"
          />
          <path
            d="M44.5 9.6c-7.7-1.3-14.1.7-20.5 6.8v26.1c5.7-4.5 12.6-6.4 20.5-5.4V9.6Z"
            fill="#32b383"
          />
          <path
            d="M40.7 13.1c-5.2-.3-9.4 1.2-13.1 4.4v18.7c3.9-2.1 8.3-3 13.1-2.7V13.1Z"
            fill="#dff6ec"
          />
          <path
            d="M12.3 5.4c4.7-.2 8.6 1.6 11.7 5.3v29.8c-3.2-3.7-7.1-5.6-11.7-5.6V5.4Z"
            fill="#f4c542"
          />
          <path
            d="M24 10.7c3.1-3.7 7-5.5 11.7-5.3v29.5c-4.6 0-8.5 1.9-11.7 5.6V10.7Z"
            fill="#159b78"
          />
          <path d="M24 10.7v29.8" stroke="#10233f" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )}
      {showWordmark ? (
        <span className={cn("font-extrabold tracking-[-0.035em]", wordmarkClassName)}>
          {resolvedName}
        </span>
      ) : null}
    </span>
  );
}
