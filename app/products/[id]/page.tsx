import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { SetupNotice } from "@/components/setup-notice";
import { SiteHeader } from "@/components/site-header";
import { getProductById, getSessionContext } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId < 1) {
    notFound();
  }

  const [product, session] = await Promise.all([
    getProductById(productId),
    getSessionContext(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <SiteHeader profile={session.profile} email={session.email} />
      <ProductDetail
        product={product}
        favoriteIds={session.favoriteIds}
        isSignedIn={Boolean(session.userId)}
      />
    </main>
  );
}
