import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { getServerUser } from '@/lib/auth/session';
import { getOrders } from '@/lib/profile/server';
import { eur } from '@/lib/types/cart';

export const dynamic = 'force-dynamic';

/** Mappa lo stato ordine sulla chiave di traduzione corrispondente. */
function statusKey(status: string): string {
  switch (status) {
    case 'paid': return 'status_paid';
    case 'completed': return 'status_completed';
    case 'pending': return 'status_pending';
    case 'cancelled': case 'canceled': return 'status_cancelled';
    default: return 'status_pending';
  }
}

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getServerUser();
  if (!user) redirect(`/${locale}/profile`);

  const t = await getTranslations('orders');
  const orders = await getOrders(user.uid);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-neutral-900">{t('title')}</h1>
      <p className="mt-1 text-sm text-neutral-500">{t('subtitle')}</p>

      {orders.length === 0 ? (
        <div className="mt-8">
          <p className="font-medium text-neutral-900">{t('empty_title')}</p>
          <p className="mt-1 text-sm text-neutral-500">{t('empty_body')}</p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/profile/orders/${o.id}`}
                className="flex items-center justify-between gap-4 py-4 hover:bg-neutral-50"
              >
                <div>
                  <p className="font-mono text-sm text-neutral-900">#{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-neutral-500">
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString(locale) : '—'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-900">
                    {eur(o.amountCents / 100)}
                  </p>
                  <p className="text-xs text-neutral-500">{t(statusKey(o.status))}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
