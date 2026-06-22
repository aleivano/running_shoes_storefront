import { FavoritesList } from "@/components/favorites-list";
import { getFavoriteProducts } from "@/lib/data";

export default async function FavoritesPage() {
  const products = await getFavoriteProducts();

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-300">
          Favorites
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">Saved running shoes</h1>
      </div>
      <FavoritesList products={products} />
    </section>
  );
}
