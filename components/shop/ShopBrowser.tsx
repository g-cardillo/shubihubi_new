'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { CategoryBar, type ShopMacro } from './CategoryBar';

/** Quanti prodotti mostrare all'inizio e ad ogni "carica altri". */
const PAGE_SIZE = 20;

/** Gruppo fittizio per i valori `userFilters` non mappati in nessun gruppo. */
const OTHER_GROUP = 'Altro';

const norm = (s: string) => s.trim().toLowerCase();

/** Una card già renderizzata lato server + i metadati per filtro/lazy-load. */
export interface ShopCard {
  id: string;
  macroId: string;
  subcategory: string;
  userFilters: string[];
  /** Filtro rapido "In Saldo". */
  isOnSale: boolean;
  /** Filtro rapido "Novità" (stessa logica del badge NUOVO — vedi mapper). */
  isNew: boolean;
  /** Prezzo effettivo (salePrice se in saldo, altrimenti price) per la fascia. */
  effectivePrice: number;
  node: ReactNode;
}

/**
 * Fasce di prezzo predefinite (chip a selezione singola). Il Flutter non aveva
 * un filtro prezzo, quindi usiamo bucket fissi sul prezzo effettivo.
 * `max: null` = fascia aperta verso l'alto ("Oltre €…").
 */
const PRICE_BUCKETS: ReadonlyArray<{ min: number; max: number | null }> = [
  { min: 0, max: 50 },
  { min: 50, max: 100 },
  { min: 100, max: 200 },
  { min: 200, max: null },
];

/** Gruppo di filtri utente (seed tassonomia + extra runtime), dal server. */
export interface ShopFilterGroup {
  group: string;
  values: string[];
}

interface FilterOption {
  /** Chiave normalizzata (per match case-insensitive). */
  key: string;
  /** Etichetta mostrata (valore canonico del gruppo o prima casatura nei dati). */
  label: string;
  count: number;
}

/** Stato dei filtri attivi; si riflette 1:1 nei query param dell'URL. */
interface FilterState {
  /** macroId attiva ('' = Tutti). */
  macro: string;
  /** Sottocategoria attiva ('' = tutta la macro). */
  sub: string;
  /** Valori `userFilters` selezionati (etichette canoniche). */
  filters: string[];
  /** Filtro rapido "In Saldo" (?saldo=true). */
  onSale: boolean;
  /** Filtro rapido "Novità" (?novita=true). */
  isNew: boolean;
  /** Fascia di prezzo selezionata (?prezzoMin / ?prezzoMax). null = nessuna. */
  priceMin: number | null;
  priceMax: number | null;
}

const EMPTY_STATE: FilterState = {
  macro: '',
  sub: '',
  filters: [],
  onSale: false,
  isNew: false,
  priceMin: null,
  priceMax: null,
};

/**
 * Browser dello shop (replica `ShopPageController` di Flutter, nuovo sistema
 * di categorizzazione — SOLO `macroId` / `subcategory` / `userFilters`):
 * - barra macro con dropdown sottocategorie (hover desktop / doppio tap mobile);
 * - bottone "Filtri" con pannello dei filtri utente raggruppati, multi-select
 *   (OR dentro al gruppo, AND tra gruppi e con macro/sottocategoria);
 * - chip dei filtri attivi rimovibili; contatore risultati;
 * - stato nei query param (?macro=…&sub=…&filtro=Gruppo:Valore) con
 *   pushState/popstate, così i link sono condivisibili e il back funziona;
 * - SCROLL INFINITO: 20 prodotti, +20 quando il sentinel entra in viewport.
 *   Il catalogo è piccolo: card pre-renderizzate dal server, filtro in memoria.
 */
