import { getProducts, getSessionContext } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupNotice } from "@/components/setup-notice";
import { SiteHeader } from "@/components/site-header";
import { Storefront } from "@/components/storefront";

export default async function Home() {
  const [products, session] = await Promise.all([getProducts(), getSessionContext()]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <SiteHeader profile={session.profile} email={session.email} />
      <Storefront
        products={products}
        favoriteIds={session.favoriteIds}
        isSignedIn={Boolean(session.userId)}
      />
    </main>
  );
}
