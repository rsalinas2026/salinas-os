import Image from "next/image";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    returnTo?: string;
  }>;
};

function getSafeReturnPath(value: string | undefined): string {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const parameters = await searchParams;
  const returnTo = getSafeReturnPath(parameters.returnTo);
  const invalidPassword = parameters.error === "invalid";
  const passwordConfigurationError =
    parameters.error === "password-configuration";
  const secretConfigurationError =
    parameters.error === "secret-configuration";
  const serverConfigurationError =
    parameters.error === "server-configuration" ||
    parameters.error === "configuration";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12 text-slate-900">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
        <Image
          src="/images/rcbs-logo.png"
          alt="Reality Check Business Solutions"
          width={1000}
          height={151}
          priority
          className="h-auto w-full object-contain"
        />

        <div className="mt-9 border-t border-slate-200 pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            Salinas OS
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Staff access
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Enter the RCBS staff password to open the management dashboard.
          </p>
        </div>

        {invalidPassword && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            The password was not recognized. Please try again.
          </div>
        )}

        {passwordConfigurationError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            The staff password setting is missing or shorter than 12 characters.
          </div>
        )}

        {secretConfigurationError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            The authentication secret is missing or shorter than 32 characters.
          </div>
        )}

        {serverConfigurationError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Staff authentication encountered a server configuration error.
          </div>
        )}

        <form action="/api/auth/login" method="post" className="mt-6">
          <input type="hidden" name="returnTo" value={returnTo} />

          <label
            htmlFor="staff-password"
            className="block text-sm font-semibold text-slate-700"
          >
            Staff password
          </label>
          <input
            id="staff-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Open Salinas OS
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          Authorized RCBS staff only
        </p>
      </section>
    </main>
  );
}
