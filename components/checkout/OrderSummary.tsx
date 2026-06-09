'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useCartStore } from '@/lib/cart/store';
import { cartItemKey, eur, lineTotal } from '@/lib/types/cart';
import { useCheckout } from './CheckoutProvider';

/**
 * Riepilogo ordine + campi codice sconto / buono + totali.
 * Replica `_OrderSummary` di `CheckoutPage.dart`.
 */
export function OrderSummary() {
  const t = useTranslations('checkout');
  // Selettore atomico: il `.filter` qui dentro creerebbe un nuovo array a ogni
  // render → useSyncExternalStore (Zustand) lo vede sempre "cambiato" → loop
  // infinito. Si seleziona il riferimento grezzo e si filtra in useMemo.
  const allItems = useCartStore((s) => s.items);
  const items = useMemo(() => allItems.filter((i) => !i.soldOut), [allItems]);
  const c = useCheckout();

  const [codeInput, setCodeInput] = useState('');
  const [giftInput, setGiftInput] = useState('');

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-neutral-900">{t('summary')}</h2>
      <div className="mt-3 divide-y divide-neutral-100 border-y border-neutral-100">
        {items.map((it) => {
          const opts = Object.entries(it.options);
          return (
            <div key={cartItemKey(it)} className="flex gap-3 py-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                {it.image && (
                  <Image src={it.image} alt={it.title} fill sizes="64px" className="object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-900">{it.title}</p>
                {opts.length > 0 && (
                  <p className="text-xs text-neutral-500">
                    {opts.map(([k, v]) => `${k}: ${v}`).join(' • ')}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-neutral-500">
                  {eur(it.unitPrice)} × {it.qty}
                </p>
              </div>
              <span className="text-sm font-bold text-neutral-900">{eur(lineTotal(it))}</span>
            </div>
          );
        })}
      </div>

      {/* ── Totali ─────────────────────────────────────────────────────────── */}
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-600">{t('subtotal')}</dt>
          <dd className="text-neutral-900">{eur(c.subtotal)}</dd>
        </div>

        {c.discountAmount > 0 && (
          <div className="flex justify-between text-emerald-700">
            <dt className="flex items-center gap-1">
              {t('discount_applied', { code: c.discountCode ?? '', percent: c.discountPercent })}
              <button
                type="button"
                onClick={() => { c.removeDiscountCode(); setCodeInput(''); }}
                aria-label={t('remove')}
                className="text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            </dt>
            <dd>−{eur(c.discountAmount)}</dd>
          </div>
        )}

        <div className="flex justify-between">
          <dt className="text-neutral-600">
            {t('shipping')} ({c.form.shipCountry.toUpperCase() === 'IT' ? t('shipping_italy') : t('shipping_abroad')})
          </dt>
          <dd className="text-neutral-900">{c.isFreeShipping ? t('free_shipping') : eur(c.shipping)}</dd>
        </div>

        {!c.isEu && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {t('customs_warning')}
          </p>
        )}

        {c.giftCardAmount > 0 && (
          <div className="flex justify-between text-emerald-700">
            <dt className="flex items-center gap-1">
              {t('gift_applied', { code: c.giftCardCode ?? '' })}
              <button
                type="button"
                onClick={() => { c.removeGiftCard(); setGiftInput(''); }}
                aria-label={t('remove')}
                className="text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            </dt>
            <dd>−{eur(c.giftCardAmount)}</dd>
          </div>
        )}

        <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold text-neutral-900">
          <dt>{t('total')}</dt>
          <dd>{eur(c.total)}</dd>
        </div>
      </dl>

      {/* ── Codice sconto ──────────────────────────────────────────────────── */}
      {!c.discountCode && (
        <div className="mt-4">
          <div className="flex gap-2">
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder={t('discount_label')}
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm uppercase"
            />
            <button
              type="button"
              disabled={c.isCheckingCode}
              onClick={() => c.applyDiscountCode(codeInput)}
              className="rounded-md bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {c.isCheckingCode ? '…' : t('apply')}
            </button>
          </div>
          {c.discountError && (
            <p className="mt-1 text-xs text-rose-600">{t(c.discountError)}</p>
          )}
        </div>
      )}

      {/* ── Buono ──────────────────────────────────────────────────────────── */}
      {!c.giftCardCode && (
        <div className="mt-3">
          <div className="flex gap-2">
            <input
              value={giftInput}
              onChange={(e) => setGiftInput(e.target.value.toUpperCase())}
              placeholder={t('gift_label')}
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm uppercase"
            />
            <button
              type="button"
              disabled={c.isCheckingGiftCard}
              onClick={() => c.applyGiftCard(giftInput)}
              className="rounded-md bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {c.isCheckingGiftCard ? '…' : t('apply')}
            </button>
          </div>
          {c.giftCardError && (
            <p className="mt-1 text-xs text-rose-600">{t(c.giftCardError)}</p>
          )}
        </div>
      )}
    </section>
  );
}
