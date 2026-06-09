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

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, i) => (
        <li key={product.id}>
          <ProductCard product={product} locale={locale} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
