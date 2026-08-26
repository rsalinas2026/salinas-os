import Link from "next/link";

export default function SettingsNavLink({
  className = "rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700",
}: {
  className?: string;
}) {
  return (
    <Link href="/settings" className={`inline-flex items-center justify-center gap-2 ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
        <path
          d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8 3.5-.1-1.2 1.5-1.2-2-3.4-1.8.7a8.4 8.4 0 0 0-2-1.2L15.3 4h-4l-.3 1.7c-.7.3-1.4.7-2 1.2l-1.8-.7-2 3.4 1.5 1.2a8 8 0 0 0 0 2.4l-1.5 1.2 2 3.4 1.8-.7c.6.5 1.3.9 2 1.2l.3 1.7h4l.3-1.7c.7-.3 1.4-.7 2-1.2l1.8.7 2-3.4-1.5-1.2L20 12Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      Settings
    </Link>
  );
}
