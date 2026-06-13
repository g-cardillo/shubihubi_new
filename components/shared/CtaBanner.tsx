import { Link } from '@/i18n/navigation';
import { SectionWaveBottom } from './SectionWaveBottom';

/**
 * Banner CTA a fondo rosa pieno con titolo crema e bottone pill Genty
 * (replica `_LpContactCtaSection` / `_ContactCtaSection`). Il colore del
 * bottone è parametrizzabile (Live Painting usa pinkBright, Stationery un
 * rosa più chiaro). Con `waveBottom` il banner si chiude con le onde color
 * footer: da usare quando è l'ultima sezione prima di `<Footer wave={false}>`.
 */
export function CtaBanner({
  text,
  btnLabel,
  href,
  btnClassName = 'bg-brand-pinkBright',
  waveBottom = false,
}: {
  text: string;
  btnLabel: string;
  href: string;
  btnClassName?: string;
  waveBottom?: boolean;
}) {
  return (
    <section className="bg-brand-pinkHot">
      <div className="px-6 py-10 desk:px-[60px] desk:py-16">
        <div className="mx-auto max-w-content">
          <p className="font-title text-[28px] leading-tight text-brand-cream2 desk:text-[52px]">
            {text}
          </p>
          <Link
            href={href}
            className={`cta-bounce mt-7 inline-block rounded-full px-7 py-3.5 font-special text-[26px] text-brand-cream2 desk:mt-10 desk:px-9 desk:py-[18px] desk:text-[32px] desk:hover:shadow-lift ${btnClassName}`}
          >
            {btnLabel}
          </Link>
        </div>
      </div>
      {waveBottom && <SectionWaveBottom />}
    </section>
  );
}
