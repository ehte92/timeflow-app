import { auth } from "@/lib/auth/auth-simple";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Define route categories
  const protectedRoutes = ["/dashboard", "/tasks", "/profile", "/settings"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route),
  );
  const isAuthRoute =
    nextUrl.pathname.startsWith("/auth") || nextUrl.pathname === "/";

  // Allow API routes and static files to pass through
  if (
    nextUrl.pathname.startsWith("/api") ||
    nextUrl.pathname.startsWith("/_next") ||
    nextUrl.pathname.includes(".") ||
    nextUrl.pathname === "/favicon.ico"
  ) {
    return;
  }

  // Redirect authenticated users away from auth pages to dashboard
  if (isAuthRoute && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }

  // Redirect unauthenticated users from protected routes to sign in
  if (isProtectedRoute && !isLoggedIn) {
    return Response.redirect(new URL("/auth/signin", nextUrl));
  }

  // Allow all other routes
  return;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
