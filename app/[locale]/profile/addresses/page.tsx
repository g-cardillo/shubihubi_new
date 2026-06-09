import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { AddressesForm } from '@/components/auth/AddressesForm';

export const dynamic = 'force-dynamic';

export default async function AddressesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('addresses');

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-neutral-900">{t('title')}</h1>
      <RequireAuth>
        <AddressesForm />
      </RequireAuth>
    </main>
  );
}
