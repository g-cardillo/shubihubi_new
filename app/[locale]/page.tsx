import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { getLatest } from '@/lib/products/repository';
import { ProductGrid } from '@/components/product/ProductGrid';

/**
 * Home page — replica fedele di `lib/features/home/presentation/pages/home.dart`.
 * Sezioni: Hero (video Vimeo) → Visual Arts + logo → About → Shop preview
 * → griglia 2×2 (Live Painting / Stationery) → Gallery CTA con bordo a onde.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tn = await getTranslations('nav');
  const latest = await getLatest(4);

  const shopLabel =
    tn('shop').charAt(0).toUpperCase() + tn('shop').slice(1).toLowerCase();

  return (
    <>
      {/* ── Hero: video Vimeo fullscreen + titolo sovrapposto ─────────────── */}
      <section className="relative h-[62vh] w-full overflow-hidden desk:h-[74vh]">
        <div className="pointer-events-none absolute inset-0">
          <iframe
            src="https://player.vimeo.com/video/1177430062?autoplay=1&muted=1&loop=1&background=1&autopause=0"
            allow="autoplay; fullscreen; picture-in-picture"
            className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
            title="Shubi Hubi Studio"
          />
        </div>
        <div className="absolute inset-0 bg-black/[0.12]" />
        <h1 className="absolute inset-x-3 bottom-0 text-center font-home text-[62px] font-light leading-[0.88] tracking-[0.06em] text-white desk:inset-x-6 desk:text-[126px]">
          Shubi Hubi Studio
        </h1>
      </section>

      {/* ── Visual Arts + logo ────────────────────────────────────────────── */}
      <section className="flex flex-col items-center px-4 pb-5 pt-6 text-center desk:pb-8 desk:pt-10">
        <p className="font-title text-[40px] font-medium text-[#D60000] desk:text-[70px]">
          Visual Arts
        </p>
        <Image
          src="/logo.webp"
          alt="Shubihubi"
          width={900}
          height={300}
          priority
          className="mt-5 h-auto w-full max-w-[500px] desk:max-w-[900px]"
        />
      </section>

      {/* ── About: testo + immagine ───────────────────────────────────────── */}
      <section className="px-[18px] py-8 desk:px-[60px] desk:py-[70px]">
        <div className="mx-auto grid max-w-content items-center gap-[26px] desk:grid-cols-2 desk:gap-[42px]">
          <div className="flex flex-col gap-6">
            <p className="text-[22px] text-brand-red desk:text-[25px]">
              <span className="font-light">{t('my_work_label')}</span>
              <span className="font-bold">{t('my_work_bold')}</span>
            </p>
            <p className="leading-[0.95]">
              <span className="font-title text-[60px] text-ink desk:text-[80px]">
                {t('give_shape')}
              </span>{' '}
              <span className="font-special text-[76px] text-brand-pink desk:text-[121px]">
                {t('ideas')}
              </span>
            </p>
            <p className="whitespace-pre-line text-[22px] leading-[1.25] text-brand-red desk:text-[25px]">
              {t('welcome')}
              <span className="font-bold">{t('welcome_bold')}</span>
            </p>
          </div>
          <div className="order-last desk:order-none">
            <div className="overflow-hidden rounded-[30px] rounded-bl-none desk:rounded-[70px] desk:rounded-bl-none">
              <Image
                src="/home/home3.webp"
                alt=""
                width={800}
                height={890}
                className="aspect-square w-full object-cover desk:aspect-[0.9]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Shop preview ──────────────────────────────────────────────────── */}
      <section className="pb-8 pt-[22px] text-center desk:pb-14 desk:pt-[38px]">
        <p className="mt-10 font-title text-[45px] text-brand-pink desk:text-[70px]">
          {t('visit_my')}
        </p>
        <p className="font-special text-[106px] font-bold leading-none text-[#F8C300] desk:text-[174px]">
          {shopLabel}
        </p>
        <Link
          href="/shop"
          className="mt-2 inline-block rounded-full bg-brand-pink px-8 py-3 font-special text-[32px] text-brand-cream2 transition-all duration-200 desk:hover:-translate-y-0.5 desk:hover:shadow-pink-cta"
        >
          {t('here_btn')}
        </Link>

        <div
          className="mt-[22px] w-full bg-cover bg-center px-[14px] py-6 desk:px-6 desk:py-10"
          style={{ backgroundImage: "url('/pattern/5.webp')" }}
        >
          <div className="mx-auto max-w-content text-left">
            {latest.length > 0 ? (
              <ProductGrid products={latest} locale={locale} />
            ) : (
              <p className="py-7 text-center text-sm text-neutral-500">
                {t('no_products')}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Griglia 2×2: Live Painting / Stationery ───────────────────────── */}
      <section className="grid desk:grid-cols-2">
        <ImageTile src="/home/home1.webp" />
        <TextTile
          title={t('lp_title')}
          body={t('lp_body')}
          cta={t('lp_btn_desktop')}
          href="/live-painting"
          className="order-first desk:order-none"
        />
        <TextTile
          title={t('stat_title')}
          body={t('stat_body')}
          cta={t('stat_btn')}
          href="/stationery"
        />
        <ImageTile src="/home/home2.webp" />
      </section>

      {/* ── Gallery CTA fullwidth + bordo a onde ──────────────────────────── */}
      <section className="relative h-[520px] w-full overflow-hidden desk:h-[760px]">
        <Image
          src="/home/home4.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/[0.24]" />
        <div className="absolute inset-x-0 top-0 flex flex-col items-center px-5 pt-12 text-center desk:pt-[42px]">
          <p className="mt-12 font-special text-[72px] font-bold leading-[0.9] text-[#F9E17A] desk:text-[134px]">
            {t('gallery_cta_title')}
          </p>
          <p className="mt-1 font-title text-[24px] font-semibold text-[#F9E17A] desk:text-[40px]">
            {t('gallery_cta_sub')}
          </p>
          <Link
            href="/gallery"
            className="mt-5 inline-block rounded-full bg-brand-pink px-8 py-3 font-special text-[32px] text-brand-cream2 transition-all duration-200 desk:hover:-translate-y-0.5 desk:hover:shadow-pink-cta"
          >
            {t('here_btn')}
          </Link>
        </div>
      </section>
    </>
  );
}

function ImageTile({ src }: { src: string }) {
  return (
    <div className="relative aspect-[1.77]">
      <Image src={src} alt="" fill sizes="(min-width:900px) 50vw, 100vw" className="object-cover" />
    </div>
  );
}

function TextTile({
  title,
  body,
  cta,
  href,
  className = '',
}: {
  title: string;
  body: string;
  cta: string;
  href: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col justify-center px-[22px] py-6 desk:px-10 desk:py-7 ${className}`}
    >
      <h2 className="font-title text-[54px] leading-[0.95] text-brand-pink desk:text-[80px]">
        {title}
      </h2>
      <p className="mt-3 text-[16px] leading-[1.15] text-brand-red desk:mt-8 desk:text-[22px]">
        {body}
      </p>
      <Link
        href={href}
        className="mt-3 inline-block w-fit rounded-full bg-brand-pink px-7 py-3 font-special text-[24px] text-brand-cream2 transition-all duration-200 desk:mt-8 desk:text-[30px] desk:hover:-translate-y-0.5 desk:hover:shadow-pink-cta"
      >
        {cta}
      </Link>
    </div>
  );
}
