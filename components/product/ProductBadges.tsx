import type { Product } from '@/lib/types/product';

// Pill badge (DESIGN_SYSTEM §4.6): rounded-full, padding ~10×7, w800, ls 0.2.
const badgeBase =
  'inline-block rounded-full px-2.5 py-1.5 text-[11px] font-extrabold tracking-wide';

/**
 * Badge sovrapposti all'immagine del prodotto (replica `ProductGridCard`):
 * - SALDO in alto a sinistra (nero/bianco)
 * - NEW (bianco/nero+bordo) / LIMITED (nero/bianco) impilati in alto a destra
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
        <span className="absolute left-3 top-3 z-10">
          <span className={`${badgeBase} bg-black text-white`}>
            {product.saleLabel || labels.sale}
          </span>
        </span>
      )}
      {(product.isNew || product.isLimited) && (
        <span className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
          {product.isNew && (
            <span className={`${badgeBase} bg-neutral-200 text-neutral-700`}>
              {labels.new}
            </span>
          )}
          {product.isLimited && (
            <span className={`${badgeBase} bg-black text-white`}>
              {labels.limited}
            </span>
          )}
        </span>
      )}
    </>
  );
}
