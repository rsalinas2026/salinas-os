import { NextRequest, NextResponse } from "next/server";
import {
  getStaffSessionCookieOptions,
  STAFF_SESSION_COOKIE,
} from "@/lib/auth/staff-auth";
import { getRequestOrigin } from "@/lib/http/request-origin";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/login", getRequestOrigin(request)),
    303,
  );

  response.cookies.set(STAFF_SESSION_COOKIE, "", {
    ...getStaffSessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}
