'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';

/**
 * Guard client per le pagine protette che girano lato client (es. indirizzi).
 * Le pagine server protette usano invece `getServerUser()` + redirect.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const t = useTranslations('auth');
  const { user, loading } = useAuth();

  if (loading) return <p className="py-20 text-center text-sm text-neutral-400">…</p>;
  if (!user) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-neutral-600">{t('sign_in_account')}</p>
        <Link href="/profile" className="mt-3 inline-block underline">
          {t('sign_in')}
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
