import type { Product } from '@/lib/types/product';

/**
 * Prezzo prodotto: in saldo mostra il prezzo scontato + originale barrato,
 * altrimenti il prezzo normale. Usa i testi pre-formattati da Firestore
 * (`priceText` / `salePriceText` / `originalPriceText`).
 */
export function ProductPrice({
  product,
  size = 'sm',
}: {
  product: Product;
  size?: 'sm' | 'lg';
}) {
  const big = size === 'lg';
  const current =
    product.isOnSale && (product.salePriceText ?? product.priceText);

  if (product.isOnSale && current) {
    return (
      <span className="flex items-baseline gap-2">
        <span
          className={`font-semibold text-rose-600 ${big ? 'text-2xl' : 'text-base'}`}
        >
          {current}
        </span>
        {product.originalPriceText && (
          <span
            className={`text-neutral-400 line-through ${big ? 'text-base' : 'text-sm'}`}
          >
            {product.originalPriceText}
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`font-semibold text-neutral-900 ${big ? 'text-2xl' : 'text-base'}`}
    >
      {product.priceText}
    </span>
  );
}
