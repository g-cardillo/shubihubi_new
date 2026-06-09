import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { getServerAdmin } from '@/lib/auth/session';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

// Pannello admin: privato, interattivo, mai indicizzato.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Prima barriera lato server: ruolo dal custom claim nel session cookie.
  // Nessuna sessione → gate di login; sessione senza ruolo admin → home.
  // Il client AdminGuard (token refresh) e le Cloud Function admin restano il
  // controllo autorevole a valle.
  const session = await getServerAdmin();
  if (!session) redirect(`/${locale}/profile`);
  if (!session.isAdmin) redirect(`/${locale}`);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-neutral-900">Admin Panel</h1>
      <div className="mt-6">
        <AdminGuard>
          <AdminDashboard />
        </AdminGuard>
      </div>
    </main>
  );
}
