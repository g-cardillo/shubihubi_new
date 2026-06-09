import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { getServerUser } from '@/lib/auth/session';
import { getWishlist } from '@/lib/profile/server';
import { getAllProducts } from '@/lib/products/repository';
import { ProductGrid } from '@/components/product/ProductGrid';

export const dynamic = 'force-dynamic';

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getServerUser();
  if (!user) redirect(`/${locale}/profile`);

  const t = await getTranslations('wishlist');
  const [entries, allProducts] = await Promise.all([
    getWishlist(user.uid),
    getAllProducts(),
  ]);

  const byId = new Map(allProducts.map((p) => [p.id, p]));
  const products = entries
    .map((e) => byId.get(e.productId))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-neutral-900">{t('title')}</h1>

      {products.length === 0 ? (
        <div className="mt-8">
          <p className="font-medium text-neutral-900">{t('empty_title')}</p>
          <p className="mt-1 text-sm text-neutral-500">{t('empty_body')}</p>
        </div>
      ) : (
        <div className="mt-8">
          <ProductGrid products={products} locale={locale} />
        </div>
      )}
    </main>
  );
}
