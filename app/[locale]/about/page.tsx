import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { QuoteBand } from '@/components/shared/QuoteBand';

// Sfondo a righe verticali (replica `_AboutStripePainter`).
const STRIPES =
  'repeating-linear-gradient(to right, rgba(238,103,171,0.22) 0 2px, transparent 2px 22px)';

// Masonry processo creativo (Varie + About 1-11).
const MASONRY = [
  '/about/varie-2.webp',
  '/about/varie-3.webp',
  ...Array.from({ length: 11 }, (_, i) => `/about/about-${i + 1}.webp`),
];

// Reel Instagram (immagine → link).
const REELS = [
  { src: '/about/reel-1.webp', href: 'https://www.instagram.com/reel/DHOMndhoOXt/' },
  { src: '/about/reel-2.webp', href: 'https://www.instagram.com/reel/DKuIVtKokzl/' },
  { src: '/about/reel-3.webp', href: 'https://www.instagram.com/reel/DD6pcLlOPr0/' },
  { src: '/about/reel-4.webp', href: 'https://www.instagram.com/reel/DJ83JonsTuu/' },
];

const SKETCHES = Array.from({ length: 20 }, (_, i) => `/about/sketch-${63 + i}.webp`);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return { title: t('banner') };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');

  return (
    <div className="bg-white">
      {/* ── 1. HERO banner: righe verticali + Genty rosa ──────────────────── */}
      <section
        className="flex h-[200px] items-center justify-center px-6 desk:h-[350px]"
        style={{ backgroundColor: '#FFFDE7', backgroundImage: STRIPES }}
      >
        <h1 className="text-center font-special text-[26px] text-brand-pink desk:text-[48px]">
          {t('banner')}
        </h1>
      </section>

      {/* ── 2. Io sono Clarissa — 50/50 immagine + testo ──────────────────── */}
      <section className="grid bg-white desk:grid-cols-2 desk:items-stretch">
        {/* immagine (sopra su mobile? no: testo sopra, img sotto) */}
        <div className="order-2 desk:order-1">
          <div className="relative box-border h-[320px] w-full overflow-hidden border-[16px] border-white desk:h-full desk:border-[22px]">
            <Image
              src="/about/about.webp"
              alt="Clarissa"
              fill
              quality={90}
              sizes="(min-width: 900px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className="order-1 flex flex-col items-start justify-center bg-white px-6 py-10 desk:order-2 desk:px-[80px] desk:py-12">
          <h2 className="whitespace-pre-line font-title text-[30px] leading-snug text-brand-red desk:text-[51px]">
            {t('iam')}
            <span className="font-special text-[62px] leading-none text-[#FFAFEB] desk:text-[100px]">
              Clarissa
            </span>
            {t('created')}
            <span className="font-home text-[38px] text-brand-red desk:text-[52px]">
              Shubi Hubi Studio
            </span>
          </h2>
          <p className="mt-7 whitespace-pre-line font-body text-[15px] leading-relaxed text-brand-pink desk:text-[22px]">
            {t('bio')}
          </p>
          <Link
            href="/contacts"
            className="mt-8 inline-block rounded-full bg-brand-pink px-9 py-3 font-special text-[28px] text-brand-cream2 transition-all duration-200 desk:hover:-translate-y-0.5 desk:hover:shadow-lift"
          >
            {t('cta_btn')}
          </Link>
        </div>
      </section>

      {/* ── 3. Processo Creativo — pattern bg + 2 colonne ─────────────────── */}
      <section
        className="mt-[100px] px-6 py-[100px] desk:px-[140px] desk:py-[140px]"
        style={{ backgroundImage: "url('/pattern/2.webp')", backgroundRepeat: 'repeat' }}
      >
        <h2 className="font-title text-[60px] leading-tight text-brand-red desk:text-[90px]">
          {t('creative_process_title')}{' '}
          <span className="font-special text-[80px] leading-tight text-[#FE0000] desk:text-[100px]">
            {t('creative_process_special')}
          </span>
        </h2>
        <div className="mt-12 grid gap-x-12 gap-y-5 desk:mt-24 desk:grid-cols-2">
          <div className="flex flex-col gap-5">
            <BoldText text={t('cp_left1')} />
            <BoldText text={t('cp_left2')} />
            <BoldText text={t('cp_left3')} />
          </div>
          <div className="flex flex-col gap-5">
            <BoldText text={t('cp_right1')} />
            <BoldText text={t('cp_right2')} />
            <BoldText text={t('cp_right3')} />
          </div>
        </div>
      </section>

      {/* ── 4. Quote ──────────────────────────────────────────────────────── */}
      <QuoteBand
        quote={t('quote')}
        author=""
        bgClassName="bg-brand-cream2"
        textClassName="text-brand-pinkHot"
      />

      {/* ── 5. Masonry processo creativo — full-width, tile ~260px (replica
          PinterestAssetGridSliver: maxTileWidth 260, gap 18, padding 24). ──── */}
      <section className="px-6 py-12">
        <div className="gap-[18px] [column-fill:_balance] [column-width:260px]">
          {MASONRY.map((src, i) => (
            <div key={src} className="mb-[18px] overflow-hidden rounded-[14px]">
              <Image
                src={src}
                alt={`Shubi Hubi Studio ${i + 1}`}
                width={500}
                height={650}
                sizes="(min-width:900px) 18vw, 45vw"
                className="h-auto w-full"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Qui puoi guardarmi dipingere ───────────────────────────────── */}
      <section className="bg-[#FFFDE7] px-8 pb-12 pt-12 desk:px-[120px] desk:pb-20">
        <h2 className="font-title text-[32px] leading-tight text-brand-pink desk:text-[52px]">
          {t('watch_title1')}
          <span className="font-special text-[48px] leading-none text-brand-pink desk:text-[80px]">
            {t('watch_title2')}
          </span>
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-3 desk:mt-12 desk:grid-cols-4 desk:gap-6">
          {REELS.map((r, i) => (
            <a
              key={r.src}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-[9/16] overflow-hidden rounded-2xl transition-all duration-200 desk:hover:-translate-y-0.5 desk:hover:shadow-lift"
            >
              <Image
                src={r.src}
                alt={`Reel ${i + 1}`}
                fill
                sizes="(min-width:900px) 22vw, 45vw"
                className="object-cover"
              />
            </a>
          ))}
        </div>
      </section>

      {/* ── 7. I miei Sketch — griglia 4 col ──────────────────────────────── */}
      <section className="bg-white px-6 py-12 desk:px-12 desk:py-14">
        <h2 className="font-title text-[32px] leading-tight text-brand-pink desk:text-[48px]">
          {t('sketches_title1')}{' '}
          <span className="font-special text-[52px] leading-none text-brand-pink desk:text-[76px]">
            {t('sketches_title2')}
          </span>
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-4 desk:mt-16 tablet:grid-cols-3 desk:grid-cols-4">
          {SKETCHES.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt={`Sketch ${i + 1}`}
              width={500}
              height={650}
              sizes="(min-width:900px) 22vw, 45vw"
              className="h-auto w-full"
            />
          ))}
        </div>
      </section>
    </div>
  );
}

/** Paragrafo con parsing di **grassetto** (replica `_parseBold`). */
function BoldText({ text }: { text: string }) {
  const parts = text.split('**');
  return (
    <p className="text-justify font-body text-[15px] leading-relaxed text-brand-pink desk:text-[22px]">
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-bold">
            {p}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </p>
  );
}
