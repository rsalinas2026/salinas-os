export type SettingsProjectOrderDirection = "up" | "down";

export type ValidatedProjectPreview = {
  gid: string;
  name: string;
  archived: boolean;
};

export type FutureSeasonInputResult =
  | { error: string }
  | {
      value: {
        code: string;
        year: number;
        name: string;
        status: "upcoming";
      };
    };

export function buildFutureSeasonInput(
  yearValue: string,
  nameValue: string,
): FutureSeasonInputResult {
  const year = Number(yearValue);
  const name = nameValue.trim();

  if (!Number.isInteger(year) || year < 2000 || year > 2200) {
    return { error: "Enter a valid four-digit Tax Season year." };
  }

  if (!name || name.length > 120) {
    return { error: "Enter a Tax Season name using 1 to 120 characters." };
  }

  return {
    value: {
      code: String(year),
      year,
      name,
      status: "upcoming" as const,
    },
  };
}

export function canAssignValidatedProject(
  project: ValidatedProjectPreview | null,
): boolean {
  return Boolean(project && !project.archived);
}

export function moveProjectId(
  projectIds: string[],
  projectId: string,
  direction: SettingsProjectOrderDirection,
): string[] {
  const currentIndex = projectIds.indexOf(projectId);
  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (
    currentIndex < 0 ||
    nextIndex < 0 ||
    nextIndex >= projectIds.length
  ) {
    return [...projectIds];
  }

  const reordered = [...projectIds];
  [reordered[currentIndex], reordered[nextIndex]] = [
    reordered[nextIndex],
    reordered[currentIndex],
  ];

  return reordered;
}

export function safeSettingsError(
  payload: unknown,
  fallback: string,
): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string" &&
    payload.error.trim()
  ) {
    return payload.error.trim().slice(0, 300);
  }

  return fallback;
}
