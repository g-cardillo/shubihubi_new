import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { Product } from '@/lib/types/product';
import { productTitle } from '@/lib/i18n/localized';
import { BRAND_BLUR } from '@/lib/utils/blurPlaceholder';
import { ProductBadges } from './ProductBadges';
import { ProductPrice } from './ProductPrice';

const MAX_FORMATS_INLINE = 3;

/**
 * Card prodotto per la griglia shop (replica `ProductGridCard` di Flutter).
 * Server Component: link SEO verso `/shop/[slug]`, immagine `next/image` con
 * crossfade su hover (solo desktop ≥ desk/900px), badge stato, chip formati.
 */
export async function ProductCard({
  product,
  locale,
  priority = false,
  showFormats = true,
}: {
  product: Product;
  locale: Locale;
  priority?: boolean;
  /** Mostra i chip formato sotto la card. La griglia shop li nasconde. */
  showFormats?: boolean;
}) {
  const t = await getTranslations('product');
  const title = productTitle(product, locale);
  const primary = product.imageUrls[0];
  const hover = product.imageUrls[1];

  const inlineFormats = product.formats.slice(0, MAX_FORMATS_INLINE);
  const overflow = product.formats.slice(MAX_FORMATS_INLINE);

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      {/* Immagine 4/5, radius 18 */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-prod bg-black/[0.06]">
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
              placeholder="blur"
              blurDataURL={BRAND_BLUR}
              className={`object-cover transition-all duration-200 ${
                hover ? 'desk:group-hover:scale-[1.03] desk:group-hover:opacity-0' : ''
              }`}
            />
            {hover && (
              <Image
                src={hover}
                alt={title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover opacity-0 transition-opacity duration-200 desk:group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            {t('noImage')}
          </div>
        )}

        {/* Overlay sold out */}
        {product.isSoldOut && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-500/55">
            <span className="rounded-full bg-black/55 px-3.5 py-2.5 text-xs font-extrabold uppercase tracking-[0.06em] text-white">
              {t('badge.soldOut')}
            </span>
          </div>
        )}
      </div>

      {/* Titolo */}
      <h3 className="mt-2.5 line-clamp-2 text-base font-bold leading-tight text-ink">
        {title}
      </h3>

      {/* Prezzo */}
      <div className="mt-1.5">
        <ProductPrice product={product} />
      </div>

      {/* Chip formati */}
      {showFormats && product.formats.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {inlineFormats.map((f) => (
            <FormatChip key={f} label={f} />
          ))}
          {overflow.length > 0 && (
            <FormatChip label={`+${overflow.length}`} title={overflow.join(' • ')} />
          )}
        </div>
      )}
    </Link>
  );
}

function FormatChip({ label, title }: { label: string; title?: string }) {
  return (
    <span
      title={title}
      className="rounded-full border border-black/[0.08] bg-black/[0.06] px-2.5 py-1.5 text-xs font-semibold text-ink"
    >
      {label}
    </span>
  );
}
