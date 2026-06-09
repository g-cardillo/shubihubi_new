import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { getAllProducts, getMacroCategories, PRODUCTS_REVALIDATE } from '@/lib/products/repository';
import { ProductCard } from '@/components/product/ProductCard';
import { ShopBrowser, type ShopCard } from '@/components/shop/ShopBrowser';

// ISR: la pagina shop si rigenera al massimo ogni 5 minuti.
export const revalidate = PRODUCTS_REVALIDATE;

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
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('shop');
  const tProduct = await getTranslations('product');

  const [products, macros] = await Promise.all([
    getAllProducts(),
    getMacroCategories(),
  ]);

  // Pre-renderizziamo tutte le card lato server (i18n + next/image) e le
  // passiamo al browser client, che filtra per macro/sotto-filtri e fa lo
  // scroll infinito. `categories`/`formats` servono per i sotto-filtri.
  const cards: ShopCard[] = products.map((product, i) => ({
    id: product.id,
    macroId: product.macroId,
    categories: product.categories,
    formats: product.formats,
    node: (
      <ProductCard
        product={product}
        locale={locale}
        priority={i < 5}
        showFormats={false}
      />
    ),
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <ShopBrowser
        cards={cards}
        macros={macros}
        allLabel={t('allCategories')}
        emptyLabel={t('empty')}
        categoriesLabel={t('categories')}
        formatLabel={tProduct('options.format')}
      />
    </div>
  );
}
