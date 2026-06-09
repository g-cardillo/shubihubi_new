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
    setNewImages((prev) => [...prev, ...Array.from(files)]);
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
          <TextField label="Macro ID / Tipo" value={macroId} onChange={setMacroId} />
          <TextField
            label="Formati disponibili (es. A4, A3, 50x70)"
            value={formati}
            onChange={setFormati}
          />
          <ChipField label="Categorie" items={categories} onChange={setCategories} />
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
