import { NextRequest, NextResponse } from "next/server";
import {
  createStaffSessionToken,
  getStaffSessionCookieOptions,
  StaffAuthConfigurationError,
  STAFF_SESSION_COOKIE,
  verifyStaffPassword,
} from "@/lib/auth/staff-auth";
import { getRequestOrigin } from "@/lib/http/request-origin";

function getSafeReturnPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = formData.get("password");
  const returnTo = getSafeReturnPath(formData.get("returnTo"));
  const requestOrigin = getRequestOrigin(request);

  try {
    const passwordIsValid =
      typeof password === "string" &&
      (await verifyStaffPassword(password));

    if (!passwordIsValid) {
      const loginUrl = new URL("/login", requestOrigin);
      loginUrl.searchParams.set("error", "invalid");
      loginUrl.searchParams.set("returnTo", returnTo);

      return NextResponse.redirect(loginUrl, 303);
    }

    const response = NextResponse.redirect(new URL(returnTo, requestOrigin), 303);
    response.cookies.set(
      STAFF_SESSION_COOKIE,
      await createStaffSessionToken(),
      getStaffSessionCookieOptions(),
    );

    return response;
  } catch (error) {
    console.error("Staff login configuration error:", error);

    const loginUrl = new URL("/login", requestOrigin);
    const errorCode =
      error instanceof StaffAuthConfigurationError
        ? `${error.setting}-configuration`
        : "server-configuration";

    loginUrl.searchParams.set("error", errorCode);
    loginUrl.searchParams.set("returnTo", returnTo);

    return NextResponse.redirect(loginUrl, 303);
  }
}
