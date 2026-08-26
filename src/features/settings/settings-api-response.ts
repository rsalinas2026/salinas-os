import "server-only";

import { NextResponse } from "next/server";
import { SettingsAdministrationError } from "./tax-season-admin.service";

export class SettingsRequestError extends Error {}

export async function readSettingsJson(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new SettingsRequestError("Request body must be a JSON object.");
    }

    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof SettingsRequestError) throw error;
    throw new SettingsRequestError("Request body must contain valid JSON.");
  }
}

export function settingsApiError(error: unknown) {
  if (error instanceof SettingsRequestError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }

  if (error instanceof SettingsAdministrationError) {
    const status =
      error.code === "not-found"
        ? 404
        : error.code === "conflict"
          ? 409
          : error.code === "external-service"
            ? 502
            : error.code === "configuration"
              ? 503
              : 400;

    return NextResponse.json(
      { success: false, error: error.message },
      { status },
    );
  }

  console.error("Settings administration error:", error);

  return NextResponse.json(
    { success: false, error: "Settings operation could not be completed." },
    { status: 500 },
  );
}
