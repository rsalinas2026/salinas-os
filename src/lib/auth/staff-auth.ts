const SESSION_DURATION_SECONDS = 8 * 60 * 60;

export const STAFF_SESSION_COOKIE = "salinas_staff_session";

function getAuthSecret(): string {
  const secret = process.env.SALINAS_AUTH_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new Error(
      "SALINAS_AUTH_SECRET must be configured with at least 32 characters.",
    );
  }

  return secret;
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function sign(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(value),
  );

  return encodeBase64Url(new Uint8Array(signature));
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}

export async function createStaffSessionToken(): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = `staff.${expiresAt}`;
  const signature = await sign(payload);

  return `${payload}.${signature}`;
}

export async function verifyStaffSessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== 3 || parts[0] !== "staff") {
    return false;
  }

  const expiresAt = Number(parts[1]);

  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now() / 1000) {
    return false;
  }

  const payload = `${parts[0]}.${parts[1]}`;
  const expectedSignature = await sign(payload);

  return safeEqual(parts[2], expectedSignature);
}

export async function verifyStaffPassword(password: string): Promise<boolean> {
  const expectedPassword = process.env.SALINAS_STAFF_PASSWORD;

  if (!expectedPassword || expectedPassword.length < 12) {
    throw new Error(
      "SALINAS_STAFF_PASSWORD must be configured with at least 12 characters.",
    );
  }

  const encoder = new TextEncoder();
  const [providedDigest, expectedDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(password)),
    crypto.subtle.digest("SHA-256", encoder.encode(expectedPassword)),
  ]);

  return safeEqual(
    encodeBase64Url(new Uint8Array(providedDigest)),
    encodeBase64Url(new Uint8Array(expectedDigest)),
  );
}

export function getStaffSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
