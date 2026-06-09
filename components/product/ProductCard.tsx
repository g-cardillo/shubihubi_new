import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { Product } from '@/lib/types/product';
import { productTitle } from '@/lib/i18n/localized';
import { ProductBadges } from './ProductBadges';
import { ProductPrice } from './ProductPrice';

/**
 * Card prodotto per la griglia shop. Server Component: link SEO-friendly verso
 * `/shop/[slug]`, immagine ottimizzata `next/image` con swap su hover
 * (seconda immagine, se presente) e badge stato.
 */
export async function ProductCard({
  product,
  locale,
  priority = false,
}: {
  product: Product;
  locale: Locale;
  priority?: boolean;
}) {
  const t = await getTranslations('product');
  const title = productTitle(product, locale);
  const primary = product.imageUrls[0];
  const hover = product.imageUrls[1];

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-neutral-100">
        <ProductBadges
          product={product}
          labels={{ sale: t('badge.sale'), new: t('badge.new'), limited: t('badge.limited') }}
        />

        {primary ? (
          <>
            <Image
              src={primary}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              className={`object-cover transition-opacity duration-300 ${hover ? 'group-hover:opacity-0' : ''}`}
            />
            {hover && (
              <Image
                src={hover}
                alt={title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            {t('noImage')}
          </div>
        )}

        {product.isSoldOut && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
            <span className="rounded-full border border-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-900">
              {t('badge.soldOut')}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <h3 className="line-clamp-1 text-sm font-medium text-neutral-900 group-hover:underline">
          {title}
        </h3>
        <ProductPrice product={product} />
      </div>
    </Link>
  );
}
