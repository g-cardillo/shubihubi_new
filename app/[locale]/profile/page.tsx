import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { ProfileGate } from '@/components/auth/ProfileGate';

// Profilo: pagina dinamica (dipende dallo stato auth lato client), non indicizzata.
export const dynamic = 'force-dynamic';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <ProfileGate />
    </main>
  );
}
