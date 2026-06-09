import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { getServerUser } from '@/lib/auth/session';
import { getOrder } from '@/lib/profile/server';
import { eur } from '@/lib/types/cart';

export const dynamic = 'force-dynamic';

function statusKey(status: string): string {
  switch (status) {
    case 'paid': return 'status_paid';
    case 'completed': return 'status_completed';
    case 'pending': return 'status_pending';
    case 'cancelled': case 'canceled': return 'status_cancelled';
    default: return 'status_pending';
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const user = await getServerUser();
  if (!user) redirect(`/${locale}/profile`);

  const t = await getTranslations('orders');
  const order = await getOrder(user.uid, id);

  if (!order) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
        <p className="text-neutral-700">{t('not_found')}</p>
        <Link href="/profile/orders" className="mt-4 inline-block underline">
          {t('title')}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/profile/orders" className="text-sm text-neutral-500 hover:underline">
        ‹ {t('title')}
      </Link>

      <h1 className="mt-3 font-mono text-xl font-semibold text-neutral-900">#{order.id}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {order.createdAt ? new Date(order.createdAt).toLocaleString(locale) : '—'}
      </p>

      <div className="mt-4 flex items-center gap-4 text-sm">
        <span className="text-neutral-600">
          {t('status_label')}: <strong>{t(statusKey(order.status))}</strong>
        </span>
      </div>

      <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-neutral-400">
        {t('products')}
      </h2>
      <ul className="mt-2 divide-y divide-neutral-200 border-y border-neutral-200">
        {order.items.map((it, i) => (
          <li key={i} className="flex items-center justify-between py-3 text-sm">
            <span>
              {it.title || t('product_fallback')}
              <span className="text-neutral-400"> × {it.qty}</span>
            </span>
            {it.unitPrice != null && (
              <span className="font-medium">{eur(it.unitPrice * it.qty)}</span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-neutral-300 pt-4">
        <span className="font-medium text-neutral-900">{t('total_label')}</span>
        <span className="text-lg font-semibold text-neutral-900">
          {eur(order.amountCents / 100)}
        </span>
      </div>
    </main>
  );
}
