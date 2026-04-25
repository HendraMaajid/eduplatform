/**
 * Strip all HTML tags from a string, returning plain text.
 * Useful for displaying rich editor content as plain text in badges, cards, etc.
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  // Create a temporary div to leverage browser's HTML parser
  if (typeof document !== "undefined") {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }
  // Fallback for SSR
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Component props for rendering rich HTML content safely.
 * Use this for rendering module content, descriptions, etc.
 */
export function RichContent({ html, className = "" }: { html: string; className?: string }) {
  if (!html) return null;
  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
