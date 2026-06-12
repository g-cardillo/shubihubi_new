'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import type { Product } from '@/lib/types/product';
import { type CartItem, eur } from '@/lib/types/cart';
import { pickLocalized } from '@/lib/i18n/localized';
import { useCartStore } from '@/lib/cart/store';
import { framePriceFor, giftPriceFor } from '@/lib/cart/options';
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
  const [gift, setGift] = useState(false);
  const [qty, setQty] = useState(1);
  const [wishlist, setWishlist] = useState(false);

  // Prezzo unitario live = base + add-on selezionati (cornice / confezione
  // regalo). Identico al calcolo del backend `createDraftOrder`.
  const framePrice = framePriceFor(product.macroId);
  const giftPrice = giftPriceFor(product.macroId);
  const unitPrice =
    product.effectivePrice + (frame ? framePrice : 0) + (gift ? giftPrice : 0);
  const totalPrice = unitPrice * qty;

  function handleAddToCart() {
    // Opzioni con chiavi stabili (color/format/frame/gift) per una merge-key
    // coerente; vengono convertite nelle chiavi backend al checkout.
    const options: Record<string, string> = {};
    if (product.colorChangeable && color) options.color = color;
    if (format) options.format = format;
    if (frame) options.frame = 'on';
    if (gift) options.gift = 'on';

    const item: CartItem = {
      productId: product.id,
      title,
      unitPrice,
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

        {/* Selettore colore — pastiglie circolari col colore reale (parità Flutter) */}
        {hasColors && (
          <div>
            <FieldLabel>{t('options.color')}</FieldLabel>
            <div className="flex flex-wrap gap-2.5">
              {product.colors.map((c) => (
                <ColorSwatch
                  key={c}
                  label={c}
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

        {/* Cornice + Confezione regalo — mutuamente esclusive: si può scegliere
            una sola opzione, o nessuna. */}
        <div className="flex flex-col gap-2.5">
          {product.corniceAvailable && (
            <BrandCheckbox
              checked={frame}
              onChange={(v) => {
                setFrame(v);
                if (v) setGift(false);
              }}
              addon={`+${eur(framePrice)}`}
            >
              {t('options.frame')}
            </BrandCheckbox>
          )}
          <BrandCheckbox
            checked={gift}
            onChange={(v) => {
              setGift(v);
              if (v) setFrame(false);
            }}
            addon={`+${eur(giftPrice)}`}
          >
            {t('options.gift')}
          </BrandCheckbox>
        </div>

        {/* Add to cart — prezzo live = (base + add-on) × quantità */}
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
              {eur(totalPrice)}
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

/**
 * Pastiglia colore — replica il color selector del Flutter
 * (`ProductDetailView.dart`): cerchio 36×36 col colore reale parsato dalla
 * stringa. Selezionato → bordo 3px rosa + spunta (rossa su colore chiaro,
 * bianca su scuro). Colore sconosciuto → pattern a scacchi pixelato.
 */
function ColorSwatch({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  const swatch = parseProductColor(label);
  const isLight = swatch ? isLightColor(swatch) : true;
  // Per il colore sconosciuto: pattern a scacchi 4px (come `_PixelPatternPainter`).
  const checker: React.CSSProperties = {
    backgroundColor: '#EEEEEE',
    backgroundImage:
      'linear-gradient(45deg, #BBBBBB 25%, transparent 25%), linear-gradient(-45deg, #BBBBBB 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #BBBBBB 75%), linear-gradient(-45deg, transparent 75%, #BBBBBB 75%)',
    backgroundSize: '8px 8px',
    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0',
  };
  // Spunta: rossa su sfondo chiaro / sconosciuto, bianca su scuro.
  const checkColor = swatch ? (isLight ? '#D20001' : '#FFFFFF') : '#D20001';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      title={label}
      className={`grid h-9 w-9 place-items-center rounded-full transition ${
        selected ? 'border-[3px] border-brand-pink' : 'border-[1.5px] border-brand-pinkSkin'
      }`}
      style={swatch ? { backgroundColor: swatch } : checker}
    >
      {selected && (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke={checkColor}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12l5 5L20 6" />
        </svg>
      )}
    </button>
  );
}

/**
 * Converte la stringa colore di un prodotto in un colore CSS, o `null` se
 * sconosciuto (→ pattern a scacchi). Replica `_parseProductColor` del Flutter:
 * accetta hex #RGB / #RRGGBB / #RRGGBBAA e una mappa di nomi IT/EN.
 */
function parseProductColor(s: string): string | null {
  const t = s.trim();

  if (t.startsWith('#')) {
    const hex = t.slice(1).replace(/\s/g, '');
    if (/^[0-9a-fA-F]{3}$/.test(hex)) {
      return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
    }
    if (/^[0-9a-fA-F]{6}$/.test(hex)) return `#${hex}`;
    if (/^[0-9a-fA-F]{8}$/.test(hex)) {
      // Flutter usa ARGB; CSS usa RRGGBBAA → sposto l'alpha in coda.
      const a = hex.slice(0, 2);
      const rgb = hex.slice(2);
      return `#${rgb}${a}`;
    }
  }

  const names: Record<string, string> = {
    rosso: '#E53935', red: '#E53935',
    rosa: '#F48FB1', pink: '#F48FB1',
    fucsia: '#E91E8C', fuchsia: '#E91E8C',
    arancione: '#FF7043', orange: '#FF7043',
    giallo: '#FFD600', yellow: '#FFD600',
    verde: '#43A047', green: '#43A047',
    azzurro: '#29B6F6', celeste: '#29B6F6',
    blu: '#1E88E5', blue: '#1E88E5',
    indaco: '#3949AB', indigo: '#3949AB',
    viola: '#8E24AA', purple: '#8E24AA',
    lilla: '#BA68C8',
    marrone: '#6D4C41', brown: '#6D4C41',
    beige: '#F5F5DC',
    grigio: '#757575', gray: '#757575', grey: '#757575',
    bianco: '#FFFFFF', white: '#FFFFFF',
    nero: '#212121', black: '#212121',
    crema: '#FFF8E1', cream: '#FFF8E1',
    corallo: '#FF7F7F', coral: '#FF7F7F',
    turchese: '#26C6DA', turquoise: '#26C6DA',
    oro: '#FFD700', gold: '#FFD700',
    argento: '#C0C0C0', silver: '#C0C0C0',
  };

  return names[t.toLowerCase()] ?? null;
}

/**
 * Stima se un colore è "chiaro", per scegliere il colore della spunta.
 * Replica `ThemeData.estimateBrightnessForColor`: luminanza relativa WCAG,
 * soglia `(L + 0.05)^2 > 0.15`.
 */
function isLightColor(hex: string): boolean {
  const h = hex.replace('#', '').slice(0, 6);
  const toLin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const r = toLin(parseInt(h.slice(0, 2), 16));
  const g = toLin(parseInt(h.slice(2, 4), 16));
  const b = toLin(parseInt(h.slice(4, 6), 16));
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return (L + 0.05) * (L + 0.05) > 0.15;
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
  addon,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  addon?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 transition ${
        checked ? 'border-brand-pink bg-brand-cream' : 'border-brand-pinkSkin'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="hidden"
      />
      <span
        className={`grid h-[22px] w-[22px] flex-shrink-0 place-items-center rounded-md border-2 border-brand-pink text-sm font-black text-brand-cream2 ${
          checked ? 'bg-brand-pink' : 'bg-white'
        }`}
      >
        {checked ? '✓' : ''}
      </span>
      <span className="flex-1 font-body text-[15px] font-semibold text-ink">
        {children}
      </span>
      {addon && (
        <span className="font-body text-[15px] font-bold text-brand-pink">
          {addon}
        </span>
      )}
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
