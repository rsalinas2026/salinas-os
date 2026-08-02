import { NextRequest, NextResponse } from "next/server";
import {
  STAFF_SESSION_COOKIE,
  verifyStaffSessionToken,
} from "@/lib/auth/staff-auth";
import { getRequestOrigin } from "@/lib/http/request-origin";

const PUBLIC_PATHS = new Set([
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
]);

export async function proxy(request: NextRequest) {
  if (PUBLIC_PATHS.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(STAFF_SESSION_COOKIE)?.value;

  try {
    if (await verifyStaffSessionToken(token)) {
      return NextResponse.next();
    }
  } catch (error) {
    console.error("Staff authentication configuration error:", error);
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 },
    );
  }

  const loginUrl = new URL("/login", getRequestOrigin(request));
  loginUrl.searchParams.set(
    "returnTo",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/rcbs-logo.png).*)",
  ],
};
