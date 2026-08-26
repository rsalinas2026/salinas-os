import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  STAFF_SESSION_COOKIE,
  verifyStaffSessionToken,
} from "./staff-auth";

function authenticationError(message: string, status: 401 | 403) {
  return NextResponse.json(
    { success: false, error: message },
    { status },
  );
}

function hasTrustedMutationOrigin(request: NextRequest): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite === "cross-site") {
    return false;
  }

  const origin = request.headers.get("origin");

  if (!origin) {
    return process.env.NODE_ENV !== "production";
  }

  try {
    const originUrl = new URL(origin);
    const requestHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
      ?? request.headers.get("host")?.split(",")[0]?.trim()
      ?? request.nextUrl.host;

    return originUrl.host === requestHost;
  } catch {
    return false;
  }
}

/** Explicit route-handler guard in addition to the application proxy. */
export async function requireStaffApiRequest(
  request: NextRequest,
  options: { mutation?: boolean } = {},
): Promise<NextResponse | null> {
  const token = request.cookies.get(STAFF_SESSION_COOKIE)?.value;

  try {
    if (!(await verifyStaffSessionToken(token))) {
      return authenticationError("Authentication required.", 401);
    }
  } catch (error) {
    console.error("Staff API authentication configuration error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication is not configured." },
      { status: 503 },
    );
  }

  if (options.mutation && !hasTrustedMutationOrigin(request)) {
    return authenticationError("Request origin is not allowed.", 403);
  }

  return null;
}
