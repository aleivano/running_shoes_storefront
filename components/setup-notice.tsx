import Link from "next/link";

export function SetupNotice() {
  return (
    <div className="border-b border-orange-400/20 bg-orange-500/10 px-5 py-3 text-sm text-orange-100 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Supabase is not configured yet. Storefront browsing works with seed data;
          accounts, favorites, and orders need environment variables.
        </p>
        <Link href="/login" className="font-bold text-orange-200 underline-offset-4 hover:underline">
          View login setup
        </Link>
      </div>
    </div>
  );
}
