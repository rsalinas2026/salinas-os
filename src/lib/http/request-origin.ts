import { NextRequest } from "next/server";

function getFirstHeaderValue(value: string | null): string | null {
  const firstValue = value?.split(",")[0]?.trim();

  return firstValue || null;
}

export function getRequestOrigin(request: NextRequest): string {
  const forwardedHost = getFirstHeaderValue(
    request.headers.get("x-forwarded-host"),
  );
  const host = forwardedHost ?? getFirstHeaderValue(request.headers.get("host"));
  const forwardedProtocol = getFirstHeaderValue(
    request.headers.get("x-forwarded-proto"),
  );
  const protocol = forwardedProtocol === "http" ? "http" : "https";

  if (host && /^[a-z0-9.-]+(?::\d+)?$/i.test(host)) {
    return `${protocol}://${host}`;
  }

  return request.nextUrl.origin;
}
