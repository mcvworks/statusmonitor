import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = [
  "/",
  "/history",
  "/api/alerts",
  "/api/alerts/sse",
  "/api/dependencies",
];

const authRoutes = ["/auth/signin", "/auth/verify"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isSignedIn = !!req.auth;

  // Public routes — always accessible
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  if (isPublicRoute) return NextResponse.next();

  // Auth routes — only accessible when NOT signed in
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  if (isAuthRoute) {
    if (isSignedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Auth.js internal routes — always pass through
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Protected routes — require sign-in
  if (!isSignedIn) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
