import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { WhySection } from '@/components/shared/WhySection';
import { CtaBanner } from '@/components/shared/CtaBanner';
import { StarburstBadge } from '@/components/shared/StarburstBadge';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'stationery' });
  return { title: t('hero_title') };
}

export default async function StationeryPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('stationery');
  // La CTA finale riusa il testo della pagina Live Painting (come nel Flutter).
  const tLp = await getTranslations('livePainting');

  const pricing = [
    { title: t('price_card1_title'), desc: t('price_card1_desc'), price: 'da 60€' },
    { title: t('price_card2_title'), desc: t('price_card2_desc'), price: 'da 150€' },
    { title: t('price_card3_title'), desc: t('price_card3_desc'), price: 'da 200€' },
    { title: t('price_card4_title'), desc: t('price_card4_desc'), price: '790€', strike: '880€' },
    { title: t('price_card5_title'), desc: t('price_card5_desc') },
    { title: t('price_card6_title'), desc: t('price_card6_desc'), badge: t('price_card6_badge') },
  ];

  const elements = Array.from({ length: 12 }, (_, i) =>
    t(`elem_${String(i + 1).padStart(2, '0')}`),
  );

  return (
    <div className="bg-white">
      {/* ── 1. HERO: copertina ─────────────────────────────────────────────── */}
      <section>
        <div className="relative h-[260px] w-full desk:h-[480px]">
          <Image
            src="/stationery/copertina.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-bottom desk:object-top"
          />
        </div>

        {/* Titolo + intro */}
        <div className="px-6 pb-9 pt-9 text-center">
          <h1 className="font-title text-[42px] font-bold leading-tight text-brand-redTitle desk:text-[84px]">
            {t('hero_title')}
          </h1>
        </div>
        <div className="mx-auto max-w-[1100px] px-6 pb-9">
          <p className="font-body text-[15px] font-medium leading-relaxed text-brand-pinkHot desk:hidden">
            {t('intro_sm')}
          </p>
          <div className="hidden gap-6 desk:grid desk:grid-cols-2">
            <p className="font-body text-lg font-medium leading-relaxed text-brand-pinkHot">
              {t('intro_left')}
            </p>
            <p className="font-body text-lg font-medium leading-relaxed text-brand-pinkHot">
              {t('intro_right')}
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. DESCRIZIONE: testo + immagine ──────────────────────────────── */}
      <section className="pb-16 pt-10 desk:pt-24">
        {/* Mobile: testo poi immagine */}
        <div className="desk:hidden">
          <div className="px-12">
            <SectionText
              h1={t('section_h1')}
              h2={t('section_h2')}
              body1={t('section_body1')}
              body2={t('section_body2')}
              btn={t('section_btn')}
            />
          </div>
          <div className="relative mt-8 h-[360px] w-full">
            <Image src="/stationery/about1.webp" alt="" fill sizes="100vw" className="object-cover" />
          </div>
        </div>

        {/* Desktop: 50/50 testo a sinistra, immagine a destra */}
        <div className="hidden items-stretch gap-6 desk:flex">
          <div className="flex flex-1 items-start px-[72px]">
            <SectionText
              h1={t('section_h1')}
              h2={t('section_h2')}
              body1={t('section_body1')}
              body2={t('section_body2')}
              btn={t('section_btn')}
            />
          </div>
          <div className="relative w-1/2 self-stretch">
            <Image src="/stationery/about1.webp" alt="" fill sizes="50vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* ── 3. PERCHÉ scegliere un coordinato ─────────────────────────────── */}
      <WhySection
        patternSrc="/pattern/1.webp"
        title={t('why_title')}
        subtitle={t('why_subtitle')}
        points={[t('why_1'), t('why_2'), t('why_3')]}
      />

      {/* ── 4. PRICING (6 card) ───────────────────────────────────────────── */}
      <section className="bg-white px-[18px] py-9 desk:px-[60px] desk:py-[70px]">
        <div className="mx-auto max-w-content">
          <h2 className="font-title text-[36px] leading-tight text-brand-pink desk:text-[72px]">
            {t('price_title')}
          </h2>
          <p className="mt-3.5 whitespace-pre-line font-body text-[15px] leading-relaxed text-brand-pink desk:mt-6 desk:text-[22px]">
            {t('price_body')}
          </p>
          <div className="mt-7 grid grid-cols-1 gap-5 desk:mt-12 desk:grid-cols-2">
            {pricing.map((c) => (
              <PriceCard key={c.title} {...c} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. ELEMENTI (griglia 3 colonne) ───────────────────────────────── */}
      <section className="bg-white px-[18px] py-8 desk:px-[60px] desk:py-14">
        <div className="mx-auto grid max-w-content grid-cols-1 gap-x-8 gap-y-3.5 text-center desk:grid-cols-3 desk:gap-y-6">
          {elements.map((e) => (
            <p
              key={e}
              className="font-title text-[22px] leading-snug text-brand-pink desk:text-[28px]"
            >
              {e}
            </p>
          ))}
        </div>
      </section>

      {/* ── 6. CONTACT CTA (riusa il testo Live Painting) ─────────────────── */}
      <CtaBanner
        text={tLp('cta_text')}
        btnLabel={t('section_btn')}
        href="/contacts"
        btnClassName="bg-[#FFAFEB]"
      />
    </div>
  );
}

