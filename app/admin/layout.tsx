import Link from "next/link";
import { redirect } from "next/navigation";
import { SetupNotice } from "@/components/setup-notice";
import { SiteHeader } from "@/components/site-header";
import { getAdminSessionContext } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAdminSessionContext();

  if (isSupabaseConfigured && !session.userId) {
    redirect("/login?redirectTo=/admin");
  }

  if (isSupabaseConfigured && !session.canAuthorCatalog) {
    redirect("/account");
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <SiteHeader profile={session.profile} email={session.email} />
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-lg border border-white/10 bg-neutral-900 p-4">
          <nav className="grid gap-2 text-sm font-semibold">
            <Link
              className="rounded-md px-3 py-2 text-neutral-300 hover:bg-white/5 hover:text-orange-300"
              href="/admin/catalog"
            >
              Catalog
            </Link>
            {session.canManageUsers ? (
              <Link
                className="rounded-md px-3 py-2 text-neutral-300 hover:bg-white/5 hover:text-orange-300"
                href="/admin/users"
              >
                Users
              </Link>
            ) : null}
            <Link
              className="rounded-md px-3 py-2 text-neutral-300 hover:bg-white/5 hover:text-orange-300"
              href="/account"
            >
              Account
            </Link>
          </nav>
        </aside>
        {children}
      </div>
    </main>
  );
}
