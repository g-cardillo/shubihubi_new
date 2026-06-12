'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  adminAddProduct,
  adminUpdateProduct,
  newProductId,
  refreshIdToken,
  uploadProductImages,
} from '@/lib/admin/repository';
import type { AdminProduct, AdminProductPayload } from '@/lib/admin/types';
import {
  MACRO_CATEGORIES,
  USER_FILTER_GROUPS,
  SEARCH_FILTER_GROUPS,
  macroById,
} from '@/lib/admin/taxonomy';
import {
  addFilterOption,
  streamFilterOptions,
  type FilterOption,
  type FilterOptionType,
} from '@/lib/admin/filterOptions';

export type FormMode = 'add' | 'edit' | 'duplicate';

/**
 * Form prodotto (replica `AdminProductFormController` + `_ProductFormTab`).
 * Tutti i campi del documento `products`, gestione categorie/colori a chip,
 * immagini esistenti + nuove (resize→WebP all'upload), submit verso le Cloud
 * Function `adminAddProduct` / `adminUpdateProduct`.
 *
 * Il componente si (re)inizializza dai props: la dashboard lo rimonta con una
 * `key` diversa a ogni avvio di add/edit/duplicate.
 */
export function ProductForm({
  mode,
  initial,
  onDone,
}: {
  mode: FormMode;
  initial: AdminProduct | null;
  onDone: () => void;
}) {
  const d = initial;
  const isEdit = mode === 'edit';

  // ── Campi testo ──────────────────────────────────────────────────────────
  const [titleIt, setTitleIt] = useState(d?.title_it ?? d?.title ?? '');
  const [titleEng, setTitleEng] = useState(d?.title_eng ?? '');
  const [macroId, setMacroId] = useState(d?.macroId ?? d?.type ?? '');

  // ── Categorizzazione (nuovo sistema) ─────────────────────────────────────
  const [categoryDescIt, setCategoryDescIt] = useState(d?.categoryDescription_it ?? '');
  const [categoryDescEng, setCategoryDescEng] = useState(d?.categoryDescription_eng ?? '');
  const [subcategory, setSubcategory] = useState(d?.subcategory ?? '');
  const [userFilters, setUserFilters] = useState<string[]>(d?.userFilters ?? []);
  const [searchFilters, setSearchFilters] = useState<string[]>(d?.searchFilters ?? []);

  // Valori extra aggiunti a runtime ("+ Aggiungi nuovo"), in realtime.
  const [extraOptions, setExtraOptions] = useState<FilterOption[]>([]);
  useEffect(() => streamFilterOptions(setExtraOptions), []);

  /**
   * Cambio categoria: precompila le descrizioni (dalla tassonomia per quelle
   * ufficiali, da `filter_options` per quelle aggiunte a runtime) e azzera la
   * sottocategoria.
   */
  function onMacroChange(id: string) {
    setMacroId(id);
    setSubcategory('');
    const m = macroById(id);
    const runtime = extraOptions.find(
      (o) => o.type === 'macroId' && o.value === id,
    );
    setCategoryDescIt(m?.description_it ?? runtime?.description_it ?? '');
    setCategoryDescEng(m?.description_eng ?? runtime?.description_eng ?? '');
  }

  /**
   * Nuova categoria: chiede nome + descrizioni IT/ENG, salva tutto su
   * `filter_options` e seleziona subito la categoria con le sue descrizioni.
   */
  async function promptNewMacro() {
    const value = window.prompt('Nome nuova categoria:')?.trim();
    if (!value) return;
    const descIt = window.prompt('Descrizione categoria (IT):')?.trim() ?? '';
    const descEng = window.prompt('Descrizione categoria (ENG):')?.trim() ?? '';
    try {
      await addFilterOption({
        type: 'macroId',
        value,
        description_it: descIt,
        description_eng: descEng,
      });
      setMacroId(value);
      setSubcategory('');
      setCategoryDescIt(descIt);
      setCategoryDescEng(descEng);
    } catch (e) {
      setError(`Errore salvataggio categoria: ${(e as Error).message}`);
    }
  }

  // Categorie disponibili = tassonomia + extra aggiunte a runtime + eventuale
  // valore legacy del prodotto in editing (per non romperne la modifica).
  const macroOptions = useMemo(() => {
    const seed = MACRO_CATEGORIES.map((m) => m.id);
    const extra = extraOptions
      .filter((o) => o.type === 'macroId')
      .map((o) => o.value);
    const legacy = macroId && !seed.includes(macroId) && !extra.includes(macroId)
      ? [macroId]
      : [];
    return Array.from(new Set([...seed, ...extra, ...legacy]));
  }, [extraOptions, macroId]);

  // Sottocategorie disponibili = seed della categoria + extra da filter_options.
  const subcategoryOptions = useMemo(() => {
    const seed = macroById(macroId)?.subcategories.map((s) => s.it) ?? [];
    const extra = extraOptions
      .filter((o) => o.type === 'subcategory' && o.macroId === macroId)
      .map((o) => o.value);
    return Array.from(new Set([...seed, ...extra]));
  }, [macroId, extraOptions]);

  /** Gruppi filtro = seed + valori extra dello stesso tipo, per gruppo. */
  const filterGroupsFor = (
    type: FilterOptionType,
    seed: Record<string, string[]>,
  ): Record<string, string[]> => {
    const groups: Record<string, string[]> = Object.fromEntries(
      Object.entries(seed).map(([g, vals]) => [g, [...vals]]),
    );
    for (const o of extraOptions) {
      if (o.type !== type || !o.group) continue;
      const list = groups[o.group] ?? (groups[o.group] = []);
      if (!list.includes(o.value)) list.push(o.value);
    }
    return groups;
  };
  const userFilterGroups = useMemo(
    () => filterGroupsFor('userFilter', USER_FILTER_GROUPS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [extraOptions],
  );
  const searchFilterGroups = useMemo(
    () => filterGroupsFor('searchFilter', SEARCH_FILTER_GROUPS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [extraOptions],
  );

  /** "+ Aggiungi nuovo": chiede il valore, lo salva e lo seleziona subito. */
  async function promptNewOption(
    type: FilterOptionType,
    ctx: { macroId?: string; group?: string },
    onAdded: (value: string) => void,
  ) {
    const value = window.prompt('Nuovo valore:')?.trim();
    if (!value) return;
    try {
      await addFilterOption({ type, ...ctx, value });
      onAdded(value);
    } catch (e) {
      setError(`Errore salvataggio opzione: ${(e as Error).message}`);
    }
  }
  const [formati, setFormati] = useState(
    d?.formati ?? (Array.isArray(d?.formats) ? d!.formats!.join(', ') : ''),
  );
  const [descriptionIt, setDescriptionIt] = useState(d?.description_it ?? d?.description ?? '');
  const [descriptionEng, setDescriptionEng] = useState(d?.description_eng ?? '');
  const [tecnicaIt, setTecnicaIt] = useState(d?.tecnica_it ?? '');
  const [tecnicaEng, setTecnicaEng] = useState(d?.tecnica_eng ?? '');
  const [productDetailsIt, setProductDetailsIt] = useState(d?.productDetails_it ?? '');
  const [productDetailsEng, setProductDetailsEng] = useState(d?.productDetails_eng ?? '');
  const [personalizzazioneIt, setPersonalizzazioneIt] = useState(d?.personalizzazione_it ?? '');
  const [personalizzazioneEng, setPersonalizzazioneEng] = useState(d?.personalizzazione_eng ?? '');
  const [confezioneIt, setConfezioneIt] = useState(d?.confezione_it ?? '');
  const [confezioneEng, setConfezioneEng] = useState(d?.confezione_eng ?? '');
  const [tempiIt, setTempiIt] = useState(d?.tempiRealizzazione_it ?? '');
  const [tempiEng, setTempiEng] = useState(d?.tempiRealizzazione_eng ?? '');
  const [price, setPrice] = useState(d?.price != null ? String(d.price) : '');
  const [salePrice, setSalePrice] = useState(d?.salePrice != null ? String(d.salePrice) : '');

  // ── Campi booleani / liste ───────────────────────────────────────────────
  const [isOnSale, setIsOnSale] = useState(d?.isOnSale ?? false);
  const [isSoldOut, setIsSoldOut] = useState(d?.isSoldOut ?? false);
  const [colorChangeable, setColorChangeable] = useState(d?.colorChangeable ?? false);
  const [corniceAvailable, setCorniceAvailable] = useState(d?.corniceAvailable ?? false);
  const [categories, setCategories] = useState<string[]>(d?.categories ?? []);
  const [colours, setColours] = useState<string[]>(d?.colours ?? d?.colors ?? []);

  // initForDuplicate azzera le immagini esistenti; edit le conserva.
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(
    isEdit ? (d?.imageUrls ?? []) : [],
  );
  const [newImages, setNewImages] = useState<File[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // editingProductId: valorizzato solo in edit (add e duplicate creano un id nuovo).
  const editingProductId = isEdit ? (d?.id ?? null) : null;

  const heading =
    mode === 'edit' ? 'Modifica prodotto' : mode === 'duplicate' ? 'Duplica prodotto' : 'Nuovo prodotto';

  // Anteprime object-URL per i nuovi file (revocate al cambio/smontaggio).
  const newPreviews = useMemo(
    () => newImages.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    [newImages],
  );
  useEffect(() => {
    return () => newPreviews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [newPreviews]);

  function pickImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    // Snapshot SUBITO: la FileList è "live" e l'input viene svuotato
    // (`e.target.value = ''`) prima che l'updater di React venga eseguito —
    // leggerla lazy dentro setState perde i file dal secondo pick in poi.
    const picked = Array.from(files);
    setNewImages((prev) => [...prev, ...picked]);
  }

  async function submit() {
    setError(null);
    if (!titleIt.trim()) return setError('Il titolo (IT) è obbligatorio.');
    const priceNum = Number.parseFloat(price.trim());
    if (!Number.isFinite(priceNum)) return setError('Inserisci un prezzo valido.');
    if (existingImageUrls.length === 0 && newImages.length === 0)
      return setError("Aggiungi almeno un'immagine.");

    setIsLoading(true);
    try {
      // Garantisce che il token corrente includa il claim admin (come Flutter).
      await refreshIdToken();
      const productId = editingProductId ?? newProductId();

      const uploadedUrls = await uploadProductImages(productId, newImages);
      const allImageUrls = [...existingImageUrls, ...uploadedUrls];

      const payload: AdminProductPayload = {
        productId,
        title_it: titleIt.trim(),
        title_eng: titleEng.trim(),
        macroId: macroId.trim(),
        categoryDescription_it: categoryDescIt.trim(),
        categoryDescription_eng: categoryDescEng.trim(),
        subcategory: subcategory.trim(),
        userFilters,
        searchFilters,
        categories,
        description_it: descriptionIt.trim(),
        description_eng: descriptionEng.trim(),
        formati: formati.trim(),
        tecnica_it: tecnicaIt.trim(),
        tecnica_eng: tecnicaEng.trim(),
        imageUrls: allImageUrls,
        isOnSale,
        isSoldOut,
        price: priceNum,
        salePrice: Number.parseFloat(salePrice.trim()) || 0,
        colorChangeable,
        colours,
        corniceAvailable,
        productDetails_it: productDetailsIt.trim(),
        productDetails_eng: productDetailsEng.trim(),
        personalizzazione_it: personalizzazioneIt.trim(),
        personalizzazione_eng: personalizzazioneEng.trim(),
        confezione_it: confezioneIt.trim(),
        confezione_eng: confezioneEng.trim(),
        tempiRealizzazione_it: tempiIt.trim(),
        tempiRealizzazione_eng: tempiEng.trim(),
      };

      if (editingProductId == null) {
        await adminAddProduct(payload);
      } else {
        await adminUpdateProduct(payload);
      }
      onDone();
    } catch (e) {
      setError(`Errore: ${(e as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-neutral-900">{heading}</h2>

      <div className="mt-6 space-y-4">
        <Section title="Informazioni base" defaultOpen>
          <TextField label="Titolo (IT) *" value={titleIt} onChange={setTitleIt} />
          <TextField label="Titolo (ENG)" value={titleEng} onChange={setTitleEng} />
          <TextField
            label="Formati disponibili (es. A4, A3, 50x70)"
            value={formati}
            onChange={setFormati}
          />
          <ChipField label="Categorie" items={categories} onChange={setCategories} />
        </Section>

        <Section title="Categorizzazione" defaultOpen>
          <SelectField
            label="Categoria (macroId)"
            value={macroId}
            onChange={onMacroChange}
            options={macroOptions}
            placeholder="— Seleziona categoria —"
            onAddNew={promptNewMacro}
          />
          <TextField
            label="Descrizione categoria (IT)"
            value={categoryDescIt}
            onChange={setCategoryDescIt}
            multiline
          />
          <TextField
            label="Descrizione categoria (ENG)"
            value={categoryDescEng}
            onChange={setCategoryDescEng}
            multiline
          />
          <SelectField
            label="Sottocategoria"
            value={subcategory}
            onChange={setSubcategory}
            options={[
              ...subcategoryOptions,
              ...(subcategory && !subcategoryOptions.includes(subcategory)
                ? [subcategory]
                : []),
            ]}
            placeholder={
              macroId ? '— Seleziona sottocategoria —' : 'Seleziona prima una categoria'
            }
            disabled={!macroId}
            onAddNew={() =>
              promptNewOption('subcategory', { macroId }, setSubcategory)
            }
          />

          <div>
            <span className="mb-1 block text-xs font-medium text-neutral-600">
              Filtri utente
            </span>
            <div className="space-y-3 rounded-lg border border-neutral-200 p-3">
              {Object.entries(userFilterGroups).map(([group, values]) => (
                <FilterGroupPicker
                  key={group}
                  group={group}
                  values={values}
                  selected={userFilters}
                  onToggle={(v) =>
                    setUserFilters((s) =>
                      s.includes(v) ? s.filter((x) => x !== v) : [...s, v],
                    )
                  }
                  onAddNew={() =>
                    promptNewOption('userFilter', { group }, (v) =>
                      setUserFilters((s) => (s.includes(v) ? s : [...s, v])),
                    )
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1 block text-xs font-medium text-neutral-600">
              Filtri ricerca
            </span>
            <div className="space-y-3 rounded-lg border border-neutral-200 p-3">
              {Object.entries(searchFilterGroups).map(([group, values]) => (
                <FilterGroupPicker
                  key={group}
                  group={group}
                  values={values}
                  selected={searchFilters}
                  onToggle={(v) =>
                    setSearchFilters((s) =>
                      s.includes(v) ? s.filter((x) => x !== v) : [...s, v],
                    )
                  }
                  onAddNew={() =>
                    promptNewOption('searchFilter', { group }, (v) =>
                      setSearchFilters((s) => (s.includes(v) ? s : [...s, v])),
                    )
                  }
                />
              ))}
            </div>
          </div>
        </Section>

        <Section title="Descrizioni">
          <TextField label="Descrizione (IT)" value={descriptionIt} onChange={setDescriptionIt} multiline />
          <TextField label="Descrizione (ENG)" value={descriptionEng} onChange={setDescriptionEng} multiline />
          <TextField label="Tecnica (IT)" value={tecnicaIt} onChange={setTecnicaIt} />
          <TextField label="Tecnica (ENG)" value={tecnicaEng} onChange={setTecnicaEng} />
          <TextField label="Dettagli prodotto (IT)" value={productDetailsIt} onChange={setProductDetailsIt} multiline />
          <TextField label="Dettagli prodotto (ENG)" value={productDetailsEng} onChange={setProductDetailsEng} multiline />
        </Section>

        <Section title="Personalizzazione & Spedizione">
          <TextField label="Personalizzazione (IT)" value={personalizzazioneIt} onChange={setPersonalizzazioneIt} multiline />
          <TextField label="Personalizzazione (ENG)" value={personalizzazioneEng} onChange={setPersonalizzazioneEng} multiline />
          <TextField label="Confezione (IT)" value={confezioneIt} onChange={setConfezioneIt} multiline />
          <TextField label="Confezione (ENG)" value={confezioneEng} onChange={setConfezioneEng} multiline />
          <TextField label="Tempi di realizzazione (IT)" value={tempiIt} onChange={setTempiIt} multiline />
          <TextField label="Tempi di realizzazione (ENG)" value={tempiEng} onChange={setTempiEng} multiline />
        </Section>

        <Section title="Prezzi & Stato">
          <div className="flex gap-3">
            <div className="flex-1">
              <TextField label="Prezzo (€) *" value={price} onChange={setPrice} inputMode="decimal" />
            </div>
            <div className="flex-1">
              <TextField label="Prezzo scontato (€)" value={salePrice} onChange={setSalePrice} inputMode="decimal" />
            </div>
          </div>
          <SwitchRow label="In saldo" value={isOnSale} onChange={setIsOnSale} />
          <SwitchRow label="Sold out" value={isSoldOut} onChange={setIsSoldOut} />
          <SwitchRow label="Cornice disponibile" value={corniceAvailable} onChange={setCorniceAvailable} />
        </Section>

        <Section title="Colori">
          <SwitchRow label="Colore personalizzabile" value={colorChangeable} onChange={setColorChangeable} />
          <ChipField label="Colori disponibili" items={colours} onChange={setColours} />
        </Section>

        <Section title="Immagini">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50">
            <span>＋ Seleziona immagini</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                pickImages(e.target.files);
                e.target.value = '';
              }}
            />
          </label>

          {existingImageUrls.length === 0 && newImages.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-400">Nessuna immagine selezionata.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-3">
              {existingImageUrls.map((url) => (
                <Thumb
                  key={url}
                  onRemove={() => setExistingImageUrls((p) => p.filter((u) => u !== url))}
                >
                  <Image src={url} alt="" fill sizes="90px" className="object-cover" />
                </Thumb>
              ))}
              {newPreviews.map(({ file, url }, i) => (
                <Thumb
                  key={url}
                  onRemove={() => setNewImages((p) => p.filter((_, idx) => idx !== i))}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={file.name} className="h-full w-full object-cover" />
                </Thumb>
              ))}
            </div>
          )}
        </Section>

        {error && <p className="text-sm font-medium text-brand-red">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={submit}
            disabled={isLoading}
            className="rounded-full bg-brand-pink px-8 py-3 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
          >
            {isLoading ? '…' : editingProductId == null ? 'Aggiungi prodotto' : 'Salva modifiche'}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-full px-5 py-3 text-sm font-semibold text-neutral-600 hover:bg-neutral-100"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helper UI ─────────────────────────────────────────────────────────────────

function Section({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-neutral-900"
      >
        {title}
        <span className="text-neutral-400">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="space-y-3 border-t border-neutral-100 p-4">{children}</div>}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  inputMode?: 'decimal' | 'text';
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-600">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className="admin-input resize-y"
        />
      ) : (
        <input
          value={value}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
          className="admin-input"
        />
      )}
    </label>
  );
}

const ADD_NEW = '__add_new__';

/** Dropdown con placeholder e opzione "+ Aggiungi nuovo" (se `onAddNew`). */
function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  onAddNew,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  onAddNew?: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-600">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.value === ADD_NEW) {
            onAddNew?.();
            return;
          }
          onChange(e.target.value);
        }}
        className="admin-input disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        {onAddNew && <option value={ADD_NEW}>＋ Aggiungi nuovo…</option>}
      </select>
    </label>
  );
}

/**
 * Gruppo di filtri multi-selezione a chip (es. "Occasione") con bottone
 * "+ Aggiungi nuovo" che persiste il valore in `filter_options`.
 */
function FilterGroupPicker({
  group,
  values,
  selected,
  onToggle,
  onAddNew,
}: {
  group: string;
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onAddNew: () => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-700">{group}</span>
        <button
          type="button"
          onClick={onAddNew}
          className="text-xs text-brand-pink hover:underline"
        >
          ＋ Aggiungi nuovo
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => {
          const on = selected.includes(v);
          return (
            <button
              key={v}
              type="button"
              onClick={() => onToggle(v)}
              aria-pressed={on}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                on
                  ? 'border-brand-pink bg-brand-pink font-semibold text-white'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:border-brand-pink/50'
              }`}
            >
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SwitchRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between py-1">
      <span className="text-sm text-neutral-700">{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-pink-500"
      />
    </label>
  );
}

function ChipField({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  function add() {
    const v = draft.trim();
    if (v && !items.includes(v)) onChange([...items, v]);
    setDraft('');
  }
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-neutral-600">{label}</span>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          className="admin-input"
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 rounded-md border border-neutral-300 px-3 text-sm hover:bg-neutral-50"
        >
          Aggiungi
        </button>
      </div>
      {items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((it, i) => (
            <span
              key={it}
              className="inline-flex items-center gap-1 rounded-full bg-brand-pink/5 px-3 py-1 text-xs text-brand-pinkHot"
            >
              {it}
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="text-brand-pink/60 hover:text-brand-pinkHot"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Thumb({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <div className="relative h-[90px] w-[90px] overflow-hidden rounded-lg bg-neutral-100">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
        title="Rimuovi"
      >
        ✕
      </button>
    </div>
  );
}