// ── Sotto-componenti ──────────────────────────────────────────────────────

function SectionText({
  h1,
  h2,
  body1,
  body2,
  btn,
}: {
  h1: string;
  h2: string;
  body1: string;
  body2: string;
  btn: string;
}) {
  return (
    <div className="flex flex-col items-start">
      <h2 className="font-title text-[26px] leading-tight text-brand-redTitle desk:text-[40px]">
        {h1}
      </h2>
      <span className="font-special text-[64px] leading-none text-brand-redTitle desk:text-[90px]">
        {h2}
      </span>
      <p className="mt-4 font-body text-[15px] leading-relaxed text-brand-pinkHot desk:mt-6 desk:text-[22px]">
        {body1}
      </p>
      <p className="mt-2.5 font-body text-[15px] leading-relaxed text-brand-pinkHot desk:text-[22px]">
        {body2}
      </p>
      <Link
        href="/contacts"
        className="mt-6 inline-block rounded-full bg-brand-pink px-7 py-3 font-special text-[28px] text-brand-cream2 transition-all duration-200 desk:mt-12 desk:px-[34px] desk:hover:-translate-y-0.5 desk:hover:shadow-lift"
      >
        {btn}
      </Link>
    </div>
  );
}

function PriceCard({
  title,
  desc,
  price,
  strike,
  badge,
}: {
  title: string;
  desc: string;
  price?: string;
  strike?: string;
  badge?: string;
}) {
  return (
    <div className="relative">
      <div
        className={`flex h-full items-end gap-3 rounded-lg border-2 border-brand-pink bg-brand-cream px-4 pt-4 ${
          badge ? 'pb-[70px] desk:pb-20' : 'pb-4'
        }`}
      >
        <div className="flex-1">
          <p className="font-body text-[15px] font-extrabold text-brand-pink desk:text-[22px]">
            {title}
          </p>
          <p className="mt-1.5 whitespace-pre-line font-body text-[15px] leading-snug text-brand-pink desk:text-[22px]">
            {desc}
          </p>
        </div>
        {price && (
          <div className="flex flex-col items-end text-right">
            {strike && (
              <span className="font-special text-[20px] text-brand-pink line-through decoration-brand-pink desk:text-[28px]">
                {strike}
              </span>
            )}
            <span className="font-special text-[28px] leading-none text-brand-pink desk:text-[44px]">
              {price}
            </span>
          </div>
        )}
      </div>
      {badge && <StarburstBadge label={badge} />}
    </div>
  );
}
