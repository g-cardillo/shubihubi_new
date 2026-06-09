import { Link } from '@/i18n/navigation';

/**
 * Banner CTA a fondo rosa pieno con titolo crema e bottone pill Genty
 * (replica `_LpContactCtaSection` / `_ContactCtaSection`). Il colore del
 * bottone è parametrizzabile (Live Painting usa pinkBright, Stationery un
 * rosa più chiaro).
 */
export function CtaBanner({
  text,
  btnLabel,
  href,
  btnClassName = 'bg-brand-pinkBright',
}: {
  text: string;
  btnLabel: string;
  href: string;
  btnClassName?: string;
}) {
  return (
    <section className="bg-brand-pinkHot px-6 py-10 desk:px-[60px] desk:py-16">
      <div className="mx-auto max-w-content">
        <p className="font-title text-[28px] leading-tight text-brand-cream2 desk:text-[52px]">
          {text}
        </p>
        <Link
          href={href}
          className={`mt-7 inline-block rounded-full px-7 py-3.5 font-special text-[26px] text-brand-cream2 transition-all duration-200 desk:mt-10 desk:px-9 desk:py-[18px] desk:text-[32px] desk:hover:-translate-y-0.5 desk:hover:shadow-lift ${btnClassName}`}
        >
          {btnLabel}
        </Link>
      </div>
    </section>
  );
}
