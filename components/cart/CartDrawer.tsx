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

      {/* Pannello: 420px, full-width sotto 520px (DESIGN_SYSTEM §4.5) */}
      <aside
        role="dialog"
        aria-label={t('title')}
        aria-hidden={!isOpen}
        className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white shadow-xl transition-transform min-[520px]:w-[420px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="font-special text-[28px] text-brand-pink">{t('title')}</h2>
          <button
            type="button"
            onClick={close}
            aria-label={t('close')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-brand-pink hover:bg-brand-pinkLight/40"
          >
            ✕
          </button>
        </header>
        <div className="h-px bg-brand-pinkLight" />

        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-5 text-neutral-500">
            {t('empty')}
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-brand-pinkLight/60 overflow-y-auto px-5">
              {items.map((item) => (
                <CartLine key={cartItemKey(item)} item={item} />
              ))}
            </ul>

            <footer className="border-t border-brand-pinkLight px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-ink">{t('subtotal')}</span>
                <span className="text-xl font-bold text-brand-red">{eur(sub)}</span>
              </div>
              <p className="mt-2 text-xs text-neutral-500">{t('shipping_note')}</p>
              {!canCheckout && (
                <p className="mt-2 text-xs font-medium text-brand-red">
                  {t('min_order', { amount: eur(missing) })}
                </p>
              )}
              {canCheckout ? (
                <Link
                  href="/checkout"
                  onClick={close}
                  className="mt-4 block w-full rounded-full bg-brand-pink px-6 py-3.5 text-center text-lg font-semibold text-white transition hover:brightness-105"
                >
                  {t('checkout_btn')}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-4 w-full cursor-not-allowed rounded-full bg-brand-pink/40 px-6 py-3.5 text-lg font-semibold text-white"
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
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[10px] bg-black/[0.06]">
        {item.image && (
          <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-ink">{item.title}</p>
          <button
            type="button"
            onClick={() => remove(key)}
            className="text-xs text-neutral-400 hover:text-brand-red"
          >
            {t('remove')}
          </button>
        </div>

        {item.soldOut && (
          <span className="text-xs font-bold text-brand-red">{tp('badge.soldOut')}</span>
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
              className="h-7 w-7 rounded-full border border-brand-pink text-brand-pink disabled:opacity-40"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
            <button
              type="button"
              onClick={() => increment(key)}
              className="h-7 w-7 rounded-full border border-brand-pink text-brand-pink"
            >
              +
            </button>
          </div>
          <span className="text-sm font-bold text-brand-red">{eur(lineTotal(item))}</span>
        </div>

        {editingNote ? (
          <div className="mt-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t('note_hint')}
              rows={2}
              className="ui-input text-xs"
            />
            <div className="mt-1 flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  updateNote(key, draft);
                  setEditingNote(false);
                }}
                className="font-semibold text-brand-pink"
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
