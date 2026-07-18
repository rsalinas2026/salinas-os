const ASANA_API_BASE_URL = "https://app.asana.com/api/1.0";

function getAsanaToken(): string {
  const token = process.env.ASANA_ACCESS_TOKEN;

  if (!token) {
    throw new Error("Missing ASANA_ACCESS_TOKEN in .env.local");
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
    throw new Error(
      `Asana API request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}