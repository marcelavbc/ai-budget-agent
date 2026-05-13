import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const isPublicAsset =
    pathname === "/favicon.ico" ||
    pathname.startsWith("/icon") ||
    /^\/logo.*\.(png|svg)$/i.test(pathname);

  if (isPublicAsset) {
    return NextResponse.next();
  }

  const isAuthenticated = request.cookies.get("auth_session")?.value === "1";
  const isLoginPage = pathname === "/login";
  const isLoginApi = pathname === "/api/auth/login";

  if (isLoginApi) return NextResponse.next();

  if (!isAuthenticated && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
