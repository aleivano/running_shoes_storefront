import { ProductCreateForm, ProductEditForm } from "@/components/admin-forms";
import { getAdminProducts } from "@/lib/data";

export default async function AdminCatalogPage() {
  const products = await getAdminProducts();

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-300">
          Catalog
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">Catalog authoring</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-400">
          Create running shoe products, update detail page content, manage inventory and pricing,
          configure low-stock thresholds, and archive products that should no longer appear in the
          public storefront.
        </p>
      </div>

      <ProductCreateForm />

      <div className="grid gap-4">
        {products.map((product) => (
          <ProductEditForm key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
