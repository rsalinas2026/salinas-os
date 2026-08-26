import "server-only";

import { AsanaApiError, asanaFetch } from "./asana-client";

const ASANA_PROJECT_GID_PATTERN = /^\d{1,32}$/;

type AsanaProjectResponse = {
  data?: {
    gid?: string;
    name?: string;
    archived?: boolean;
    modified_at?: string | null;
    team?: { gid?: string; name?: string } | null;
    workspace?: { gid?: string; name?: string } | null;
  };
};

export type ValidatedAsanaProject = {
  gid: string;
  name: string;
  archived: boolean;
  modifiedAt: string | null;
  team: { gid: string; name: string } | null;
  workspace: { gid: string; name: string } | null;
  validatedAt: Date;
};

export class AsanaProjectValidationError extends Error {
  constructor(
    public readonly code:
      | "invalid-gid"
      | "not-accessible"
      | "api-unavailable"
      | "invalid-response",
    message: string,
  ) {
    super(message);
    this.name = "AsanaProjectValidationError";
  }
}

type AsanaProjectFetcher = (
  endpoint: string,
) => Promise<AsanaProjectResponse>;

function safeReference(
  value: { gid?: string; name?: string } | null | undefined,
) {
  const gid = value?.gid?.trim();
  const name = value?.name?.trim();

  return gid && name ? { gid, name } : null;
}

export function normalizeAsanaProjectGid(value: unknown): string {
  if (typeof value !== "string") {
    throw new AsanaProjectValidationError(
      "invalid-gid",
      "Enter a valid Asana Project GID.",
    );
  }

  const gid = value.trim();

  if (!ASANA_PROJECT_GID_PATTERN.test(gid)) {
    throw new AsanaProjectValidationError(
      "invalid-gid",
      "Enter a valid Asana Project GID.",
    );
  }

  return gid;
}

export async function validateAsanaProject(
  value: unknown,
  fetchProject: AsanaProjectFetcher = asanaFetch,
): Promise<ValidatedAsanaProject> {
  const requestedGid = normalizeAsanaProjectGid(value);
  const params = new URLSearchParams({
    opt_fields: [
      "gid",
      "name",
      "archived",
      "modified_at",
      "team.gid",
      "team.name",
      "workspace.gid",
      "workspace.name",
    ].join(","),
  });

  let response: AsanaProjectResponse;

  try {
    response = await fetchProject(
      `/projects/${encodeURIComponent(requestedGid)}?${params.toString()}`,
    );
  } catch (error) {
    if (
      error instanceof AsanaApiError &&
      (error.status === 403 || error.status === 404)
    ) {
      throw new AsanaProjectValidationError(
        "not-accessible",
        "The Asana project does not exist or is not accessible.",
      );
    }

    throw new AsanaProjectValidationError(
      "api-unavailable",
      "Asana could not validate this project right now.",
    );
  }

  const gid = response.data?.gid?.trim();
  const name = response.data?.name?.trim();

  if (gid !== requestedGid || !name) {
    throw new AsanaProjectValidationError(
      "invalid-response",
      "Asana returned incomplete project information.",
    );
  }

  return {
    gid,
    name,
    archived: response.data?.archived === true,
    modifiedAt: response.data?.modified_at ?? null,
    team: safeReference(response.data?.team),
    workspace: safeReference(response.data?.workspace),
    validatedAt: new Date(),
  };
}
