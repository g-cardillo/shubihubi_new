'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useCookieConsent } from '@/lib/cookies/CookieConsentProvider';
import { WaveBand } from '@/components/shared/SectionWaveBottom';

/**
 * Footer del sito — replica fedele di `SiteFooterSliver.dart` del Flutter.
 *
 * Struttura identica su ogni pagina:
 *  - wave superiore (raccordo a onde col contenuto sovrastante; 3 onde sotto
 *    i 900px, 6 su desktop — vedi `WaveBand`)
 *  - tre colonne: brand + dati / navigazione / contatti (5·4·5 su desktop,
 *    impilate su mobile)
 *  - barra cookie inferiore: Termini · Spedizione · Privacy · Preferenze cookie
 *
 * Wave: la prop `wave` (default true) la mostra/nasconde. Con `wave={false}`
 * la sezione che precede il footer deve chiudersi con `SectionWaveBottom`
 * (stesso colore del footer) così i due restano attaccati senza stacco.
 * L'istanza globale nel layout non può passare la prop per-pagina, quindi le
 * pagine la cui sezione finale è scura/colorata (e ha già il proprio
 * `SectionWaveBottom`) sono elencate in `NO_WAVE_PAGES`.
 *
 * Colore (come nel Flutter): bianco su Contatti e Supporto, altrimenti crema
 * (#F5EBC1).
 */
const INSTAGRAM = 'https://instagram.com/shubihubi';
const EMAIL = 'info@shubihubi.com';
const VAT = '03206180642';

/** Pagine con footer bianco (Flutter: `backgroundColor: Colors.white`,
 *  più Live Painting lato web). */
const WHITE_PAGES = ['/contacts', '/support', '/live-painting'];
/**
 * Pagine senza wave sul footer: la sezione finale è scura/colorata e termina
 * con `SectionWaveBottom`. Le pagine con sezione finale bianca/neutra usano
 * il default (wave sul footer).
 */
const NO_WAVE_PAGES = ['/', '/live-painting', '/stationery', '/contacts'];

export function Footer({ wave = true }: { wave?: boolean }) {
  const t = useTranslations('footer');
  const tn = useTranslations('nav');
  const pathname = usePathname();
  const { openPreferences } = useCookieConsent();

  const isWhite = WHITE_PAGES.includes(pathname);
  const showWave = wave && !NO_WAVE_PAGES.includes(pathname);
  const bg = isWhite ? '#FFFFFF' : '#F5EBC1';

  const [copied, setCopied] = useState(false);
  const copyVat = async () => {
    try {
      await navigator.clipboard.writeText(VAT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard non disponibile: no-op */
    }
  };

  return (
    <footer className="text-brand-redSoft">
      {showWave && <WaveBand color={bg} />}

      <div style={{ backgroundColor: bg }}>
        {/* ── Tre colonne ─────────────────────────────────────────────────── */}
        <div className="mx-auto grid max-w-content gap-10 px-5 py-7 desk:grid-cols-[5fr_4fr_5fr] desk:gap-8 desk:px-6 desk:py-[54px]">
          {/* Brand + dati */}
          <div className="flex flex-col justify-end">
            <Image
              src="/logo_scritta.webp"
              alt="Shubihubi"
              width={260}
              height={90}
              className="h-auto w-[140px] max-w-full desk:w-[200px]"
            />
            <p className="mt-2.5 text-[14px] font-medium">by Clarissa Cucciniello</p>
            <button
              type="button"
              onClick={copyVat}
              className="mt-3.5 w-fit text-left text-[13px] transition-opacity duration-200 hover:opacity-70"
            >
              {copied ? t('vat_copied') : `P.IVA ${VAT}`}
            </button>
            <p className="mt-2 text-[14px] font-bold leading-tight">© shubihubi.com</p>
            <p className="mt-2 text-[14px] font-bold leading-tight">2023-2026</p>
            <p className="mt-2 text-[14px] font-bold leading-tight">{t('all_rights')}</p>
          </div>

          {/* Navigazione */}
          <nav className="flex flex-col items-start justify-end gap-[5px] desk:items-center">
            <FooterLink href="/shop" className="mb-[5px] font-bold">
              {capitalize(tn('shop'))}
            </FooterLink>
            <FooterLink href="/about">{t('about')}</FooterLink>
            <FooterLink href="/live-painting">{tn('live_painting')}</FooterLink>
            <FooterLink href="/stationery">{tn('stationery')}</FooterLink>
            <FooterLink href="/gallery">{t('gallery')}</FooterLink>
          </nav>

          {/* Contatti */}
          <div className="flex flex-col items-start justify-end gap-[5px] desk:items-end">
            <FooterLink href="/contacts" className="mb-[5px] font-bold">
              {t('contacts')}
            </FooterLink>
            <FooterLink href="/contacts#faq">{t('faq')}</FooterLink>
            <FooterLink href="/support">{t('support_orders')}</FooterLink>
            <a
              href={`mailto:${EMAIL}`}
              aria-label="Email"
              className="mt-3.5 transition-opacity duration-200 hover:opacity-70"
            >
              <MailIcon />
            </a>
            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-[14px] font-bold transition-opacity duration-200 hover:opacity-70"
            >
              Instagram: @shubihubi
            </a>
          </div>
        </div>

        {/* ── Barra cookie ─────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-content">
          <div className="mx-6 border-t border-brand-redSoft/25" />
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 py-3.5 desk:px-8 desk:py-[18px]">
            <FooterLink href="/terms-of-service" className="text-[13px] desk:text-[16px]">
              {t('terms_link')}
            </FooterLink>
            <FooterLink href="/shipping-policy" className="text-[13px] desk:text-[16px]">
              {t('shipping_link')}
            </FooterLink>
            <FooterLink href="/cookie-policy" className="text-[13px] desk:text-[16px]">
              {t('privacy_link')}
            </FooterLink>
            {/* Preferenze cookie: apre il modale di gestione consensi
                (in Flutter `CookiePreferencesDialog`). */}
            <button
              type="button"
              onClick={openPreferences}
              className="text-[13px] transition-opacity duration-200 hover:opacity-70 desk:text-[16px]"
            >
              {t('cookie_preferences')}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function FooterLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`w-fit font-body text-[14px] leading-snug transition-opacity duration-200 hover:opacity-70 ${className}`}
    >
      {children}
    </Link>
  );
}

function MailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 6l9 6 9-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
