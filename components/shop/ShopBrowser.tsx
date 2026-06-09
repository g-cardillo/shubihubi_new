'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { ProductCategory } from '@/lib/products/repository';
import { CategoryBar } from './CategoryBar';

/** Quanti prodotti mostrare all'inizio e ad ogni "carica altri". */
const PAGE_SIZE = 20;

const norm = (s: string) => s.trim().toLowerCase();

/** Una card già renderizzata lato server + i metadati per filtro/lazy-load. */
export interface ShopCard {
  id: string;
  macroId: string;
  categories: string[];
  formats: string[];
  node: ReactNode;
}

interface FilterOption {
  /** Chiave normalizzata (per match case-insensitive). */
  key: string;
  /** Etichetta mostrata (prima casatura incontrata). */
  label: string;
  count: number;
}

/** Opzioni distinte (case-insensitive) per un sotto-filtro, ordinate per frequenza. */
function buildOptions(cards: ShopCard[], pick: (c: ShopCard) => string[]): FilterOption[] {
  const map = new Map<string, FilterOption>();
  for (const c of cards) {
    const values = pick(c);
    if (!Array.isArray(values)) continue;
    for (const raw of values) {
      const key = norm(raw);
      if (!key) continue;
      const existing = map.get(key);
      if (existing) existing.count += 1;
      else map.set(key, { key, label: raw.trim(), count: 1 });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );
}

/**
 * Browser dello shop (replica `ShopPageController` di Flutter):
 * - MACRO filtri = tab per `macroId` (underline);
 * - SOTTO filtri = `categories` + `formats` (multi-select, OR dentro al gruppo,
 *   AND tra gruppi). Cambiando macro i sotto-filtri si azzerano.
 * - SCROLL INFINITO: 20 prodotti iniziali, +20 quando il sentinel entra in
 *   viewport (`IntersectionObserver`). Il catalogo è piccolo, quindi le card
 *   arrivano pre-renderizzate dal server e si filtra/pagina in memoria.
 */
export function ShopBrowser({
  cards,
  macros,
  allLabel,
  emptyLabel,
  categoriesLabel,
  formatLabel,
}: {
  cards: ShopCard[];
  macros: ProductCategory[];
  allLabel: string;
  emptyLabel: string;
  categoriesLabel: string;
  formatLabel: string;
}) {
  const [active, setActive] = useState('');
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [selectedFmts, setSelectedFmts] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const macroFiltered = useMemo(
    () => (active ? cards.filter((c) => norm(c.macroId) === norm(active)) : cards),
    [cards, active],
  );

  // Opzioni dei sotto-filtri ricavate dai prodotti della macro corrente.
  const categoryOptions = useMemo(
    () => buildOptions(macroFiltered, (c) => c.categories),
    [macroFiltered],
  );
  const formatOptions = useMemo(
    () => buildOptions(macroFiltered, (c) => c.formats),
    [macroFiltered],
  );

  const filtered = useMemo(
    () =>
      macroFiltered.filter((c) => {
        const catOk =
          selectedCats.size === 0 ||
          (c.categories ?? []).some((x) => selectedCats.has(norm(x)));
        const fmtOk =
          selectedFmts.size === 0 ||
          (c.formats ?? []).some((x) => selectedFmts.has(norm(x)));
        return catOk && fmtOk;
      }),
    [macroFiltered, selectedCats, selectedFmts],
  );

  // Cambiando macro: azzera i sotto-filtri (come setMacro in Flutter).
  useEffect(() => {
    setSelectedCats(new Set());
    setSelectedFmts(new Set());
  }, [active]);

  // Ogni cambio di filtro riparte dai primi PAGE_SIZE.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [active, selectedCats, selectedFmts]);

  const hasMore = visible < filtered.length;

  // Scroll infinito: quando il sentinel entra in viewport, mostra altri PAGE_SIZE.
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisible((v) => v + PAGE_SIZE);
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, filtered.length]);

  const toggle = (setter: typeof setSelectedCats, key: string) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const shown = filtered.slice(0, visible);

  return (
    <>
      <div className="mb-5">
        <CategoryBar macros={macros} active={active} allLabel={allLabel} onSelect={setActive} />
      </div>

      {/* Sotto-filtri: mostrati solo se il gruppo ha più di un valore. */}
      <div className="mb-8 flex flex-col gap-3">
        {categoryOptions.length > 1 && (
          <FilterGroup
            label={categoriesLabel}
            options={categoryOptions}
            selected={selectedCats}
            onToggle={(k) => toggle(setSelectedCats, k)}
          />
        )}
        {formatOptions.length > 1 && (
          <FilterGroup
            label={formatLabel}
            options={formatOptions}
            selected={selectedFmts}
            onToggle={(k) => toggle(setSelectedFmts, k)}
          />
        )}
      </div>

      {shown.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-500">{emptyLabel}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 desk:grid-cols-5 desk:gap-x-[18px]">
          {shown.map((c) => (
            <li key={c.id}>{c.node}</li>
          ))}
        </ul>
      )}

      {/* Sentinel per lo scroll infinito. */}
      {hasMore && <div ref={sentinelRef} aria-hidden className="h-px w-full" />}
    </>
  );
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: FilterOption[];
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-ink/45">
        {label}
      </span>
      {options.map((o) => {
        const isSel = selected.has(o.key);
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={isSel}
            onClick={() => onToggle(o.key)}
            className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition ${
              isSel
                ? 'border-brand-pink bg-brand-pink text-white'
                : 'border-black/15 text-ink hover:border-brand-pink/60'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
