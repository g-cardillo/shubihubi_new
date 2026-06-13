'use client';

import { useTranslations } from 'next-intl';
import { useCartStore } from '@/lib/cart/store';
import { useSoldOutReconcile } from '@/lib/cart/useSoldOutReconcile';
import { Link } from '@/i18n/navigation';
import { CheckoutProvider } from './CheckoutProvider';
import { OrderSummary } from './OrderSummary';
import { CustomerForm } from './CustomerForm';
import { PayBox } from './PayBox';

/**
 * Pagina checkout (client). Replica `CheckoutPage.dart`: layout a due colonne
 * su schermi larghi (riepilogo a sinistra, form+pagamento a destra), colonna
 * singola su mobile. Carrello vuoto → messaggio + link allo shop; carrello con
 * soli prodotti esauriti → messaggio dedicato e checkout disabilitato.
 */
export function CheckoutClient() {
  const t = useTranslations('checkout');
  const hydrated = useCartStore((s) => s.hydrated);
  const hasAnyItems = useCartStore((s) => s.items.length > 0);
  const hasAvailable = useCartStore((s) => s.items.some((i) => !i.soldOut));

  // Rilegge lo stato soldOut fresco da Firestore all'ingresso nel checkout, così
  // un prodotto esauritosi dopo l'aggiunta viene escluso da riepilogo e totale.
  useSoldOutReconcile();

  if (!hydrated) {
    return <p className="py-20 text-center text-sm text-neutral-400">…</p>;
  }

  if (!hasAvailable) {
    // Distingue il carrello vuoto dal carrello con soli prodotti esauriti.
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-neutral-600">
          {hasAnyItems ? t('no_available') : t('empty')}
        </p>
        <Link href="/shop" className="mt-3 inline-block underline">
          {t('go_shop')}
        </Link>
      </div>
    );
  }

  return (
    <CheckoutProvider>
      <h1 className="text-2xl font-semibold text-neutral-900">{t('title')}</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_minmax(0,420px)] lg:items-start">
        <OrderSummary />
        <div className="flex flex-col gap-6">
          <CustomerForm />
          <PayBox />
        </div>
      </div>
    </CheckoutProvider>
  );
}
