'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth/AuthProvider';
import { authErrorKey, errorCode } from '@/lib/auth/errors';

type Mode = 'signin' | 'signup' | 'checkEmail';

/**
 * Pannello di autenticazione: login email/Google, registrazione, reset password,
 * reinvio verifica. Replica i flussi di `auth_gate.dart` / `AuthController`.
 */
export function AuthPanel() {
  const t = useTranslations('auth');
  const { signInEmail, signUpEmail, signInGoogle, resetPassword, resendVerification } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [notVerified, setNotVerified] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
    } catch (e) {
      const code = errorCode(e);
      setNotVerified(code === 'email-not-verified');
      setError(t(authErrorKey(code)));
    } finally {
      setBusy(false);
    }
  };

  if (mode === 'checkEmail') {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">{t('check_email_title')}</h1>
        <p className="mt-3 text-sm text-neutral-600">{t('check_email_subtitle')}</p>
        <p className="mt-1 font-medium text-neutral-900">{email}</p>
        <p className="mt-3 text-xs text-neutral-500">{t('check_email_hint')}</p>
        <button
          type="button"
          onClick={() => { setMode('signin'); setInfo(null); setError(null); }}
          className="mt-6 text-sm underline"
        >
          {t('check_email_go_login')}
        </button>
      </div>
    );
  }

  const isSignup = mode === 'signup';

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold text-neutral-900">
        {isSignup ? t('create_account') : t('welcome_back')}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        {isSignup ? t('create_account_subtitle') : t('sign_in_account')}
      </p>

      <button
        type="button"
        disabled={busy}
        onClick={() => run(signInGoogle)}
        className="mt-6 w-full rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
      >
        {t('sign_in_google')}
      </button>

      <div className="my-4 text-center text-xs uppercase text-neutral-400">{t('or')}</div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isSignup) {
            run(async () => {
              await signUpEmail(name, email, password);
              setMode('checkEmail');
            });
          } else {
            run(() => signInEmail(email, password));
          }
        }}
        className="flex flex-col gap-3"
      >
        {isSignup && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('name_optional')}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        )}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('password')}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {info && <p className="text-sm text-emerald-700">{info}</p>}

        {notVerified && (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                await resendVerification(email, password);
                setInfo(t('verification_resent'));
                setNotVerified(false);
              })
            }
            className="self-start text-xs underline"
          >
            {t('resend_verification')}
          </button>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 w-full rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {isSignup ? t('create_account') : t('sign_in_email')}
        </button>
      </form>

      {!isSignup && (
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run(async () => {
              if (!email.trim()) {
                setError(t('password_reset_enter_email'));
                return;
              }
              await resetPassword(email);
              setInfo(t('password_reset_sent'));
            })
          }
          className="mt-3 text-xs text-neutral-500 underline"
        >
          {t('forgot_password')}
        </button>
      )}

      <button
        type="button"
        onClick={() => { setMode(isSignup ? 'signin' : 'signup'); setError(null); setInfo(null); }}
        className="mt-4 block text-sm underline"
      >
        {isSignup ? t('check_email_go_login') : t('no_account')}
      </button>
    </div>
  );
}
