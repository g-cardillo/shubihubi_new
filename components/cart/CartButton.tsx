'use client';

import { useTranslations } from 'next-intl';
import { useCartStore } from '@/lib/cart/store';
import { totalQty } from '@/lib/types/cart';

/**
 * Pulsante carrello globale con badge quantità. Apre il CartDrawer.
 * Posizionato flottante perché la navbar arriva in una fase successiva.
 * Il badge si mostra solo dopo l'idratazione da localStorage (no mismatch SSR).
 */
export function CartButton() {
  const t = useTranslations('nav');
  const toggle = useCartStore((s) => s.toggle);
  const hydrated = useCartStore((s) => s.hydrated);
  const count = useCartStore((s) => totalQty(s.items));

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('cart')}
      className="fixed right-4 top-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg hover:bg-neutral-700"
    >
      <span aria-hidden className="text-lg">🛒</span>
      {hydrated && count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-semibold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
