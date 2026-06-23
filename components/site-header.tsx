import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import type { Profile } from "@/lib/types";

type SiteHeaderProps = {
  profile: Profile | null;
  email: string | null;
};

export function SiteHeader({ profile, email }: SiteHeaderProps) {
  const canOpenAdmin =
    profile?.role === "admin" || profile?.role === "catalog_editor";

  return (
    <header className="border-b border-white/10 bg-neutral-950/95 px-5 py-4 text-white sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <Link href="/" className="text-xl font-black tracking-normal text-white">
          StrideForge
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm font-semibold">
          <Link href="/#catalog" className="text-neutral-300 hover:text-orange-300">
            Catalog
          </Link>
          {email ? (
            <>
              <Link href="/account" className="text-neutral-300 hover:text-orange-300">
                {profile?.displayName || profile?.username || "Account"}
              </Link>
              <Link href="/account/orders" className="text-neutral-300 hover:text-orange-300">
                Orders
              </Link>
              {canOpenAdmin ? (
                <Link href="/admin" className="text-neutral-300 hover:text-orange-300">
                  Admin
                </Link>
              ) : null}
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-md border border-white/15 px-3 py-2 text-neutral-200 hover:border-orange-300 hover:text-orange-200"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-neutral-300 hover:text-orange-300">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-orange-500 px-4 py-2 font-bold text-neutral-950 hover:bg-orange-400"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
