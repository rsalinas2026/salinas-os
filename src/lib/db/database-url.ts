export class DatabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseConfigurationError";
  }
}

/**
 * Validates database configuration without ever including credentials in an
 * error message. Calling this function does not open a database connection.
 */
export function validateDatabaseUrl(value: string | undefined): string {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new DatabaseConfigurationError(
      "DATABASE_URL is required for database operations.",
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(normalizedValue);
  } catch {
    throw new DatabaseConfigurationError(
      "DATABASE_URL must be a valid PostgreSQL connection URL.",
    );
  }

  if (
    parsedUrl.protocol !== "postgres:" &&
    parsedUrl.protocol !== "postgresql:"
  ) {
    throw new DatabaseConfigurationError(
      "DATABASE_URL must use the postgres or postgresql protocol.",
    );
  }

  if (
    !parsedUrl.hostname ||
    !parsedUrl.username ||
    !parsedUrl.password ||
    parsedUrl.pathname === "/"
  ) {
    throw new DatabaseConfigurationError(
      "DATABASE_URL must include a host, database, username, and password.",
    );
  }

  return normalizedValue;
}
