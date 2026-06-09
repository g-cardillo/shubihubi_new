'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCartStore } from '@/lib/cart/store';
import {
  type CartItem,
  cartItemKey,
  lineTotal,
  subtotal,
  eur,
  MIN_ORDER_AMOUNT,
} from '@/lib/types/cart';

/**
 * CartDrawer — pannello carrello globale (client). Si apre/chiude tramite lo
 * stato `isOpen` dello store. Replica i contenuti di `CartDrawer.dart`:
 * righe con quantità, nota, rimozione, subtotale, nota spedizione, minimo
 * d'ordine e bottone checkout (link a `/checkout` quando il minimo è raggiunto).
 */
export function CartDrawer() {
  const t = useTranslations('cart');
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const items = useCartStore((s) => s.items);

  const sub = subtotal(items);
  const canCheckout = sub >= MIN_ORDER_AMOUNT;
  const missing = Math.max(0, MIN_ORDER_AMOUNT - sub);

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden={!isOpen}
        onClick={close}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Pannello */}
      <aside
        role="dialog"
        aria-label={t('title')}
        aria-hidden={!isOpen}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">{t('title')}</h2>
          <button
            type="button"
            onClick={close}
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            {t('close')}
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-5 text-sm text-neutral-500">
            {t('empty')}
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-neutral-100 overflow-y-auto px-5">
              {items.map((item) => (
                <CartLine key={cartItemKey(item)} item={item} />
              ))}
            </ul>

            <footer className="border-t border-neutral-200 px-5 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">{t('subtotal')}</span>
                <span className="font-semibold text-neutral-900">{eur(sub)}</span>
              </div>
              <p className="mt-2 text-xs text-neutral-500">{t('shipping_note')}</p>
              {!canCheckout && (
                <p className="mt-2 text-xs text-amber-700">
                  {t('min_order', { amount: eur(missing) })}
                </p>
              )}
              {canCheckout ? (
                <Link
                  href="/checkout"
                  onClick={close}
                  className="mt-4 block w-full rounded-full bg-neutral-900 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-neutral-700"
                >
                  {t('checkout_btn')}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-4 w-full cursor-not-allowed rounded-full bg-neutral-300 px-6 py-3 text-sm font-semibold text-white"
                >
                  {t('checkout_btn')}
                </button>
              )}
            </footer>
          </>
        )}
      </aside>
    </>
  );
}

function CartLine({ item }: { item: CartItem }) {
  const t = useTranslations('cart');
  const tp = useTranslations('product');
  const key = cartItemKey(item);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const remove = useCartStore((s) => s.remove);
  const updateNote = useCartStore((s) => s.updateNote);

  const [editingNote, setEditingNote] = useState(false);
  const [draft, setDraft] = useState(item.note ?? '');

  const optionLabels: Record<string, string> = {
    color: tp('options.color'),
    format: tp('options.format'),
    frame: tp('options.frame'),
  };
  const optionEntries = Object.entries(item.options);

  return (
    <li className="flex gap-3 py-4">
      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-100">
        {item.image && (
          <Image src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-neutral-900">{item.title}</p>
          <button
            type="button"
            onClick={() => remove(key)}
            className="text-xs text-neutral-400 hover:text-rose-600"
          >
            {t('remove')}
          </button>
        </div>

        {item.soldOut && (
          <span className="text-xs font-medium text-rose-600">{tp('badge.soldOut')}</span>
        )}

        {optionEntries.length > 0 && (
          <ul className="flex flex-wrap gap-x-3 text-xs text-neutral-500">
            {optionEntries.map(([k, v]) => (
              <li key={k}>
                {optionLabels[k] ?? k}: {k === 'frame' ? '✓' : v}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => decrement(key)}
              disabled={item.qty <= 1}
              className="h-6 w-6 rounded-full border border-neutral-300 text-neutral-700 disabled:opacity-40"
            >
              −
            </button>
            <span className="w-6 text-center text-sm">{item.qty}</span>
            <button
              type="button"
              onClick={() => increment(key)}
              className="h-6 w-6 rounded-full border border-neutral-300 text-neutral-700"
            >
              +
            </button>
          </div>
          <span className="text-sm font-semibold text-neutral-900">{eur(lineTotal(item))}</span>
        </div>

        {editingNote ? (
          <div className="mt-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t('note_hint')}
              rows={2}
              className="w-full rounded-md border border-neutral-300 p-2 text-xs"
            />
            <div className="mt-1 flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  updateNote(key, draft);
                  setEditingNote(false);
                }}
                className="font-medium text-neutral-900"
              >
                {t('note_save')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(item.note ?? '');
                  setEditingNote(false);
                }}
                className="text-neutral-500"
              >
                {t('note_cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingNote(true)}
            className="mt-1 self-start text-xs text-neutral-500 hover:text-neutral-900"
          >
            {item.note ? `📝 ${item.note}` : t('note_add')}
          </button>
        )}
      </div>
    </li>
  );
}
