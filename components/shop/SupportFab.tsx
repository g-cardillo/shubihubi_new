'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/**
 * Pulsante flottante "Supporto" dello shop — replica del `Positioned` in basso
 * a destra di `ShopView.dart`: pill rosa brand (#EE67AB) con icona cuffie e
 * label, ombra morbida, link alla pagina /support. Hover-lift solo desktop
 * (riusa `cta-bounce`, già rispettoso di prefers-reduced-motion).
 */
export function SupportFab() {
  const t = useTranslations('footer');

  return (
    <Link
      href="/support"
      aria-label={t('support')}
      className="cta-bounce fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-brand-pink px-4 py-2.5 text-white shadow-[0_4px_8px_rgba(0,0,0,0.26)]"
    >
      <HeadsetIcon />
      <span className="font-body text-xs font-medium leading-none">{t('support')}</span>
    </Link>
  );
}

/** Cuffie con microfono (Iconsax `headset_mic_outlined` del Flutter). */
function HeadsetIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 13a8 8 0 0 1 16 0" />
      <path d="M4 13v3a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 1Z" />
      <path d="M20 13v3a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 1Z" />
      <path d="M20 16v1a4 4 0 0 1-4 4h-3" />
    </svg>
  );
}
