'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { capturePaypalOrder } from '@/lib/checkout/repository';

/**
 * Ritorno da PayPal. Replica `PaypalReturnPage.dart`: cattura il pagamento
 * (`paypalCaptureOrder`) e instrada a success/cancel in base all'esito.
 * Params attesi: `firebaseOrderId` (nostro orderId) e `token` (paypalOrderId).
 */
export function PaypalReturn() {
  const t = useTranslations('checkout');
  const params = useSearchParams();
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const firebaseOrderId = params.get('firebaseOrderId');
    const paypalOrderId = params.get('token');

    if (!firebaseOrderId || !paypalOrderId) {
      router.replace('/checkout/cancel');
      return;
    }

    (async () => {
      try {
        const ok = await capturePaypalOrder(paypalOrderId);
        if (ok) {
          router.replace(`/checkout/success?orderId=${firebaseOrderId}`);
        } else {
          router.replace('/checkout/cancel');
        }
      } catch {
        router.replace('/checkout/cancel');
      }
    })();
  }, [params, router]);

  return (
    <div className="flex flex-col items-center py-24">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-pink-300 border-t-pink-500" />
      <p className="mt-4 text-sm text-neutral-600">{t('processing')}</p>
    </div>
  );
}
