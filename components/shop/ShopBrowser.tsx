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
  node: ReactNode;
}

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
}

const EMPTY_STATE: FilterState = { macro: '', sub: '', filters: [] };

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
      return { macro, sub, filters };
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
    if (selectedByGroup.size === 0) return subFiltered;
    return subFiltered.filter((c) => {
      const have = new Set(c.userFilters.map(norm));
      for (const wanted of selectedByGroup.values()) {
        let ok = false;
        for (const v of wanted) {
          if (have.has(v)) {
            ok = true;
            break;
          }
        }
        if (!ok) return false;
      }
      return true;
    });
  }, [subFiltered, selectedByGroup]);

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

  // Cambiando macro si azzerano sottocategoria e filtri (come setMacro Flutter).
  const selectMacro = (macro: string) =>
    applyState({ macro, sub: '', filters: [] }, true);

  const selectSub = (macro: string, sub: string) =>
    applyState(
      { macro, sub, filters: macro === state.macro ? state.filters : [] },
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

  const clearFilters = () => applyState({ ...state, filters: [] }, true);

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

      {/* Bottone Filtri + contatore risultati. */}
      <div className="mb-4 flex items-center justify-between gap-3">
        {panelGroups.length > 0 ? (
          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            aria-expanded={panelOpen}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              panelOpen || state.filters.length > 0
                ? 'border-brand-pink text-brand-pink'
                : 'border-black/15 text-ink hover:border-brand-pink/60'
            }`}
          >
            <FunnelIcon />
            {t('filters')}
            {state.filters.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-pink px-1 text-xs font-semibold text-white">
                {state.filters.length}
              </span>
            )}
          </button>
        ) : (
          <span />
        )}
        <p className="text-sm text-ink/55">
          {t('resultsCount', { count: filtered.length })}
        </p>
      </div>

      {/* Pannello filtri utente, raggruppati per gruppo. */}
      {panelOpen && panelGroups.length > 0 && (
        <div className="mb-4 space-y-4 rounded-2xl border border-black/10 p-4">
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
            {state.filters.length > 0 && (
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
              className="rounded-full bg-brand-pink px-5 py-2 text-sm font-semibold text-white hover:brightness-105"
            >
              {t('closeFilters')}
            </button>
          </div>
        </div>
      )}

      {/* Chip dei filtri attivi (la riga sparisce se non ce ne sono). */}
      {state.filters.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {state.filters.map((v) => (
            <span
              key={norm(v)}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-pink/10 px-3 py-1.5 text-sm text-ink"
            >
              {v}
              <button
                type="button"
                onClick={() => toggleFilter(v)}
                aria-label={t('removeFilter', { filter: v })}
                className="text-ink/45 transition hover:text-brand-pink"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-500">{t('empty')}</p>
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
