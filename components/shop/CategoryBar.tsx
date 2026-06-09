'use client';

import type { ProductCategory } from '@/lib/products/repository';

/**
 * Barra macro-categorie dello shop — stile TAB con underline (non pill).
 * Client component: lo stato del tab attivo è gestito da `ShopBrowser`, che
 * filtra i prodotti in memoria (il catalogo è piccolo) per lo scroll infinito.
 * La voce "tutti" ha `value` vuoto.
 */
export function CategoryBar({
  macros,
  active,
  allLabel,
  onSelect,
}: {
  macros: ProductCategory[];
  active: string;
  allLabel: string;
  onSelect: (value: string) => void;
}) {
  return (
    <nav aria-label={allLabel} className="overflow-x-auto border-b border-black/10">
      <ul className="flex w-max gap-7 px-1">
        {macros.map((m) => {
          const isActive = m.value === active;
          const label = m.value || allLabel;
          return (
            <li key={m.value || '__all__'}>
              <button
                type="button"
                onClick={() => onSelect(m.value)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative -mb-px whitespace-nowrap border-b-2 pb-3 pt-1 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-brand-pink text-ink'
                    : 'border-transparent text-ink/55 hover:text-ink'
                }`}
              >
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
