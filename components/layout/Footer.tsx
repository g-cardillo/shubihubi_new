import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/**
 * Footer del sito (replica `SiteFooterSliver` di Flutter).
 * Sfondo crema `brand-creamFooter` (#F5EBC1), testo rosso `brand-red`-ish
 * (#E01111). Colonne: brand + dati, navigazione, contatti.
 */
const INSTAGRAM = 'https://instagram.com/shubihubi';
const EMAIL = 'info@shubihubi.com';
const VAT = '03206180642';

export function Footer() {
  const t = useTranslations('footer');
  const tn = useTranslations('nav');

  return (
    <footer className="mt-16 bg-brand-creamFooter text-[#E01111]">
      <div className="mx-auto grid max-w-content gap-10 px-4 py-12 desk:grid-cols-3 desk:px-6">
        {/* Brand */}
        <div>
          <p className="font-special text-2xl">Shubihubi</p>
          <p className="mt-3 text-sm font-medium opacity-90">
            P. IVA {VAT}
          </p>
          <p className="mt-2 text-sm font-bold">{t('all_rights')}</p>
        </div>

        {/* Navigazione */}
        <nav className="flex flex-col gap-2 text-sm">
          <FooterLink href="/about" label={tn('about')} />
          <FooterLink href="/gallery" label={tn('gallery')} />
          <FooterLink href="/contacts" label={t('contacts')} />
          <FooterLink href="/support" label={t('faq')} />
          <FooterLink href="/support" label={t('support_orders')} />
        </nav>

        {/* Contatti + legale */}
        <div className="flex flex-col gap-2 text-sm">
          <a href={`mailto:${EMAIL}`} className="font-bold hover:underline">
            ✉ {EMAIL}
          </a>
          <a
            href={INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold hover:underline"
          >
            Instagram: @shubihubi
          </a>
          <div className="mt-3 flex flex-col gap-1 text-xs opacity-90">
            <FooterLink href="/terms-of-service" label="Termini & Condizioni" />
            <FooterLink href="/shipping-policy" label="Spedizioni & Resi" />
            <FooterLink href="/cookie-policy" label="Cookie Policy" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="w-fit hover:underline">
      {label}
    </Link>
  );
}
