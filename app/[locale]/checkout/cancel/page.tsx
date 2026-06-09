import { Suspense } from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { CheckoutCancel } from '@/components/checkout/CheckoutCancel';

// Pagamento annullato: pagina privata, non indicizzata.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function CheckoutCancelPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6">
      <Suspense fallback={null}>
        <CheckoutCancel />
      </Suspense>
    </main>
  );
}
