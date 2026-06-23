import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SetupNotice } from "@/components/setup-notice";
import { getSessionContext } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionContext();
  const canOpenAdmin =
    session.profile?.role === "admin" || session.profile?.role === "catalog_editor";

  if (isSupabaseConfigured && !session.userId) {
    redirect("/login?redirectTo=/account");
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <SiteHeader profile={session.profile} email={session.email} />
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-lg border border-white/10 bg-neutral-900 p-4">
          <nav className="grid gap-2 text-sm font-semibold">
            <Link className="rounded-md px-3 py-2 text-neutral-300 hover:bg-white/5 hover:text-orange-300" href="/account">
              Profile
            </Link>
            <Link className="rounded-md px-3 py-2 text-neutral-300 hover:bg-white/5 hover:text-orange-300" href="/account/orders">
              Orders
            </Link>
            <Link className="rounded-md px-3 py-2 text-neutral-300 hover:bg-white/5 hover:text-orange-300" href="/account/favorites">
              Favorites
            </Link>
            {canOpenAdmin ? (
              <Link className="rounded-md px-3 py-2 text-neutral-300 hover:bg-white/5 hover:text-orange-300" href="/admin">
                Admin
              </Link>
            ) : null}
          </nav>
        </aside>
        {children}
      </div>
    </main>
  );
}
