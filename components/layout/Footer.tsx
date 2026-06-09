import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/**
 * Footer del sito (replica il `Footer` del design system Shubihubi).
 * Bordo a onde verso l'alto + fondo crema `brand-creamFooter` (#F5EBC1),
 * testo rosso `brand-redSoft` (#E01111). Tre colonne: wordmark + dati,
 * navigazione, contatti. Tipografia Quicksand, link con hover in opacità.
 */
const INSTAGRAM = 'https://instagram.com/shubihubi';
const EMAIL = 'info@shubihubi.com';
const VAT = '03206180642';

export function Footer() {
  const t = useTranslations('footer');
  const tn = useTranslations('nav');

  return (
    <footer className="mt-16 text-brand-redSoft">
      {/* Bordo a onde che raccorda la sezione precedente al fondo crema. */}
      <FooterWave />

      <div className="bg-brand-creamFooter px-6 pb-14 pt-10">
        <div className="mx-auto grid max-w-content gap-10 desk:grid-cols-[5fr_4fr_5fr] desk:gap-8">
          {/* Brand + dati */}
          <div className="flex flex-col justify-end">
            <Image
              src="/logo_scritta.webp"
              alt="Shubihubi"
              width={260}
              height={90}
              className="h-auto w-[200px] max-w-full desk:w-[260px]"
            />
            <p className="mt-4 font-body text-[18px] font-medium">
              by Clarissa Cucciniello
            </p>
            <p className="mt-5 text-[16px] leading-relaxed">P.IVA {VAT}</p>
            <p className="mt-1 text-[18px] font-bold leading-tight">
              © shubihubi.com
            </p>
            <p className="text-[18px] font-bold leading-tight">2023–2026</p>
            <p className="text-[18px] font-bold leading-tight">
              {t('all_rights')}
            </p>
          </div>

          {/* Navigazione */}
          <nav className="flex flex-col items-start gap-1.5 desk:items-center desk:justify-end">
            <FooterLink href="/shop" className="text-[26px] font-bold">
              {capitalize(tn('shop'))}
            </FooterLink>
            <div className="h-3" />
            <FooterLink href="/about">{tn('about')}</FooterLink>
            <FooterLink href="/live-painting">{tn('live_painting')}</FooterLink>
            <FooterLink href="/stationery">{tn('stationery')}</FooterLink>
            <FooterLink href="/gallery">{tn('gallery')}</FooterLink>
            <FooterLink href="/contacts">{t('contacts')}</FooterLink>
          </nav>

          {/* Contatti */}
          <div className="flex flex-col gap-1.5 desk:items-end desk:justify-end">
            <a
              href={`mailto:${EMAIL}`}
              className="text-[18px] font-bold transition-opacity duration-200 hover:opacity-70"
            >
              Email: {EMAIL}
            </a>
            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[18px] font-bold transition-opacity duration-200 hover:opacity-70"
            >
              Instagram: @shubihubi
            </a>
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
      className={`w-fit font-body text-[18px] leading-relaxed transition-opacity duration-200 hover:opacity-70 ${className}`}
    >
      {children}
    </Link>
  );
}

/**
 * Onda crema (replica `FooterWavePainter`) che ponte la sezione sovrastante
 * con il fondo crema del footer.
 */
function FooterWave() {
  return (
    <svg
      className="block h-16 w-full"
      viewBox="0 0 600 60"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        fill="#F5EBC1"
        d="M0,40 Q37.5,60 75,28 T150,28 T225,28 T300,28 T375,28 T450,28 T525,28 T600,28 L600,60 L0,60 Z"
      />
    </svg>
  );
}