export function ShopBrowser({
  cards,
  macros,
  filterGroups,
}: {
  cards: ShopCard[];
  macros: ShopMacro[];
  filterGroups: ShopFilterGroup[];
}) {
  const t = useTranslations('shop');

  const [state, setState] = useState<FilterState>(EMPTY_STATE);
  const [panelOpen, setPanelOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // valore normalizzato → gruppo di appartenenza (per URL e match AND/OR).
  const groupByValue = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of filterGroups) {
      for (const v of g.values) {
        const key = norm(v);
        if (key && !map.has(key)) map.set(key, g.group);
      }
    }
    return map;
  }, [filterGroups]);

  // ── URL state ──────────────────────────────────────────────────────────────

  const parseSearch = useCallback(
    (search: string): FilterState => {
      const params = new URLSearchParams(search);
      const rawMacro = params.get('macro') ?? '';
      const macroEntry = macros.find((m) => norm(m.value) === norm(rawMacro));
      const macro = macroEntry?.value ?? '';
      const rawSub = params.get('sub') ?? '';
      const sub =
        macroEntry?.subs.find((s) => norm(s.value) === norm(rawSub))?.value ?? '';
      const filters: string[] = [];
      const seen = new Set<string>();
      for (const raw of params.getAll('filtro')) {
        // Formato "Gruppo:Valore"; il gruppo è ridondante (lo ricaviamo dal
        // mapping), conta solo il valore.
        const idx = raw.indexOf(':');
        const value = (idx >= 0 ? raw.slice(idx + 1) : raw).trim();
        const key = norm(value);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        filters.push(value);
      }

      // Filtri rapidi.
      const num = (v: string | null): number | null => {
        if (v == null || v === '') return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };
      return {
        macro,
        sub,
        filters,
        onSale: params.get('saldo') === 'true',
        isNew: params.get('novita') === 'true',
        priceMin: num(params.get('prezzoMin')),
        priceMax: num(params.get('prezzoMax')),
      };
    },
    [macros],
  );

  const buildSearch = useCallback(
    (s: FilterState): string => {
      const params = new URLSearchParams();
      if (s.macro) params.set('macro', s.macro);
      if (s.sub) params.set('sub', s.sub);
      for (const v of s.filters) {
        const group = groupByValue.get(norm(v)) ?? OTHER_GROUP;
        params.append('filtro', `${group}:${v}`);
      }
      if (s.onSale) params.set('saldo', 'true');
      if (s.isNew) params.set('novita', 'true');
      if (s.priceMin != null) params.set('prezzoMin', String(s.priceMin));
      if (s.priceMax != null) params.set('prezzoMax', String(s.priceMax));
      return params.toString();
    },
    [groupByValue],
  );

  /** Applica lo stato e (se richiesto) lo spinge nell'URL per il back button. */
  const applyState = useCallback(
    (next: FilterState, push: boolean) => {
      setState(next);
      if (push) {
        const qs = buildSearch(next);
        const url = qs
          ? `${window.location.pathname}?${qs}`
          : window.location.pathname;
        window.history.pushState(null, '', url);
      }
    },
    [buildSearch],
  );

  // All'arrivo applica i filtri dell'URL; popstate (back/forward) li ripristina.
  useEffect(() => {
    if (window.location.search) setState(parseSearch(window.location.search));
    const onPop = () => setState(parseSearch(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [parseSearch]);

  // ── Filtri combinati (AND tra macro, sottocategoria e gruppi di filtri) ────

  const macroFiltered = useMemo(
    () =>
      state.macro
        ? cards.filter((c) => norm(c.macroId) === norm(state.macro))
        : cards,
    [cards, state.macro],
  );

  const subFiltered = useMemo(
    () =>
      state.sub
        ? macroFiltered.filter((c) => norm(c.subcategory) === norm(state.sub))
        : macroFiltered,
    [macroFiltered, state.sub],
  );

  // Selezioni raggruppate: OR dentro al gruppo, AND tra gruppi.
  const selectedByGroup = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const v of state.filters) {
      const group = groupByValue.get(norm(v)) ?? OTHER_GROUP;
      let set = map.get(group);
      if (!set) {
        set = new Set<string>();
        map.set(group, set);
      }
      set.add(norm(v));
    }
    return map;
  }, [state.filters, groupByValue]);

  const filtered = useMemo(() => {
    let list = subFiltered;

    // userFilters: OR dentro al gruppo, AND tra gruppi.
    if (selectedByGroup.size > 0) {
      const groups = Array.from(selectedByGroup.values());
      list = list.filter((c) => {
        const have = new Set(c.userFilters.map(norm));
        return groups.every((wanted) =>
          Array.from(wanted).some((v) => have.has(v)),
        );
      });
    }

    // Filtri rapidi, in AND con tutto il resto.
    if (state.onSale) list = list.filter((c) => c.isOnSale);
    if (state.isNew) list = list.filter((c) => c.isNew);
    if (state.priceMin != null || state.priceMax != null) {
      const min = state.priceMin ?? 0;
      const max = state.priceMax; // null = fascia aperta
      list = list.filter(
        (c) => c.effectivePrice >= min && (max == null || c.effectivePrice < max),
      );
    }

    return list;
  }, [subFiltered, selectedByGroup, state.onSale, state.isNew, state.priceMin, state.priceMax]);

  // Opzioni del pannello: i valori `userFilters` presenti nei prodotti della
  // macro/sottocategoria corrente, raggruppati nell'ordine della tassonomia.
  const panelGroups = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const c of subFiltered) {
      for (const raw of c.userFilters) {
        const key = norm(raw);
        if (!key) continue;
        const existing = counts.get(key);
        if (existing) existing.count += 1;
        else counts.set(key, { label: raw.trim(), count: 1 });
      }
    }

    const used = new Set<string>();
    const groups: Array<{ group: string; label: string; options: FilterOption[] }> = [];
    for (const g of filterGroups) {
      const options: FilterOption[] = [];
      for (const v of g.values) {
        const key = norm(v);
        const entry = counts.get(key);
        if (!entry || used.has(key)) continue;
        used.add(key);
        options.push({ key, label: v, count: entry.count });
      }
      if (options.length > 0) groups.push({ group: g.group, label: g.group, options });
    }

    // Valori presenti nei prodotti ma fuori da ogni gruppo noto.
    const leftovers: FilterOption[] = Array.from(counts.entries())
      .filter(([key]) => !used.has(key))
      .map(([key, e]) => ({ key, label: e.label, count: e.count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    if (leftovers.length > 0) {
      groups.push({ group: OTHER_GROUP, label: t('otherFilters'), options: leftovers });
    }

    return groups;
  }, [subFiltered, filterGroups, t]);

  // ── Azioni ─────────────────────────────────────────────────────────────────

  // Cambiando macro si azzerano sottocategoria e TUTTI i filtri (come setMacro
  // Flutter, che resetta a `const ShopFilters()`).
  const selectMacro = (macro: string) =>
    applyState({ ...EMPTY_STATE, macro }, true);

  const selectSub = (macro: string, sub: string) =>
    applyState(
      // Stessa macro: si conservano filtri utente e rapidi; macro nuova: reset.
      macro === state.macro ? { ...state, sub } : { ...EMPTY_STATE, macro, sub },
      true,
    );

  const toggleFilter = (value: string) => {
    const key = norm(value);
    const isOn = state.filters.some((f) => norm(f) === key);
    const filters = isOn
      ? state.filters.filter((f) => norm(f) !== key)
      : [...state.filters, value];
    applyState({ ...state, filters }, true);
  };

  // ── Filtri rapidi ────────────────────────────────────────────────────────
  const toggleOnSale = () => applyState({ ...state, onSale: !state.onSale }, true);
  const toggleNew = () => applyState({ ...state, isNew: !state.isNew }, true);
  const setPriceBucket = (min: number, max: number | null) => {
    const active = state.priceMin === min && state.priceMax === max;
    applyState(
      { ...state, priceMin: active ? null : min, priceMax: active ? null : max },
      true,
    );
  };
  const clearPrice = () =>
    applyState({ ...state, priceMin: null, priceMax: null }, true);

  // Rimuove TUTTI i filtri (utente + rapidi), mantiene macro/sottocategoria.
  const clearFilters = () =>
    applyState(
      { ...state, filters: [], onSale: false, isNew: false, priceMin: null, priceMax: null },
      true,
    );

  const priceActive = state.priceMin != null || state.priceMax != null;
  /** Etichetta di una fascia: "€0 - €50" oppure "Oltre €200". */
  const priceLabel = (min: number, max: number | null) =>
    max != null ? `€${min} - €${max}` : t('priceOver', { min });

  // ── Paginazione / scroll infinito ──────────────────────────────────────────

  // Ogni cambio di filtro riparte dai primi PAGE_SIZE.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [state]);

  const hasMore = visible < filtered.length;

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

  const shown = filtered.slice(0, visible);
  const selectedKeys = useMemo(
    () => new Set(state.filters.map(norm)),
    [state.filters],
  );

  // Numero di filtri attivi (utente + rapidi): badge sul bottone e visibilità
  // del link "rimuovi tutti".
  const activeCount =
    state.filters.length +
    (state.onSale ? 1 : 0) +
    (state.isNew ? 1 : 0) +
    (priceActive ? 1 : 0);

  return (
    <>
      <div className="mb-4">
        <CategoryBar
          macros={macros}
          activeMacro={state.macro}
          activeSub={state.sub}
          allLabel={t('allCategories')}
          onSelectMacro={selectMacro}
          onSelectSub={selectSub}
        />
      </div>

      {/* Bottone Filtri + contatore risultati. Il pannello è sempre disponibile
          (i filtri rapidi Saldo/Novità/Prezzo esistono a prescindere). */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          aria-expanded={panelOpen}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
            panelOpen || activeCount > 0
              ? 'border-brand-pink text-brand-pink'
              : 'border-black/15 text-ink hover:border-brand-pink/60'
          }`}
        >
          <FunnelIcon />
          {t('filters')}
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-pink px-1 text-xs font-semibold text-white">
              {activeCount}
            </span>
          )}
        </button>
        <p className="text-sm text-ink/55">
          {t('resultsCount', { count: filtered.length })}
        </p>
      </div>

      {/* Pannello filtri: in cima i filtri rapidi (Saldo / Novità / Prezzo),
          poi i filtri utente raggruppati. */}
      {panelOpen && (
        <div className="mb-4 space-y-4 rounded-2xl border border-black/10 p-4">
          {/* ── Filtri rapidi ──────────────────────────────────────────────── */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45">
              {t('quickFilters')}
            </p>
            <div className="flex flex-wrap gap-2">
              <QuickChip selected={state.onSale} onClick={toggleOnSale}>
                {t('onSale')}
              </QuickChip>
              <QuickChip selected={state.isNew} onClick={toggleNew}>
                {t('isNew')}
              </QuickChip>
            </div>
            <p className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-ink/45">
              {t('priceRange')}
            </p>
            <div className="flex flex-wrap gap-2">
              {PRICE_BUCKETS.map((b) => (
                <QuickChip
                  key={`${b.min}-${b.max ?? 'plus'}`}
                  selected={state.priceMin === b.min && state.priceMax === b.max}
                  onClick={() => setPriceBucket(b.min, b.max)}
                >
                  {priceLabel(b.min, b.max)}
                </QuickChip>
              ))}
            </div>
          </div>

          {panelGroups.map((g) => (
            <div key={g.group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45">
                {g.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {g.options.map((o) => {
                  const isSel = selectedKeys.has(o.key);
                  return (
                    <button
                      key={o.key}
                      type="button"
                      aria-pressed={isSel}
                      onClick={() => toggleFilter(o.label)}
                      className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition ${
                        isSel
                          ? 'border-brand-pink bg-brand-pink text-white'
                          : 'border-black/15 text-ink hover:border-brand-pink/60'
                      }`}
                    >
                      {o.label}
                      <span className={isSel ? 'text-white/80' : 'text-ink/40'}>
                        {' '}
                        ({o.count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-end gap-4 border-t border-black/5 pt-3">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-ink/55 underline-offset-2 hover:underline"
              >
                {t('clearFilters')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="cta-bounce rounded-full bg-brand-pink px-5 py-2 text-sm font-semibold text-white hover:brightness-105"
            >
              {t('closeFilters')}
            </button>
          </div>
        </div>
      )}

      {/* Chip dei filtri attivi (la riga sparisce se non ce ne sono). I filtri
          rapidi vengono prima, poi i filtri utente. */}
      {activeCount > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {state.onSale && (
            <ActiveChip
              label={t('onSale')}
              removeLabel={t('removeFilter', { filter: t('onSale') })}
              onRemove={toggleOnSale}
            />
          )}
          {state.isNew && (
            <ActiveChip
              label={t('isNew')}
              removeLabel={t('removeFilter', { filter: t('isNew') })}
              onRemove={toggleNew}
            />
          )}
          {priceActive && (
            <ActiveChip
              label={priceLabel(state.priceMin ?? 0, state.priceMax)}
              removeLabel={t('removeFilter', {
                filter: priceLabel(state.priceMin ?? 0, state.priceMax),
              })}
              onRemove={clearPrice}
            />
          )}
          {state.filters.map((v) => (
            <ActiveChip
              key={norm(v)}
              label={v}
              removeLabel={t('removeFilter', { filter: v })}
              onRemove={() => toggleFilter(v)}
            />
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-500">{t('empty')}</p>
      ) : (
        // `grid-depth` = profondità su hover; `card-in` con delay incrementale
        // (50ms, cap 400ms) — i nodi esistenti non ri-animano (key stabile).
        <ul className="grid-depth grid grid-cols-2 gap-x-4 gap-y-8 desk:grid-cols-5 desk:gap-x-[18px]">
          {shown.map((c, i) => (
            <li
              key={c.id}
              className="card-in"
              style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
            >
              {c.node}
            </li>
          ))}
        </ul>
      )}

      {/* Sentinel per lo scroll infinito. */}
      {hasMore && <div ref={sentinelRef} aria-hidden className="h-px w-full" />}
    </>
  );
}

/** Chip toggle del pannello filtri rapidi (Saldo / Novità / fasce prezzo). */
function QuickChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition ${
        selected
          ? 'border-brand-pink bg-brand-pink text-white'
          : 'border-black/15 text-ink hover:border-brand-pink/60'
      }`}
    >
      {children}
    </button>
  );
}

/** Durata dell'animazione di uscita delle chip (deve combaciare con il CSS). */
const CHIP_OUT_MS = 150;

/**
 * Chip di un filtro attivo: entra con fade+scale (`chip-in`); al click sulla ✕
 * gioca l'animazione di uscita (`chip-out`) e POI rimuove il filtro.
 */
function ActiveChip({
  label,
  removeLabel,
  onRemove,
}: {
  label: string;
  removeLabel: string;
  onRemove: () => void;
}) {
  const [leaving, setLeaving] = useState(false);

  function handleRemove() {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onRemove, CHIP_OUT_MS);
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-brand-pink/10 px-3 py-1.5 text-sm text-ink ${
        leaving ? 'chip-out' : 'chip-in'
      }`}
    >
      {label}
      <button
        type="button"
        onClick={handleRemove}
        aria-label={removeLabel}
        className="text-ink/45 transition hover:text-brand-pink"
      >
        ✕
      </button>
    </span>
  );
}

function FunnelIcon() {
  return (
    <svg
      aria-hidden
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 5h18l-7 8.5V19l-4 2v-7.5L3 5Z" />
    </svg>
  );
}
