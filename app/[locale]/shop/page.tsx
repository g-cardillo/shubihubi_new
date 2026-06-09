import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { getCategories, getProductsPage, PRODUCTS_REVALIDATE } from '@/lib/products/repository';
import { CategoryBar } from '@/components/shop/CategoryBar';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Pagination } from '@/components/shop/Pagination';

// ISR: la pagina shop si rigenera al massimo ogni 5 minuti.
export const revalidate = PRODUCTS_REVALIDATE;

type SearchParams = { cat?: string; page?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'shop' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: `/${locale}/shop`,
      languages: { it: '/it/shop', en: '/en/shop' },
    },
  };
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { cat = '', page: pageParam } = await searchParams;

  const t = await getTranslations('shop');
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);

  const [categories, { items, page: current, pageCount, total }] = await Promise.all([
    getCategories(),
    getProductsPage({ category: cat, page }),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">
          {t('title')}
        </h1>
        <p className="text-sm text-neutral-500">{t('resultsCount', { count: total })}</p>
      </header>

      <div className="mb-8">
        <CategoryBar categories={categories} active={cat} />
      </div>

      <ProductGrid products={items} locale={locale} />

      <Pagination page={current} pageCount={pageCount} category={cat} />
    </main>
  );
}
