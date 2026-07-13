"use client";

import DOMPurify from "dompurify";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Sanitize HTML using DOMPurify to prevent XSS attacks.
 * Only allows safe tags and attributes for rich content display.
 */
function sanitizeHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "b",
      "i",
      "em",
      "strong",
      "a",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "br",
      "code",
      "pre",
      "blockquote",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "span",
      "div",
      "hr",
      "sup",
      "sub",
      "mark",
    ],
    // Author-provided links stay in the current tab. This prevents a missing
    // rel="noopener" on target="_blank" from exposing window.opener.
    ALLOWED_ATTR: ["href", "src", "alt", "class", "rel", "width", "height"],
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

  return <HydratedRichContent html={html} className={className} />;
}

function HydratedRichContent({ html, className }: { html: string; className: string }) {
  const [sanitized, setSanitized] = useState<{ source: string; value: string } | null>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setSanitized({ source: html, value: sanitizeHtml(html) });
    });
    return () => {
      active = false;
    };
  }, [html]);

  const classes = cn("rich-content max-w-none", className);
  if (sanitized?.source !== html) {
    // Render text as a React child during SSR and the first client pass. React
    // escapes it automatically, so untrusted markup cannot execute before
    // DOMPurify is available in the browser.
    return <div className={classes}>{html.replace(/<[^>]*>/g, "").trim()}</div>;
  }

  return <div className={classes} dangerouslySetInnerHTML={{ __html: sanitized.value }} />;
}
