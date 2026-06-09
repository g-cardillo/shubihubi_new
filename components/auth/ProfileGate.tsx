'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { AuthPanel } from './AuthPanel';

/**
 * Gate del profilo (replica `auth_gate.dart`):
 *  - caricamento → segnaposto
 *  - non loggato → pannello di accesso/registrazione
 *  - loggato     → vista profilo con link alle sezioni e logout
 */
export function ProfileGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="py-20 text-center text-sm text-neutral-400">…</p>;
  }
  if (!user) {
    return <AuthPanel />;
  }
  return <ProfileView />;
}

function ProfileView() {
  const t = useTranslations('auth');
  const to = useTranslations('orders');
  const tw = useTranslations('wishlist');
  const { user, signOut } = useAuth();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold text-neutral-900">{t('profile_title')}</h1>
      <p className="mt-2 text-neutral-700">
        {user.displayName || t('user_fallback')}
      </p>
      <p className="text-sm text-neutral-500">{user.email}</p>

      <nav className="mt-8 flex flex-col divide-y divide-neutral-200 border-y border-neutral-200">
        <ProfileLink href="/profile/orders" label={to('title')} />
        <ProfileLink href="/profile/wishlist" label={tw('title')} />
        <ProfileLink href="/profile/addresses" label="Indirizzi / Addresses" />
      </nav>

      <button
        type="button"
        onClick={() => signOut()}
        className="mt-8 w-full rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
      >
        {t('logout')}
      </button>
    </div>
  );
}

function ProfileLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex items-center justify-between py-3 text-sm hover:bg-neutral-50">
      <span>{label}</span>
      <span className="text-neutral-400">›</span>
    </Link>
  );
}
