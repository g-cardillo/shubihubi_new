import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { SITE } from '@/lib/site';

/**
 * Pagina Eventi — replica la struttura di `Events.dart` del Flutter
 * (hero → intro → workshop → griglia foto → CTA "organizza" → carosello),
 * applicando i pattern di design già consolidati nelle altre pagine
 * (la versione Flutter usava ancora immagini placeholder): hero a righe
 * verticali con titolo Genty, sezione crema #F4EDDA, ovali su pattern,
 * CTA rosa pieno, strip immagini scorrevole.
 */

// Sfondo a righe verticali dell'hero (stesso di Gallery, replica `_StripePainter`).
const STRIPES =
  'repeating-linear-gradient(to right, rgba(238,103,171,0.22) 0 2px, transparent 2px 22px)';

const MASONRY = [
  'evento-2', 'evento-5', 'evento-8', 'evento-11',
  'evento-3', 'evento-9', 'pittura1', 'evento-12',
];

const CAROUSEL = ['evento-1', 'evento-4', 'evento-6', 'evento-10'];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'events' });
  return { title: t('title') };
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('events');

  return (
    <div className="bg-white">
      {/* ── 1. HERO: righe verticali + titolo Genty rosa ──────────────────── */}
      <section
        className="flex h-[360px] flex-col items-center justify-center px-4 desk:h-[470px]"
        style={{ backgroundColor: '#FFFDE7', backgroundImage: STRIPES }}
      >
        <h1 className="text-center font-special text-[56px] leading-none text-brand-pink desk:text-[110px]">
          {t('title')}
        </h1>
      </section>

      {/* ── 2. Intro centrata ─────────────────────────────────────────────── */}
      <section className="px-6 py-14 desk:py-[84px]">
        <p className="mx-auto max-w-[860px] whitespace-pre-line text-center font-body text-[15px] leading-[1.65] text-brand-red desk:text-[22px]">
          {t('intro')}
        </p>
      </section>

      {/* ── 3. Workshop: testo + ovali su pattern (fondo crema Flutter) ───── */}
      <section className="bg-[#F4EDDA]">
        <div className="mx-auto grid max-w-content gap-8 px-6 py-12 desk:grid-cols-2 desk:gap-[56px] desk:px-12 desk:py-[56px]">
          <div>
            <h2 className="font-title text-[34px] leading-tight text-brand-red desk:text-[52px]">
              {t('workshop_title')}
            </h2>
            <div className="mt-5 flex flex-col gap-4 desk:mt-7">
              {(['workshop_body1', 'workshop_body2', 'workshop_body3', 'workshop_body4'] as const).map(
                (k) => (
                  <p
                    key={k}
                    className="font-body text-[15px] leading-[1.65] text-brand-red desk:text-[20px]"
                  >
                    {t(k)}
                  </p>
                ),
              )}
            </div>
          </div>
          <div
            className="flex items-center justify-center gap-6 rounded-[22px] px-6 py-10 desk:gap-8"
            style={{ backgroundImage: "url('/pattern/6.webp')", backgroundRepeat: 'repeat' }}
          >
            <Oval src="/gallery/evento-7.webp" className="w-[150px] desk:w-[230px]" />
            <Oval src="/gallery/evento-1.webp" className="mt-10 w-[150px] desk:w-[230px]" />
          </div>
        </div>
      </section>

      {/* ── 4. Griglia foto (masonry, replica PinterestAssetGridSliver) ───── */}
      <section className="px-3.5 py-10 desk:py-12">
        <div className="mx-auto max-w-content columns-2 gap-3.5 [column-fill:_balance] desk:columns-4">
          {MASONRY.map((n, i) => (
            <div key={n} className="mb-3.5 overflow-hidden rounded-[14px]">
              <Image
                src={`/gallery/${n}.webp`}
                alt={`${t('title')} ${i + 1}`}
                width={500}
                height={650}
                sizes="(min-width:900px) 22vw, 45vw"
                className="h-auto w-full"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. CTA rosa: organizza il tuo evento (mailto) ─────────────────── */}
      <section className="bg-brand-pinkHot px-6 py-12 text-center desk:px-[60px] desk:py-16">
        <div className="mx-auto max-w-[860px]">
          <h2 className="font-title text-[30px] font-bold leading-tight text-brand-cream2 desk:text-[44px]">
            {t('organize_title')}
          </h2>
          <p className="mt-5 font-body text-[15px] leading-[1.65] text-brand-cream2 desk:mt-7 desk:text-[20px]">
            {t('organize_body')}
          </p>
          <a
            href={`mailto:${SITE.email}`}
            className="mt-7 inline-block rounded-full bg-brand-pinkBright px-8 py-3.5 font-special text-[24px] text-brand-cream2 transition-all duration-200 desk:mt-10 desk:px-10 desk:text-[30px] desk:hover:-translate-y-0.5 desk:hover:shadow-lift"
          >
            {SITE.email}
          </a>
        </div>
      </section>

      {/* ── 6. "Dicono di noi…": strip immagini a scorrimento ─────────────── */}
      <section className="py-12 desk:py-16">
        <h2 className="px-6 text-center font-special text-[44px] leading-none text-brand-red desk:text-[72px]">
          {t('reviews_title')}
        </h2>
        {/* `w-fit mx-auto` centra la strip quando entra nel viewport senza
            tagliare le immagini a sinistra quando trabocca (justify-center
            + overflow renderebbe irraggiungibile la parte iniziale). */}
        <div className="mx-auto mt-8 flex w-fit max-w-full snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 desk:mt-12 desk:px-12 [&::-webkit-scrollbar]:hidden">
          {CAROUSEL.map((n) => (
            <div
              key={n}
              className="relative aspect-[4/5] w-[240px] shrink-0 snap-center overflow-hidden rounded-[18px] desk:w-[280px]"
            >
              <Image
                src={`/gallery/${n}.webp`}
                alt=""
                fill
                sizes="(min-width:900px) 300px, 240px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Foto a clip ovale con bordo bianco (stesso pattern della Gallery). */
function Oval({ src, className = '' }: { src: string; className?: string }) {
  return (
    <div className={`rounded-full bg-white p-1.5 ${className}`}>
      <div className="relative aspect-[1/1.25] overflow-hidden rounded-full">
        <Image src={src} alt="" fill sizes="320px" className="object-cover" />
      </div>
    </div>
  );
}
