import { NextRequest, NextResponse } from "next/server";
import { requireStaffApiRequest } from "@/lib/auth/staff-api-auth";
import { getTaxSeasonAdministration } from "@/features/settings/tax-season-admin.service";
import {
  readSettingsJson,
  settingsApiError,
  SettingsRequestError,
} from "@/features/settings/settings-api-response";

async function requireMutation(request: NextRequest) {
  return requireStaffApiRequest(request, { mutation: true });
}

export async function POST(request: NextRequest) {
  const authenticationError = await requireMutation(request);
  if (authenticationError) return authenticationError;

  try {
    const body = await readSettingsJson(request);
    const project = await getTaxSeasonAdministration().assignProject({
      taxSeasonId: body.taxSeasonId,
      asanaProjectGid: body.asanaProjectGid,
      priority: body.priority,
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    return settingsApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  const authenticationError = await requireMutation(request);
  if (authenticationError) return authenticationError;

  try {
    const body = await readSettingsJson(request);
    const administration = getTaxSeasonAdministration();

    if (body.operation === "set-enabled") {
      return NextResponse.json({
        success: true,
        project: await administration.setProjectEnabled({
          id: body.id,
          enabled: body.enabled,
        }),
      });
    }

    if (body.operation === "reorder") {
      return NextResponse.json({
        success: true,
        projects: await administration.reorderProjects({
          taxSeasonId: body.taxSeasonId,
          projectIds: body.projectIds,
        }),
      });
    }

    throw new SettingsRequestError("Project operation is invalid.");
  } catch (error) {
    return settingsApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const authenticationError = await requireMutation(request);
  if (authenticationError) return authenticationError;

  try {
    const body = await readSettingsJson(request);
    const project = await getTaxSeasonAdministration().removeProject(body.id);

    return NextResponse.json({ success: true, project });
  } catch (error) {
    return settingsApiError(error);
  }
}
