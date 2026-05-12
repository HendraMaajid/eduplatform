import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Not authenticated → redirect to login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes
  if (
    pathname.startsWith("/dashboard/admin") &&
    !["super_admin", "admin"].includes(token.role as string)
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Teacher-only routes
  if (
    pathname.startsWith("/dashboard/teacher") &&
    !["super_admin", "admin", "teacher"].includes(token.role as string)
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
