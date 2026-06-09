'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import type { Product } from '@/lib/types/product';
import type { CartItem } from '@/lib/types/cart';
import { pickLocalized } from '@/lib/i18n/localized';
import { useCartStore } from '@/lib/cart/store';
import { ProductGallery } from './ProductGallery';
import { ProductPrice } from './ProductPrice';

/**
 * Dettaglio prodotto: galleria + info + selettori varianti
 * (colore / formato / cornice). Lo stato di selezione è client.
 *
 * NOTA: il bottone "aggiungi al carrello" è un placeholder — il carrello
 * (CartProvider, merge guest↔user) arriva nella Fase 3. Qui resta non
 * funzionante di proposito, ma con gli stati visivi corretti (esaurito).
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

  const [color, setColor] = useState<string | null>(
    product.colorChangeable && product.colors.length ? product.colors[0] : null,
  );
  const [format, setFormat] = useState<string | null>(
    product.formats.length ? product.formats[0] : null,
  );
  const [frame, setFrame] = useState(false);

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
      qty: 1,
      soldOut: product.isSoldOut,
      options,
      note: null,
      image: product.imageUrls[0] ?? null,
    };
    addItem(item);
  }

  const extras: Array<{ key: string; label: string; value: string }> = [
    { key: 'tecnica', label: t('extras.tecnica'), value: pickLocalized(product.tecnica_it, product.tecnica_eng, locale) },
    { key: 'productDetails', label: t('extras.productDetails'), value: pickLocalized(product.productDetails_it, product.productDetails_eng, locale) },
    { key: 'personalizzazione', label: t('extras.personalizzazione'), value: pickLocalized(product.personalizzazione_it, product.personalizzazione_eng, locale) },
    { key: 'confezione', label: t('extras.confezione'), value: pickLocalized(product.confezione_it, product.confezione_eng, locale) },
    { key: 'tempiRealizzazione', label: t('extras.tempiRealizzazione'), value: pickLocalized(product.tempiRealizzazione_it, product.tempiRealizzazione_eng, locale) },
  ].filter((e) => e.value.trim().length > 0);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <ProductGallery images={product.imageUrls} alt={title} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {product.isNew && <Tag className="bg-neutral-900 text-white">{t('badge.new')}</Tag>}
            {product.isLimited && <Tag className="bg-amber-500 text-white">{t('badge.limited')}</Tag>}
            {product.isSoldOut && <Tag className="bg-neutral-200 text-neutral-700">{t('badge.soldOut')}</Tag>}
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">
            {title}
          </h1>
          <ProductPrice product={product} size="lg" />
        </div>

        {description && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-600">
            {description}
          </p>
        )}

        {product.colorChangeable && product.colors.length > 0 && (
          <Selector
            label={t('options.color')}
            options={product.colors}
            value={color}
            onChange={setColor}
          />
        )}

        {product.formats.length > 0 && (
          <Selector
            label={t('options.format')}
            options={product.formats}
            value={format}
            onChange={setFormat}
          />
        )}

        {product.corniceAvailable && (
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={frame}
              onChange={(e) => setFrame(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            {t('options.frame')}
          </label>
        )}

        <button
          type="button"
          disabled={product.isSoldOut}
          onClick={handleAddToCart}
          className="mt-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition enabled:hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {product.isSoldOut ? t('badge.soldOut') : t('addToCart')}
        </button>

        {extras.length > 0 && (
          <div className="mt-2 divide-y divide-neutral-200 border-t border-neutral-200">
            {extras.map((e) => (
              <details key={e.key} className="group py-3">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-neutral-900">
                  {e.label}
                  <span className="text-neutral-400 transition group-open:rotate-180">⌄</span>
                </summary>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-600">
                  {e.value}
                </p>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Tag({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

function Selector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-neutral-900">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              value === opt
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 text-neutral-700 hover:border-neutral-500'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
