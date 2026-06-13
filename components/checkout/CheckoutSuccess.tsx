'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Link } from '@/i18n/navigation';
import { useCartStore } from '@/lib/cart/store';

/**
 * Pagina di conferma ordine. Replica `CheckoutSuccessPAge.dart`: legge in
 * realtime `order_public/{orderId}` (read pubblico consentito), mostra lo stato
 * (pagato / in verifica) e, alla conferma, svuota il carrello una sola volta.
 */
interface PublicItem {
  title?: string;
  qty?: number;
  lineTotalCents?: number;
  note?: string | null;
  imageUrl?: string | null;
}
interface PublicOrder {
  status?: string;
  amountCents?: number;
  currency?: string;
  items?: PublicItem[];
  customer?: { firstName?: string; email?: string };
}

function money(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')} ${currency.toUpperCase()}`;
}

export function CheckoutSuccess() {
  const t = useTranslations('checkout');
  const orderId = useSearchParams().get('orderId');

  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const cartCleared = useRef(false);
  const clearCart = useCartStore((s) => s.clear);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      doc(db, 'order_public', orderId),
      (snap) => {
        setLoading(false);
        if (!snap.exists()) {
          setNotFound(true);
          return;
        }
        const data = snap.data() as PublicOrder;
        setOrder(data);
        if (data.status === 'paid' && !cartCleared.current) {
          cartCleared.current = true;
          clearCart();
        }
      },
      () => {
        setLoading(false);
        setNotFound(true);
      },
    );
    return () => unsub();
  }, [orderId, clearCart]);

  if (!orderId) return <CenteredMessage text={t('missing_order_id')} />;
  if (loading) return <CenteredMessage text={t('order_loading')} />;
  if (notFound || !order) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-semibold text-brand-red">{t('order_not_found')}</h1>
        <p className="mt-2 text-sm text-neutral-500">
          {t('order_not_found_body', { id: orderId })}
        </p>
        <GoShopButton label={t('go_shop')} />
      </div>
    );
  }

  const isPaid = order.status === 'paid';
  const currency = (order.currency ?? 'eur').toUpperCase();
  const items = order.items ?? [];
  const firstName = order.customer?.firstName ?? '';
  const email = order.customer?.email ?? '';

  return (
    <div className="flex flex-col items-stretch">
      <div className="text-center">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-3xl text-white ${
            isPaid ? 'bg-brand-pink' : 'bg-amber-400'
          }`}
        >
          {isPaid ? '✓' : '⏳'}
        </div>
        <h1 className="mt-5 text-3xl font-bold text-brand-red">
          {isPaid ? t('payment_confirmed') : t('payment_verifying')}
        </h1>
        {isPaid && firstName && (
          <p className="mt-2 text-lg font-semibold text-brand-pink">
            {t('thank_you', { name: firstName })}
          </p>
        )}
        <p className="mt-1 text-sm text-neutral-500">
          {isPaid ? t('helper_paid') : t('helper_pending')}
        </p>
        {isPaid && email && (
          <p className="mt-1 text-sm font-medium text-brand-pink">{email}</p>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-brand-pinkLight bg-white px-4 py-3 text-sm">
        <span className="font-bold uppercase tracking-wide text-brand-pink">Order ID </span>
        <span className="break-all text-brand-red">{orderId}</span>
      </div>

      {isPaid && items.length > 0 && (
        <>
          <p className="mt-5 text-xs font-bold uppercase tracking-wide text-brand-pink">
            {t('items_count', { count: items.length })}
          </p>
          <ul className="mt-2 divide-y divide-pink-100 rounded-2xl border border-brand-pinkLight bg-white">
            {items.map((it, i) => (
              <li key={i} className="flex items-start gap-3 p-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  {it.imageUrl && (
                    <Image src={it.imageUrl} alt={it.title ?? ''} fill sizes="48px" className="object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-red">
                    {it.title ?? t('order_product_fallback')}
                  </p>
                  {it.note && <p className="text-xs italic text-neutral-500">{it.note}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-brand-pink">×{it.qty ?? 1}</p>
                  <p className="text-sm font-bold text-brand-red">
                    {money(it.lineTotalCents ?? 0, currency)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {isPaid && (
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-brand-pink px-5 py-4 text-white">
          <span className="font-semibold">{t('total_label')}</span>
          <span className="text-xl font-bold">{money(order.amountCents ?? 0, currency)}</span>
        </div>
      )}

      <GoShopButton label={t('go_shop')} />
    </div>
  );
}

function CenteredMessage({ text }: { text: string }) {
  return <p className="py-24 text-center text-sm text-brand-pink">{text}</p>;
}

function GoShopButton({ label }: { label: string }) {
  return (
    <Link
      href="/shop"
      className="cta-bounce mt-9 inline-flex h-[52px] w-full items-center justify-center rounded-full bg-brand-pink px-6 text-base font-semibold text-white hover:brightness-105"
    >
      {label}
    </Link>
  );
}
