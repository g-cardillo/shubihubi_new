import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { ProductCategory } from '@/lib/products/repository';

/**
 * Barra categorie dello shop. Link-based (crawlabile/SEO) verso `/shop?cat=`.
 * Le categorie sono derivate dai dati reali; la voce "tutti" ha `value` vuoto.
 * Cambiare categoria riporta sempre a pagina 1.
 */
export async function CategoryBar({
  categories,
  active,
}: {
  categories: ProductCategory[];
  active: string;
}) {
  const t = await getTranslations('shop');

  return (
    <nav aria-label={t('categories')} className="overflow-x-auto">
      <ul className="flex w-max gap-2 pb-1">
        {categories.map((c) => {
          const isActive = c.value === active;
          const label = c.value || t('allCategories');
          return (
            <li key={c.value || '__all__'}>
              <Link
                href={c.value ? `/shop?cat=${encodeURIComponent(c.value)}` : '/shop'}
                aria-current={isActive ? 'page' : undefined}
                className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'
                }`}
              >
                {label}
                <span className={isActive ? 'text-neutral-300' : 'text-neutral-400'}>
                  {' '}
                  {c.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
