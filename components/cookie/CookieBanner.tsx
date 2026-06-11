'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCookieConsent } from '@/lib/cookies/CookieConsentProvider';
import type { CookiePreferences } from '@/lib/cookies/types';

/**
 * Banner di consenso cookie — replica `CookieBannerWidget.dart`.
 * Card centrata su backdrop sfocato. Pulsanti: Accetta tutti · Solo necessari ·
 * Personalizza (apre il modale preferenze). La ✕ accetta tutti (come il Flutter,
 * `cookie_close_hint`). Il modale è raggiungibile anche dal footer
 * ("Gestisci preferenze cookie") anche dopo che il banner è stato chiuso.
 */
export function CookieBanner() {
  const t = useTranslations('cookieBanner');
  const {
    showBanner,
    showPreferences,
    acceptAll,
    acceptNecessary,
    openPreferences,
  } = useCookieConsent();

  if (!showBanner && !showPreferences) return null;

  return (
    <>
      {showBanner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="absolute inset-0 bg-black/[0.18]" aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('title')}
            className="relative w-full max-w-[600px] rounded-3xl bg-white p-5 shadow-[0_8px_40px_rgba(0,0,0,0.2)] desk:p-7"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-title text-[17px] font-bold text-[#1D1D1F]">
                  {t('title')}
                </h2>
                <p className="mt-2 text-[13px] leading-[1.55] text-[#3a3a3c]">
                  {t('body')}{' '}
                  <Link
                    href="/cookie-policy"
                    className="font-semibold text-brand-pink hover:underline"
                  >
                    {t('policy_link')}
                  </Link>
                  .
                </p>
              </div>
              {/* ✕ — chiudendo si accettano tutti i cookie (parità Flutter) */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={acceptAll}
                  aria-label={t('close_hint')}
                  className="flex h-9 w-9 items-center justify-center text-[#6E6E73] hover:text-[#1D1D1F]"
                >
                  <CloseIcon />
                </button>
                <span className="w-[76px] text-center text-[9px] leading-[1.3] text-[#8E8E93]">
                  {t('close_hint')}
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 desk:flex-row desk:flex-wrap">
              <button
                type="button"
                onClick={acceptAll}
                className="order-1 rounded-xl bg-brand-pink px-5 py-3 text-[13px] font-bold text-brand-cream2 desk:order-3"
              >
                {t('accept_all')}
              </button>
              <button
                type="button"
                onClick={acceptNecessary}
                className="order-2 rounded-xl border border-[#D1D1D6] px-5 py-3 text-[13px] font-semibold text-[#1D1D1F] hover:bg-neutral-50 desk:order-1"
              >
                {t('accept_necessary')}
              </button>
              <button
                type="button"
                onClick={openPreferences}
                className="order-3 rounded-xl border border-[#D1D1D6] px-5 py-3 text-[13px] font-semibold text-[#1D1D1F] hover:bg-neutral-50 desk:order-2"
              >
                {t('customize')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreferences && <PreferencesModal />}
    </>
  );
}

/** Modale "Gestione preferenze cookie" — replica `CookiePreferencesDialog`. */
function PreferencesModal() {
  const t = useTranslations('cookieBanner');
  const { consent, savePreferences, closePreferences } = useCookieConsent();

  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Pre-popola con le scelte già salvate alla apertura.
  useEffect(() => {
    setAnalytics(consent?.preferences.analytics ?? false);
    setMarketing(consent?.preferences.marketing ?? false);
  }, [consent]);

  const onSave = () => {
    const prefs: CookiePreferences = { necessary: true, analytics, marketing };
    savePreferences(prefs);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-md">
      <div
        className="absolute inset-0 bg-black/30"
        aria-hidden="true"
        onClick={closePreferences}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('pref_title')}
        className="relative w-full max-w-[540px] rounded-[20px] bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.2)] desk:p-7"
      >
        <div className="flex items-start gap-3">
          <h2 className="min-w-0 flex-1 font-title text-[20px] font-bold text-[#1D1D1F]">
            {t('pref_title')}
          </h2>
          <button
            type="button"
            onClick={closePreferences}
            aria-label={t('pref_close')}
            title={t('pref_close')}
            className="flex h-9 w-9 items-center justify-center text-[#6E6E73] hover:text-[#1D1D1F]"
          >
            <CloseIcon />
          </button>
        </div>

        <p className="mt-2 text-[12px] leading-[1.5] text-[#6E6E73]">
          {t('pref_manage_desc')}
        </p>

        <div className="mt-5 flex flex-col">
          <PreferenceRow
            title={t('pref_necessary_title')}
            description={t('pref_necessary_desc')}
            checked
            alwaysOnLabel={t('pref_always_on')}
          />
          <Divider />
          <PreferenceRow
            title={t('pref_analytics_title')}
            description={t('pref_analytics_desc')}
            checked={analytics}
            onChange={setAnalytics}
          />
          <Divider />
          <PreferenceRow
            title={t('pref_marketing_title')}
            description={t('pref_marketing_desc')}
            checked={marketing}
            onChange={setMarketing}
          />
        </div>

        <button
          type="button"
          onClick={onSave}
          className="mt-7 w-full rounded-xl bg-brand-pink py-3.5 text-[15px] font-bold text-brand-cream2"
        >
          {t('pref_save')}
        </button>
      </div>
    </div>
  );
}

function PreferenceRow({
  title,
  description,
  checked,
  onChange,
  alwaysOnLabel,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  alwaysOnLabel?: string;
}) {
  const locked = !onChange;
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-[#1D1D1F]">{title}</p>
        <p className="mt-1 text-[12px] leading-[1.5] text-[#6E6E73]">{description}</p>
      </div>
      {locked ? (
        <span className="shrink-0 rounded-lg bg-[#E8F5E9] px-2.5 py-1 text-[11px] font-bold text-[#388E3C]">
          {alwaysOnLabel}
        </span>
      ) : (
        <Toggle checked={checked} onChange={onChange} />
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-brand-pink' : 'bg-neutral-300'
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  );
}

function Divider() {
  return <div className="border-t border-neutral-200" />;
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
