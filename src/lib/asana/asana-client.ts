const ASANA_API_BASE_URL = "https://app.asana.com/api/1.0";

export class AsanaApiError extends Error {
  constructor(public readonly status: number) {
    super("Asana API request failed.");
    this.name = "AsanaApiError";
  }
}

function getAsanaToken(): string {
  const token = process.env.ASANA_ACCESS_TOKEN;

  if (!token) {
    throw new Error("Missing required environment variable: ASANA_ACCESS_TOKEN");
  }

  return token;
}

export async function asanaFetch<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${ASANA_API_BASE_URL}${endpoint}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${getAsanaToken()}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new AsanaApiError(response.status);
  }

  return response.json() as Promise<T>;
}
