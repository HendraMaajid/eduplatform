import DOMPurify from "dompurify";

/**
 * Sanitize HTML using DOMPurify to prevent XSS attacks.
 * Only allows safe tags and attributes for rich content display.
 */
function sanitizeHtml(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined") {
    // SSR fallback: strip all HTML tags
    return html.replace(/<[^>]*>/g, "").trim();
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "b", "i", "em", "strong", "a", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "h5", "h6", "br", "code", "pre",
      "blockquote", "img", "table", "thead", "tbody", "tr", "th", "td",
      "span", "div", "hr", "sup", "sub", "mark",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "class", "target", "rel", "width", "height"],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Strip all HTML tags from a string, returning plain text.
 * Useful for displaying rich editor content as plain text in badges, cards, etc.
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  // Create a temporary div to leverage browser's HTML parser
  if (typeof document !== "undefined") {
    const tmp = document.createElement("div");
    tmp.innerHTML = DOMPurify.sanitize(html);
    return tmp.textContent || tmp.innerText || "";
  }
  // Fallback for SSR
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Component for rendering rich HTML content safely.
 * All HTML is sanitized through DOMPurify before rendering.
 * Use this for rendering module content, descriptions, etc.
 */
export function RichContent({ html, className = "" }: { html: string; className?: string }) {
  if (!html) return null;
  const cleanHtml = sanitizeHtml(html);
  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
