import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { QuoteBand } from '@/components/shared/QuoteBand';
import { LpTestimonials, type LpReview } from '@/components/live-painting/LpTestimonials';
import { SectionWaveBottom } from '@/components/shared/SectionWaveBottom';
import { ProductGrid } from '@/components/product/ProductGrid';
import { getLatest } from '@/lib/products/repository';
import { BRAND_BLUR } from '@/lib/utils/blurPlaceholder';

// Masonry: immagini gallery migrate da assets/gallery → public/gallery.
const MASONRY = Array.from({ length: 24 }, (_, i) => `/gallery/galleria-${25 + i}.webp`);

// Sfondo a righe verticali dell'hero (replica `_StripePainter`).
const STRIPES =
  'repeating-linear-gradient(to right, rgba(238,103,171,0.22) 0 2px, transparent 2px 22px)';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'gallery' });
  return { title: t('title') };
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('gallery');
  const tHome = await getTranslations('home');
  const tn = await getTranslations('nav');

  const quotes = t.raw('quotes') as Array<{ quote: string; author: string }>;
  const reviews = t.raw('reviews') as LpReview[];

  // Ultimi 4 prodotti per la sezione Shop in fondo (come la home).
  const latest = await getLatest(4);
  const shopLabel =
    tn('shop').charAt(0).toUpperCase() + tn('shop').slice(1).toLowerCase();

  return (
    <div className="bg-white">
      {/* ── 1. HERO: righe verticali + Genty "Galleria" + sottotitolo ──────── */}
      <section
        className="flex h-[440px] flex-col items-center justify-center desk:h-[470px]"
        style={{ backgroundColor: '#FFFDE7', backgroundImage: STRIPES }}
      >
        <p className="font-special text-[100px] leading-none text-brand-pink desk:text-[170px]">
          {t('title')}
        </p>
        <p className="mt-3 px-6 text-center font-title text-[25px] font-semibold uppercase tracking-[0.12em] text-brand-pink desk:text-[35px]">
          {tHome('gallery_cta_sub')}
        </p>
      </section>

      {/* ── 2. Quote (rosa) ───────────────────────────────────────────────── */}
      <QuoteBand
        quote={quotes[0].quote}
        author={quotes[0].author}
        bgClassName="bg-brand-pinkBright"
        textClassName="text-brand-red"
      />

      {/* ── 3. Giorgia & Matteo ───────────────────────────────────────────── */}
      <section className="grid bg-white desk:grid-cols-2 desk:items-end">
        <div className="flex items-end px-6 py-8 desk:px-[60px] desk:py-10">
          <SectionTitle text={t('giorgia_title')} />
        </div>
        <Pic src="/gallery/coordinati-1.webp" className="h-[260px] desk:h-[420px]" />
        <Pic src="/gallery/evento-1.webp" className="h-[260px] desk:h-[420px]" />
        <div className="flex items-center px-6 py-8 desk:px-[60px]">
          <Body>{t('giorgia_body')}</Body>
        </div>
      </section>

      {/* ── 4. Leonardo ───────────────────────────────────────────────────── */}
      <section className="grid items-center bg-white desk:grid-cols-2">
        <div className="px-6 py-8 desk:px-[60px]">
          <SectionTitle text={t('leonardo_title')} />
          <div className="mt-5">
            <Body>{t('leonardo_body')}</Body>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3.5 p-3.5">
          {['evento-3', 'coordinato-4', 'evento-4', 'evento-2'].map((n) => (
            <div key={n} className="relative aspect-square overflow-hidden rounded-[14px]">
              <Image
                src={`/gallery/${n}.webp`}
                alt=""
                fill
                sizes="25vw"
                placeholder="blur"
                blurDataURL={BRAND_BLUR}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Quote (crema) ──────────────────────────────────────────────── */}
      <QuoteBand
        quote={quotes[1].quote}
        author={quotes[1].author}
        bgClassName="bg-brand-cream2"
        textClassName="text-brand-pinkHot"
      />

      {/* ── 6. Masonry grid (5 col desktop / 2 mobile) ────────────────────── */}
      <section className="px-3.5 py-10">
        <div className="mx-auto max-w-content columns-2 gap-3.5 [column-fill:_balance] desk:columns-5">
          {MASONRY.map((src, i) => (
            <div key={src} className="mb-3.5 overflow-hidden rounded-[14px]">
              <Image
                src={src}
                alt={`${t('title')} ${i + 1}`}
                width={500}
                height={650}
                sizes="(min-width:900px) 18vw, 45vw"
                placeholder="blur"
                blurDataURL={BRAND_BLUR}
                className="h-auto w-full"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. Quote (rosa) ───────────────────────────────────────────────── */}
      <QuoteBand
        quote={quotes[2].quote}
        author={quotes[2].author}
        bgClassName="bg-brand-pinkBright"
        textClassName="text-brand-red"
      />

      {/* ── 8. Pietropaolo (foto + ovali su pattern) — replica fedele di
             `_PietropaoloSection` Flutter, con layout diversi sui due
             breakpoint. */}
      <section className="bg-white">
        {/* Mobile: testo, poi composizione alta 460px con la foto a sinistra
            e la colonna di 3 ovali a cavallo del suo bordo destro. */}
        <div className="desk:hidden">
          <div className="px-6 pb-5 pt-7">
            <SectionTitle text={t('pietropaolo_title')} />
            <div className="mt-3.5">
              <Body>{t('pietropaolo_body')}</Body>
            </div>
          </div>
          <div className="relative h-[460px]">
            <div className="absolute inset-y-0 left-0 w-[82%]">
              <Image
                src="/gallery/evento-5.webp"
                alt=""
                fill
                sizes="82vw"
                placeholder="blur"
                blurDataURL={BRAND_BLUR}
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-4 right-4 top-4 flex w-[36%] flex-col gap-2.5">
              {['evento-6', 'pittura1', 'evento-7'].map((n) => (
                <div key={n} className="flex min-h-0 flex-1 items-center justify-center">
                  <div
                    className="h-full max-w-full rounded-full bg-white p-1"
                    style={{ aspectRatio: '1 / 1.25' }}
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-full">
                      <Image
                        src={`/gallery/${n}.webp`}
                        alt=""
                        fill
                        sizes="36vw"
                        placeholder="blur"
                        blurDataURL={BRAND_BLUR}
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop: foto 30% a tutta altezza + colonna testo e fascia pattern
            con i 3 ovali fluidi (Expanded nel Flutter → flex-1). */}
        <div className="hidden desk:grid desk:grid-cols-[3fr_7fr] desk:items-stretch">
          <Pic src="/gallery/evento-5.webp" />
          <div>
            <div className="px-6 py-8 desk:px-12 desk:pt-10">
              <SectionTitle text={t('pietropaolo_title')} />
              <div className="mt-4">
                <Body>{t('pietropaolo_body')}</Body>
              </div>
            </div>
            <div
              className="flex items-center gap-4 px-10 py-8"
              style={{ backgroundImage: "url('/pattern/6.webp')", backgroundRepeat: 'repeat' }}
            >
              {['evento-6', 'pittura1', 'evento-7'].map((n) => (
                <Oval key={n} src={`/gallery/${n}.webp`} className="min-w-0 flex-1" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Martina & Carmine ──────────────────────────────────────────── */}
      <section className="grid bg-white desk:grid-cols-2 desk:items-stretch">
        <div className="flex items-center px-6 py-8 desk:px-[60px]">
          <div>
            <SectionTitle text={t('martina_title')} />
            <div className="mt-5">
              <Body>{t('martina_body')}</Body>
            </div>
          </div>
        </div>
        <Pic src="/gallery/coordinato-3.webp" className="h-[300px] desk:h-auto" />
      </section>

      {/* ── 10. Quote (crema) ─────────────────────────────────────────────── */}
      <QuoteBand
        quote={quotes[3].quote}
        author={quotes[3].author}
        bgClassName="bg-brand-cream2"
        textClassName="text-brand-pink"
      />

      {/* ── 11. Marzamemi (testo 50/50 + ovali su pattern) ────────────────── */}
      <section>
        <div className="grid gap-6 bg-white px-6 py-10 desk:grid-cols-2 desk:px-[100px] desk:py-12">
          <SectionTitle text={t('marzamemi_title')} />
          <Body>{t('marzamemi_body')}</Body>
        </div>
        <div
          className="flex flex-col items-center justify-evenly gap-6 px-4 py-8 desk:flex-row desk:py-[52px]"
          style={{ backgroundImage: "url('/pattern/10.webp')", backgroundSize: 'cover' }}
        >
          {['evento-8', 'evento-10', 'evento-9'].map((n) => (
            <Oval key={n} src={`/gallery/${n}.webp`} className="w-[200px] desk:w-[270px]" />
          ))}
        </div>
      </section>

      {/* ── 12. Radisson (foto + ovale sovrapposto) ───────────────────────── */}
      <section className="grid bg-white desk:grid-cols-[2fr_3fr] desk:items-stretch">
        <div className="relative h-[380px] desk:h-auto">
          <Image
            src="/gallery/evento-11.webp"
            alt=""
            fill
            sizes="40vw"
            placeholder="blur"
            blurDataURL={BRAND_BLUR}
            className="object-cover"
          />
          {/* Ovale che scavalca il bordo destro */}
          <div className="absolute right-[-18%] top-1/2 hidden w-[55%] -translate-y-1/2 desk:block">
            <Oval src="/gallery/evento-12.webp" className="w-full" ratio="aspect-[1/1.3]" />
          </div>
        </div>
        <div className="flex items-center px-6 py-8 desk:py-[120px] desk:pl-[18%] desk:pr-[60px]">
          <div>
            <SectionTitle text={t('radisson_title')} />
            <div className="mt-5">
              <Body>{t('radisson_body')}</Body>
            </div>
          </div>
        </div>
      </section>

      {/* ── 13. Clarissa (ovale + testo + "Leggi di più") ─────────────────── */}
      <section className="bg-white px-6 py-14 desk:px-20">
        <div className="mx-auto grid max-w-[1100px] items-center gap-7 desk:grid-cols-2 desk:gap-8">
          <div className="flex justify-center">
            <Oval src="/gallery/profilo.webp" className="w-[240px] desk:w-[400px]" ratio="aspect-square" />
          </div>
          <div className="flex flex-col items-start">
            <p className="font-title text-[15px] text-brand-red desk:text-[22px]">
              {t('clarissa_role')}
            </p>
            <p className="mt-2 font-special text-[52px] leading-none text-brand-pink desk:mt-3 desk:text-[80px]">
              Clarissa
            </p>
            <div className="mt-4 flex flex-col gap-3 desk:mt-5">
              <p className="font-body text-[15px] leading-relaxed text-brand-pink desk:text-[22px]">
                {t('clarissa_p1')}
              </p>
              <p className="font-body text-[15px] leading-relaxed text-brand-pink desk:text-[22px]">
                {t('clarissa_p2')}
              </p>
            </div>
            <Link
              href="/about"
              className="cta-bounce mt-6 inline-block rounded-full bg-brand-pink px-9 py-3 font-special text-[22px] text-brand-cream2 desk:mt-7 desk:text-[28px] desk:hover:shadow-lift"
            >
              {t('read_more')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── 14. Dicono di me (carosello — riusa LpTestimonials) ───────────── */}
      <section
        className="bg-brand-cream2 px-4 py-[72px] desk:px-[120px] desk:py-[120px]"
        style={{ backgroundImage: "url('/pattern/7.webp')", backgroundRepeat: 'repeat' }}
      >
        <LpTestimonials title={t('reviews_title')} reviews={reviews} />
      </section>

      {/* ── 15. Shop CTA — sezione finale (replica `_ShopPreviewSection` di
          GalleryView.dart): foto `Varie 5` con overlay scuro che sfuma fin
          sopra le card, titolo Genty rosa allineato a destra, bottone "Qui" e
          griglia degli ultimi 4 prodotti. Onde in basso color footer (#F5EBC1)
          perché su /gallery il footer è SENZA wave (vedi NO_WAVE_PAGES). ────── */}
      <section className="relative bg-white">
        {/* Sfondo foto + overlay scuro: copre l'hero e arriva fino a metà card. */}
        <div className="absolute inset-x-0 top-0 h-[400px] desk:h-[560px]">
          <Image
            src="/gallery/shop-bg.webp"
            alt=""
            fill
            sizes="100vw"
            placeholder="blur"
            blurDataURL={BRAND_BLUR}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/[0.38]" />
        </div>

        {/* Hero: titolo + bottone, allineati a destra. */}
        <div className="relative flex h-[200px] items-center justify-end px-6 desk:h-[320px] desk:pr-20">
          <div className="flex flex-col items-center">
            <p className="font-special text-[80px] leading-none text-brand-pink desk:text-[140px]">
              {shopLabel}
            </p>
            <Link
              href="/shop"
              className="cta-bounce mt-2.5 inline-block rounded-full bg-brand-pink px-7 py-2.5 font-special text-[24px] text-brand-cream2 desk:px-9 desk:py-3 desk:text-[32px] desk:hover:shadow-pink-cta"
            >
              {tHome('here_btn')}
            </Link>
          </div>
        </div>

        {/* Griglia ultimi prodotti (2 col mobile / 4 desktop). */}
        <div className="relative px-[14px] py-6 desk:px-6 desk:py-10">
          <div className="mx-auto max-w-content">
            {latest.length > 0 ? (
              <ProductGrid products={latest} locale={locale} />
            ) : (
              <p className="py-7 text-center text-sm text-neutral-500">
                {tHome('no_products')}
              </p>
            )}
          </div>
        </div>

        {/* Raccordo a onde verso il footer (stesso cream del footer). */}
        <SectionWaveBottom color="#F5EBC1" />
      </section>
    </div>
  );
}

// ── Sotto-componenti ──────────────────────────────────────────────────────

/** Titolo sezione: **parola** = keyword Genty rosa, resto Gowun rosso. */
function SectionTitle({ text }: { text: string }) {
  const parts = text.split('**');
  return (
    <h2 className="whitespace-pre-line font-title text-[34px] leading-tight text-brand-red desk:text-[56px]">
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            className="font-special text-[46px] leading-none text-brand-pink desk:text-[76px]"
          >
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </h2>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="whitespace-pre-line font-body text-[15px] leading-[1.65] text-brand-red desk:text-[22px]">
      {children}
    </p>
  );
}

/** Immagine piena (riempie la cella). */
function Pic({ src, className = '' }: { src: string; className?: string }) {
  return (
    <div className={`relative w-full ${className}`}>
      <Image
        src={src}
        alt=""
        fill
        sizes="(min-width:900px) 50vw, 100vw"
        placeholder="blur"
        blurDataURL={BRAND_BLUR}
        className="object-cover"
      />
    </div>
  );
}

/** Foto a clip ovale con bordo bianco (replica i `ClipOval` del Flutter). */
function Oval({
  src,
  className = '',
  ratio = 'aspect-[1/1.25]',
}: {
  src: string;
  className?: string;
  ratio?: string;
}) {
  return (
    <div className={`rounded-full bg-white p-1.5 ${className}`}>
      <div className={`relative ${ratio} overflow-hidden rounded-full`}>
        <Image
          src={src}
          alt=""
          fill
          sizes="320px"
          placeholder="blur"
          blurDataURL={BRAND_BLUR}
          className="object-cover"
        />
      </div>
    </div>
  );
}
