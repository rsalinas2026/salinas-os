import { AsanaApiError } from "@/lib/asana/asana-client";

export type ReportPreviewAsanaErrorDisposition =
  | "not-found"
  | "operational-authentication"
  | "temporarily-unavailable"
  | "unexpected";

export function getReportPreviewAsanaErrorDisposition(
  error: unknown,
): ReportPreviewAsanaErrorDisposition {
  if (!(error instanceof AsanaApiError)) {
    return "unexpected";
  }

  if (error.status === 403 || error.status === 404) {
    return "not-found";
  }

  if (error.status === 401) {
    return "operational-authentication";
  }

  if (error.status === 429 || error.status >= 500) {
    return "temporarily-unavailable";
  }

  return "unexpected";
}
