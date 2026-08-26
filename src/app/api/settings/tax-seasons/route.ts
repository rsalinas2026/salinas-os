import { NextRequest, NextResponse } from "next/server";
import { requireStaffApiRequest } from "@/lib/auth/staff-api-auth";
import { getTaxSeasonAdministration } from "@/features/settings/tax-season-admin.service";
import {
  readSettingsJson,
  settingsApiError,
  SettingsRequestError,
} from "@/features/settings/settings-api-response";

export async function GET(request: NextRequest) {
  const authenticationError = await requireStaffApiRequest(request);
  if (authenticationError) return authenticationError;

  try {
    const administration = getTaxSeasonAdministration();
    return NextResponse.json({
      success: true,
      seasons: await administration.listTaxSeasons(),
    });
  } catch (error) {
    return settingsApiError(error);
  }
}

export async function POST(request: NextRequest) {
  const authenticationError = await requireStaffApiRequest(request, {
    mutation: true,
  });
  if (authenticationError) return authenticationError;

  try {
    const body = await readSettingsJson(request);
    const season = await getTaxSeasonAdministration().createTaxSeason({
      code: body.code,
      year: body.year,
      name: body.name,
      status: body.status,
    });

    return NextResponse.json({ success: true, season }, { status: 201 });
  } catch (error) {
    return settingsApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  const authenticationError = await requireStaffApiRequest(request, {
    mutation: true,
  });
  if (authenticationError) return authenticationError;

  try {
    const body = await readSettingsJson(request);
    const administration = getTaxSeasonAdministration();

    if (body.operation === "update") {
      return NextResponse.json({
        success: true,
        season: await administration.updateTaxSeason({
          id: body.id,
          code: body.code,
          year: body.year,
          name: body.name,
          status: body.status,
        }),
      });
    }

    if (body.operation === "set-current") {
      return NextResponse.json({
        success: true,
        season: await administration.setCurrentTaxSeason(body.id),
      });
    }

    if (body.operation === "archive") {
      return NextResponse.json({
        success: true,
        season: await administration.archiveTaxSeason(body.id),
      });
    }

    throw new SettingsRequestError("Tax Season operation is invalid.");
  } catch (error) {
    return settingsApiError(error);
  }
}
