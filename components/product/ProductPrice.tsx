import type { Product } from '@/lib/types/product';

/**
 * Prezzo prodotto (replica `_PriceRow` di `ProductGridCard`).
 * In saldo: prezzo originale barrato (greyed, w500) + scontato (w800);
 * altrimenti prezzo normale (w600). Colore base = `ink` (NON rosa/rosso sulle
 * card — il rosso resta per il product detail). Sold-out → opacità ridotta.
 */
export function ProductPrice({
  product,
  size = 'sm',
}: {
  product: Product;
  size?: 'sm' | 'lg';
}) {
  const big = size === 'lg';
  const dim = product.isSoldOut ? 'opacity-55' : '';
  const current =
    product.isOnSale && (product.salePriceText ?? product.priceText);

  if (product.isOnSale && current) {
    return (
      <span className={`flex flex-wrap items-center gap-2.5 ${dim}`}>
        {product.originalPriceText && (
          <span
            className={`font-medium text-ink/65 line-through ${big ? 'text-base' : 'text-sm'}`}
          >
            {product.originalPriceText}
          </span>
        )}
        <span className={`font-extrabold text-ink ${big ? 'text-2xl' : 'text-base'}`}>
          {current}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`font-semibold text-ink ${dim} ${big ? 'text-2xl' : 'text-base'}`}
    >
      {product.priceText}
    </span>
  );
}
