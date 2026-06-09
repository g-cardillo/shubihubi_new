'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/**
 * Pagina pagamento annullato. Replica `CheckoutCancelPage.dart`: il carrello
 * resta intatto, si può riprovare il checkout o tornare allo shop.
 */
export function CheckoutCancel() {
  const t = useTranslations('checkout');
  const orderId = useSearchParams().get('orderId');

  return (
    <div className="flex flex-col items-stretch text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-pink-100 text-3xl text-rose-600">
        ✕
      </div>
      <h1 className="mt-6 text-3xl font-bold text-rose-600">{t('not_completed')}</h1>
      <p className="mt-3 text-sm text-neutral-600">{t('not_completed_body')}</p>
      <p className="mt-2 text-sm font-semibold text-pink-500">{t('cart_preserved')}</p>

      <Link
        href={orderId ? `/checkout?orderId=${orderId}` : '/checkout'}
        className="mt-9 inline-flex h-[52px] w-full items-center justify-center rounded-full bg-pink-500 px-6 text-base font-semibold text-white hover:bg-pink-600"
      >
        {t('retry')}
      </Link>
      <Link
        href="/shop"
        className="mt-3 inline-flex h-[52px] w-full items-center justify-center rounded-full border-2 border-pink-400 px-6 text-base font-semibold text-rose-600 hover:bg-pink-50"
      >
        {t('go_shop')}
      </Link>
    </div>
  );
}
