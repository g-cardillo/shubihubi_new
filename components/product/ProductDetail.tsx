'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import type { Product } from '@/lib/types/product';
import type { CartItem } from '@/lib/types/cart';
import { pickLocalized } from '@/lib/i18n/localized';
import { useCartStore } from '@/lib/cart/store';
import { ProductGallery } from './ProductGallery';

/**
 * Dettaglio prodotto — redesign coerente col design system Shubihubi
 * (handoff Claude Design, `ProductDetailsV2.jsx`):
 *  - Galleria su card crema, pill di stato + badge formato in overlay.
 *  - Titolo Gowun Batang rosso, prezzo Genty, corpo Quicksand rosa.
 *  - Selettore colore con mini-anteprime (V3), chip formato, stepper quantità.
 *  - Accordion brand-style con i campi descrittivi.
 *
 * La logica di carrello (Zustand) è invariata: il bottone aggiunge l'item con
 * le opzioni selezionate (colore / formato / cornice) e la quantità scelta.
 */
export function ProductDetail({
  product,
  locale,
}: {
  product: Product;
  locale: Locale;
}) {
  const t = useTranslations('product');
  const addItem = useCartStore((s) => s.addItem);

  const title = pickLocalized(product.title_it, product.title_eng, locale);
  const description = pickLocalized(
    product.description_it,
    product.description_eng,
    locale,
  );
  const category = product.categories[0] ?? product.macroId;

  const hasColors = product.colorChangeable && product.colors.length > 0;
  const [color, setColor] = useState<string | null>(
    hasColors ? product.colors[0] : null,
  );
  const [format, setFormat] = useState<string | null>(
    product.formats.length ? product.formats[0] : null,
  );
  const [frame, setFrame] = useState(false);
  const [qty, setQty] = useState(1);
  const [wishlist, setWishlist] = useState(false);

  function handleAddToCart() {
    // Opzioni con chiavi stabili (color/format/frame) per una merge-key coerente.
    const options: Record<string, string> = {};
    if (product.colorChangeable && color) options.color = color;
    if (format) options.format = format;
    if (frame) options.frame = 'on';

    const item: CartItem = {
      productId: product.id,
      title,
      unitPrice: product.effectivePrice,
      qty,
      soldOut: product.isSoldOut,
      options,
      note: null,
      image: product.imageUrls[0] ?? null,
    };
    addItem(item);
  }

  const extras: Array<{ key: string; label: string; value: string }> = [
    { key: 'productDetails', label: t('extras.productDetails'), value: pickLocalized(product.productDetails_it, product.productDetails_eng, locale) },
    { key: 'tecnica', label: t('extras.tecnica'), value: pickLocalized(product.tecnica_it, product.tecnica_eng, locale) },
    { key: 'personalizzazione', label: t('extras.personalizzazione'), value: pickLocalized(product.personalizzazione_it, product.personalizzazione_eng, locale) },
    { key: 'confezione', label: t('extras.confezione'), value: pickLocalized(product.confezione_it, product.confezione_eng, locale) },
    { key: 'tempiRealizzazione', label: t('extras.tempiRealizzazione'), value: pickLocalized(product.tempiRealizzazione_it, product.tempiRealizzazione_eng, locale) },
  ].filter((e) => e.value.trim().length > 0);

  const features = [t('features.shipping'), t('features.handmade'), t('features.unique')];

  // Pill di stato in overlay sulla galleria (priorità: esaurito → limitato → novità).
  const statusPill = product.isSoldOut ? (
    <StatusPill tone="soldOut">{t('badge.soldOut')}</StatusPill>
  ) : product.isLimited ? (
    <StatusPill tone="limited">{t('badge.limited')}</StatusPill>
  ) : product.isNew ? (
    <StatusPill tone="new">{t('badge.new')}</StatusPill>
  ) : null;

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[6fr_5fr] lg:gap-14">
      <ProductGallery
        images={product.imageUrls}
        alt={title}
        topLeft={statusPill}
        topRight={
          format ? (
            <span className="rounded-full border-2 border-brand-pinkSkin bg-white px-4 py-2 font-special text-[22px] leading-none text-brand-red">
              {format}
            </span>
          ) : null
        }
      />

      <div className="flex flex-col gap-[18px]">
        {/* Categoria + titolo + wishlist */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-1.5 font-body text-xs font-bold uppercase tracking-[0.1em] text-brand-pink">
              {category}
            </div>
            <h1 className="font-title text-[32px] font-bold leading-tight text-brand-redTitle">
              {title}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setWishlist((v) => !v)}
            aria-label={t('wishlist')}
            aria-pressed={wishlist}
            className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-full border-2 border-brand-pinkSkin text-lg transition ${
              wishlist ? 'bg-brand-pink text-white' : 'bg-white text-brand-pink'
            }`}
          >
            ♥
          </button>
        </div>

        {/* Prezzo */}
        <div className="flex flex-wrap items-baseline gap-3.5">
          {product.isOnSale && product.originalPriceText && (
            <span className="font-body text-lg text-brand-pink/60 line-through decoration-2">
              {product.originalPriceText}
            </span>
          )}
          <span className="font-special text-[56px] leading-[0.95] text-brand-red">
            {(product.isOnSale && product.salePriceText) || product.priceText}
          </span>
        </div>
        <div className="-mt-2 font-body text-[13px] text-brand-pinkHot">
          {t('taxIncluded')}
        </div>

        {/* Bio */}
        {description && (
          <p className="whitespace-pre-line font-body text-base font-medium leading-relaxed text-brand-pinkHot">
            {description}
          </p>
        )}

        {/* Feature line */}
        <ul className="flex flex-col gap-2">
          {features.map((f) => (
            <li
              key={f}
              className="flex items-center gap-2.5 font-body text-[15px] font-medium text-brand-pinkHot"
            >
              <span className="text-base text-brand-red">✦</span>
              {f}
            </li>
          ))}
        </ul>

        {/* Selettore colore (V3) — mini-anteprime */}
        {hasColors && (
          <div>
            <FieldLabel>{t('options.color')}</FieldLabel>
            <div className="flex flex-wrap gap-2.5">
              {product.colors.map((c, i) => (
                <ColorThumb
                  key={c}
                  label={c}
                  image={product.imageUrls[i] ?? product.imageUrls[0]}
                  selected={color === c}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Formato */}
        {product.formats.length > 1 && (
          <div>
            <FieldLabel>{t('options.format')}</FieldLabel>
            <div className="flex flex-wrap gap-2.5">
              {product.formats.map((f) => (
                <FormatChip
                  key={f}
                  label={f}
                  selected={format === f}
                  onClick={() => setFormat(f)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quantità */}
        <div>
          <FieldLabel>{t('options.quantity')}</FieldLabel>
          <QtyStepper value={qty} onChange={setQty} />
        </div>

        {/* Cornice */}
        {product.corniceAvailable && (
          <BrandCheckbox checked={frame} onChange={setFrame}>
            {t('options.frame')}
          </BrandCheckbox>
        )}

        {/* Add to cart */}
        <button
          type="button"
          disabled={product.isSoldOut}
          onClick={handleAddToCart}
          className="mt-1 flex items-center justify-between gap-4 rounded-full bg-brand-pink px-6 py-4 transition-all duration-200 enabled:desk:hover:-translate-y-0.5 enabled:desk:hover:shadow-pink-cta disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="font-special text-[28px] leading-none text-brand-cream2">
            {product.isSoldOut ? t('badge.soldOut') : t('addToCart')}
          </span>
          {!product.isSoldOut && (
            <span className="rounded-full bg-brand-cream2 px-3.5 py-1 font-body text-lg font-semibold text-brand-red">
              {(product.isOnSale && product.salePriceText) || product.priceText}
            </span>
          )}
        </button>

        {/* Accordion */}
        {extras.length > 0 && (
          <div className="mt-3.5">
            {extras.map((e, i) => (
              <BrandAccordion key={e.key} title={e.label} defaultOpen={i === 0}>
                <p className="whitespace-pre-line">{e.value}</p>
              </BrandAccordion>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bits ────────────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 font-body text-xs font-extrabold uppercase tracking-[0.1em] text-brand-pink">
      {children}
    </div>
  );
}

function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'new' | 'limited' | 'soldOut';
}) {
  const tones: Record<typeof tone, string> = {
    new: 'bg-brand-cream text-brand-red border-brand-red',
    limited: 'bg-brand-pink text-brand-cream2 border-brand-pink',
    soldOut: 'bg-brand-red text-brand-cream2 border-brand-red',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border-2 px-4 py-2 font-special text-lg leading-none ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function FormatChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-2 border-brand-pink px-[18px] py-2 font-body text-[13px] font-bold tracking-wide transition ${
        selected
          ? 'bg-brand-pink text-brand-cream2'
          : 'bg-brand-cream text-brand-red'
      }`}
    >
      {label}
    </button>
  );
}

