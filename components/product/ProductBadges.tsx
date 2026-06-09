import type { Product } from '@/lib/types/product';

const badgeBase =
  'inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide';

/**
 * Badge sovrapposti all'immagine del prodotto:
 * - SALDO in alto a sinistra (se in saldo)
 * - NEW / LIMITED impilati in alto a destra
 * Replica la disposizione di `ProductGridCard` (Flutter).
 */
export function ProductBadges({
  product,
  labels,
}: {
  product: Product;
  labels: { sale: string; new: string; limited: string };
}) {
  return (
    <>
      {product.isOnSale && (
        <span className="absolute left-2 top-2 z-10">
          <span className={`${badgeBase} bg-rose-600 text-white`}>
            {product.saleLabel || labels.sale}
          </span>
        </span>
      )}
      {(product.isNew || product.isLimited) && (
        <span className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1">
          {product.isNew && (
            <span className={`${badgeBase} bg-neutral-900 text-white`}>
              {labels.new}
            </span>
          )}
          {product.isLimited && (
            <span className={`${badgeBase} bg-amber-500 text-white`}>
              {labels.limited}
            </span>
          )}
        </span>
      )}
    </>
  );
}
