import { NextRequest, NextResponse } from "next/server";
import { requireStaffApiRequest } from "@/lib/auth/staff-api-auth";
import { getTaxSeasonAdministration } from "@/features/settings/tax-season-admin.service";
import {
  readSettingsJson,
  settingsApiError,
} from "@/features/settings/settings-api-response";

export async function POST(request: NextRequest) {
  const authenticationError = await requireStaffApiRequest(request, {
    mutation: true,
  });
  if (authenticationError) return authenticationError;

  try {
    const body = await readSettingsJson(request);
    const project = await getTaxSeasonAdministration().validateAsanaProject(
      body.asanaProjectGid,
    );

    return NextResponse.json({ success: true, project });
  } catch (error) {
    return settingsApiError(error);
  }
}