function ColorThumb({
  label,
  image,
  selected,
  onClick,
}: {
  label: string;
  image?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      title={label}
      className={`relative block h-[76px] w-[76px] rounded-[14px] border-2 bg-white p-1 transition ${
        selected
          ? 'border-brand-pink'
          : 'border-brand-pinkSkin hover:border-brand-pink'
      }`}
    >
      <span
        className="block h-full w-full rounded-[10px] bg-cover bg-center"
        style={image ? { backgroundImage: `url('${image}')` } : undefined}
      />
      {selected && (
        <span className="absolute -bottom-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-brand-pink text-[11px] font-black text-white">
          ✓
        </span>
      )}
    </button>
  );
}

function QtyStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const btn =
    'grid h-9 w-9 place-items-center rounded-full bg-brand-cream font-body text-lg font-bold text-brand-red transition hover:brightness-95';
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-pinkInput p-1.5">
      <button
        type="button"
        aria-label="−"
        className={btn}
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        −
      </button>
      <div className="w-11 text-center font-special text-2xl leading-none text-brand-red">
        {value}
      </div>
      <button
        type="button"
        aria-label="+"
        className={btn}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}

function BrandCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 px-4 py-3 transition ${
        checked ? 'border-brand-pink bg-brand-cream' : 'border-transparent'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="hidden"
      />
      <span
        className={`mt-0.5 grid h-[22px] w-[22px] flex-shrink-0 place-items-center rounded-md border-2 border-brand-pink text-sm font-black text-brand-cream2 ${
          checked ? 'bg-brand-pink' : 'bg-white'
        }`}
      >
        {checked ? '✓' : ''}
      </span>
      <span className="font-body text-[15px] font-semibold text-ink">
        {children}
      </span>
    </label>
  );
}

function BrandAccordion({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b-[1.5px] border-brand-pinkSkin">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-1 py-[18px] text-left font-title text-lg font-bold text-brand-redTitle"
      >
        <span>{title}</span>
        <span
          className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-brand-cream text-base font-bold text-brand-pink transition-transform duration-200 ${
            open ? 'rotate-45' : ''
          }`}
        >
          +
        </span>
      </button>
      {open && (
        <div className="px-1 pb-[22px] font-body text-[15px] font-medium leading-relaxed text-brand-pinkHot">
          {children}
        </div>
      )}
    </div>
  );
}
