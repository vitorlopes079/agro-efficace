// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.role === "ADMIN";
    const isUser = token?.role === "USER";
    const pathname = req.nextUrl.pathname;

    // Admin-only routes
    if (pathname.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // User routes (both ADMIN and USER can access)
    if (pathname.startsWith("/dashboard") && !isAdmin && !isUser) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Adicionar pathname aos headers para o Header component
    const response = NextResponse.next();
    response.headers.set("x-pathname", pathname);
    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: ["/", "/admin/:path*", "/dashboard/:path*", "/api/admin/:path*"],
};
