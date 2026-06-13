import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import type { Product } from '@/lib/types/product';
import { ProductCard } from './ProductCard';

/**
 * Griglia responsiva di prodotti (sostituisce la staggered grid Flutter).
 * Le prime card ricevono `priority` per il LCP. Mostra un messaggio se vuota.
 */
export async function ProductGrid({
  products,
  locale,
}: {
  products: Product[];
  locale: Locale;
}) {
  const t = await getTranslations('shop');

  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-neutral-500">{t('empty')}</p>
    );
  }

  // Griglia staggered (replica `ShopProductSliver`): 2 colonne mobile, 4 desktop.
  // `grid-depth` = effetto profondità su hover; `card-in` = fade-in 300ms con
  // delay incrementale di 50ms per card (cap 400ms).
  return (
    <ul className="grid-depth grid grid-cols-2 gap-x-4 gap-y-8 desk:grid-cols-4 desk:gap-x-[18px]">
      {products.map((product, i) => (
        <li
          key={product.id}
          className="card-in"
          style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
        >
          <ProductCard product={product} locale={locale} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
