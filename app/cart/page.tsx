import { CartPage } from "@/components/cart-page";
import { SetupNotice } from "@/components/setup-notice";
import { SiteHeader } from "@/components/site-header";
import { getProducts, getSessionContext } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function CartRoute() {
  const [products, session] = await Promise.all([getProducts(), getSessionContext()]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <SiteHeader profile={session.profile} email={session.email} />
      <CartPage products={products} isSignedIn={Boolean(session.userId)} />
    </main>
  );
}
