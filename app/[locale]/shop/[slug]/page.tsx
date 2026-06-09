import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import {
  getAllSlugs,
  getProductBySlug,
  getRecommendations,
  PRODUCTS_REVALIDATE,
} from '@/lib/products/repository';
import { productTitle, productDescription } from '@/lib/i18n/localized';
import { ProductDetail } from '@/components/product/ProductDetail';
import { ProductGrid } from '@/components/product/ProductGrid';

// SSG + ISR: pre-generata per ogni slug, rivalidata ogni 5 minuti.
export const revalidate = PRODUCTS_REVALIDATE;
// Slug non pre-generati (es. nuovi prodotti) vengono resi on-demand e poi cachati.
export const dynamicParams = true;

const SITE_URL = 'https://shubihubi.com';

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const title = productTitle(product, locale);
  const description =
    productDescription(product, locale).slice(0, 160) || title;
  const path = `/${locale}/shop/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: {
        it: `/it/shop/${slug}`,
        en: `/en/shop/${slug}`,
      },
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: path,
      images: product.imageUrls[0] ? [{ url: product.imageUrls[0] }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [t, recommendations] = await Promise.all([
    getTranslations('product'),
    getRecommendations(product.macroId, product.id),
  ]);

  const title = productTitle(product, locale);
  const description = productDescription(product, locale);

  // JSON-LD Product per i rich result di Google (sostituisce l'hack JS interop).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description: description.slice(0, 5000),
    image: product.imageUrls,
    sku: product.id,
    category: product.macroId,
    brand: { '@type': 'Brand', name: 'Shubihubi' },
    offers: {
      '@type': 'Offer',
      price: product.effectivePrice,
      priceCurrency: 'EUR',
      availability: product.isSoldOut
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      url: `${SITE_URL}/${locale}/shop/${slug}`,
    },
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-6 text-sm text-neutral-500">
        <Link href="/shop" className="hover:underline">
          {t('backToShop')}
        </Link>
        <span className="px-2">/</span>
        <span className="text-neutral-700">{title}</span>
      </nav>

      <ProductDetail product={product} locale={locale} />

      {recommendations.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-semibold text-neutral-900">
            {t('recommendations')}
          </h2>
          <ProductGrid products={recommendations} locale={locale} />
        </section>
      )}
    </main>
  );
}
