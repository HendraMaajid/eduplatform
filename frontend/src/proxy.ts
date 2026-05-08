import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin-only routes
    if (
      path.startsWith("/dashboard/admin") &&
      !["super_admin", "admin"].includes(token?.role as string)
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Teacher-only routes
    if (
      path.startsWith("/dashboard/teacher") &&
      !["super_admin", "admin", "teacher"].includes(token?.role as string)
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
