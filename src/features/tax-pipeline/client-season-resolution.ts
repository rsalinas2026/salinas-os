export type ClientSeasonResolution =
  | { success: true; seasonId: string; source: "url" | "current" }
  | { success: false; error: string };

export function resolveClientTaxSeason(input: {
  requestedSeasonId?: string | null;
  activeSeasonId?: string | null;
  availableSeasonIds: readonly string[];
}): ClientSeasonResolution {
  const requestedSeasonId = input.requestedSeasonId?.trim() ?? "";
  const availableSeasonIds = new Set(input.availableSeasonIds);

  if (requestedSeasonId) {
    return availableSeasonIds.has(requestedSeasonId)
      ? { success: true, seasonId: requestedSeasonId, source: "url" }
      : {
          success: false,
          error: `Unknown Tax Season: ${requestedSeasonId}`,
        };
  }

  const activeSeasonId = input.activeSeasonId?.trim() ?? "";

  if (activeSeasonId && availableSeasonIds.has(activeSeasonId)) {
    return { success: true, seasonId: activeSeasonId, source: "current" };
  }

  return {
    success: false,
    error: "No current/default Tax Season is available.",
  };
}
