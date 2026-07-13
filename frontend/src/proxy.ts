import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

function contentSecurityPolicy(nonce: string) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const apiOrigin = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").origin;
    } catch {
      return "http://localhost:8080";
    }
  })();
  return `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https: ${apiOrigin};
    font-src 'self';
    connect-src 'self' ${apiOrigin}${isDevelopment ? " ws://localhost:* ws://127.0.0.1:*" : ""};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${isDevelopment ? "" : "upgrade-insecure-requests;"}
  `
    .replace(/\s{2,}/g, " ")
    .trim();
}

function secureResponse(response: NextResponse, policy: string) {
  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  return response;
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);

  const { pathname } = request.nextUrl;
  if (pathname === "/favicon.ico" || pathname === "/icon.svg") {
    const iconURL = new URL("/api/platform-icon", request.url);
    iconURL.search = request.nextUrl.search;
    return secureResponse(NextResponse.rewrite(iconURL), policy);
  }
  if (pathname.startsWith("/dashboard")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginURL = new URL("/login", request.url);
      loginURL.searchParams.set("callbackUrl", pathname);
      return secureResponse(NextResponse.redirect(loginURL), policy);
    }
    const role = typeof token.role === "string" ? token.role : "";
    if (pathname.startsWith("/dashboard/admin") && !["super_admin", "admin"].includes(role)) {
      return secureResponse(NextResponse.redirect(new URL("/dashboard", request.url)), policy);
    }
    if (
      pathname.startsWith("/dashboard/teacher") &&
      !["super_admin", "admin", "teacher"].includes(role)
    ) {
      return secureResponse(NextResponse.redirect(new URL("/dashboard", request.url)), policy);
    }
  }

  return secureResponse(NextResponse.next({ request: { headers: requestHeaders } }), policy);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image).*)"],
};
