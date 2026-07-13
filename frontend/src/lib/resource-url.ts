const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const apiOrigin = apiBase.replace(/\/+$/, "").replace(/\/api$/, "");

/** Resolve backend-hosted uploads while leaving absolute and browser-local URLs intact. */
export function resourceUrl(value?: string | null): string {
  const url = value?.trim();
  if (!url) return "";
  if (url.startsWith("/uploads/")) return `${apiOrigin}${url}`;
  return url;
}

export function isImageResource(name?: string, type?: string): boolean {
  if (type?.toLowerCase().startsWith("image/")) return true;
  return /\.(avif|gif|jpe?g|png|webp)$/i.test(name || "");
}
