import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { LpTestimonials, type LpReview } from '@/components/live-painting/LpTestimonials';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'livePainting' });
  return { title: t('hero_title') };
}

export default async function LivePaintingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('livePainting');

  // 21 recensioni risolte lato server, passate al carosello client.
  const reviews: LpReview[] = Array.from({ length: 21 }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return {
      nameDate: t(`review_${n}_name_date`),
      title: t(`review_${n}_title`),
      text: t(`review_${n}_text`),
    };
  });

  const pricing = [
    { title: t('card1_title'), price: 'da 750€', desc: t('card1_desc') },
    { title: t('card2_title'), price: 'da 650€', desc: t('card2_desc') },
    { title: t('card3_title'), price: 'da 850€', desc: t('card3_desc') },
    { title: t('card4_title'), price: 'da 1400€', desc: t('card4_desc'), badge: t('card4_badge') },
  ];

  return (
    <div className="bg-white">
      {/* ── 1. HERO: copertina + titolo + corpo a due colonne ─────────────── */}
      <section>
        <div className="relative h-[260px] w-full desk:h-[480px]">
          <Image
            src="/live-painting/copertina.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
        </div>
        <div className="px-[18px] pb-9 pt-5 text-center desk:px-12 desk:pb-9 desk:pt-8">
          <h1 className="font-title text-[42px] font-bold leading-tight text-brand-redTitle desk:text-[84px]">
            {t('hero_title')}
          </h1>
        </div>
        <div className="mx-auto max-w-[1100px] px-6 pb-9">
          {/* Mobile: testo unico */}
          <p className="font-body text-[15px] font-medium leading-relaxed text-brand-pinkHot desk:hidden">
            {t('hero_body_sm')}
          </p>
          {/* Desktop: due colonne */}
          <div className="hidden gap-6 desk:grid desk:grid-cols-2">
            <p className="font-body text-lg font-medium leading-relaxed text-brand-pinkHot">
              {t('hero_left')}
            </p>
            <p className="font-body text-lg font-medium leading-relaxed text-brand-pinkHot">
              {t('hero_right')}
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. ABOUT: "Un intrattenimento originale" ──────────────────────── */}
      <section className="pb-16 pt-6 desk:pt-20">
        {/* Mobile: testo + foto full-width */}
        <div className="desk:hidden">
          <div className="px-5">
            <AboutText
              h1={t('about_h1')}
              h2={t('about_h2')}
              body1={t('about_body1')}
              body2={t('about_body2')}
              cta={t('about_cta')}
            />
          </div>
          <div className="relative mt-8 h-[380px] w-full">
            <Image src="/live-painting/pittura7.webp" alt="" fill sizes="100vw" className="object-cover object-top" />
          </div>
        </div>

        {/* Desktop: 50/50 con foto a destra e ovale sovrapposto */}
        <div className="relative hidden min-h-[460px] grid-cols-2 desk:grid">
          <div className="flex items-center bg-white px-[clamp(24px,5vw,90px)] py-10">
            <AboutText
              h1={t('about_h1')}
              h2={t('about_h2')}
              body1={t('about_body1')}
              body2={t('about_body2')}
              cta={t('about_cta')}
            />
          </div>
          <div className="relative">
            <Image src="/live-painting/pittura8.webp" alt="" fill sizes="50vw" className="object-cover object-top" />
          </div>
          {/* Ovale bianco sul confine */}
          <div className="absolute left-1/2 top-1/2 h-[min(38vw,420px)] w-[min(28vw,320px)] -translate-x-[30%] -translate-y-1/2 rounded-full bg-white p-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
            <div className="relative h-full w-full overflow-hidden rounded-full">
              <Image src="/live-painting/pittura7.webp" alt="" fill sizes="320px" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. PERCHÉ scegliere ───────────────────────────────────────────── */}
      <section
        className="bg-[#F4E8B8] px-4 py-[72px] desk:px-10 desk:py-[120px]"
        style={{ backgroundImage: "url('/pattern/10.webp')", backgroundRepeat: 'repeat' }}
      >
        <div className="relative mx-auto max-w-[1350px]">
          <div className="mt-9 rounded-[28px] bg-white px-[22px] pb-7 pt-[60px] desk:mt-14 desk:rounded-[40px] desk:px-[70px] desk:pb-[46px] desk:pt-[82px]">
            <div className="px-0 py-5 wide:px-[100px]">
              <h2 className="max-w-[980px] whitespace-pre-line font-title text-[42px] leading-[0.95] text-brand-pink desk:text-[78px]">
                {t('why_subtitle')}
              </h2>
              <div className="mt-[18px] max-w-[980px] desk:mt-7">
                <WhyPoint text={t('why_1')} />
                <WhyPoint text={t('why_2')} />
                <WhyPoint text={t('why_3')} />
              </div>
            </div>
          </div>
          <span className="absolute left-[18px] top-0 font-special text-[64px] leading-[0.9] text-brand-red desk:left-10 desk:text-[116px]">
            {t('why_title')}
          </span>
        </div>
      </section>

      {/* ── 4. PRICING ────────────────────────────────────────────────────── */}
      <section className="bg-white px-[18px] py-9 desk:px-[60px] desk:py-[70px]">
        <div className="mx-auto max-w-content">
          <h2 className="font-title text-[36px] leading-tight text-brand-pink desk:text-[72px]">
            {t('pricing_title')}
          </h2>
          <p className="mt-3.5 whitespace-pre-line font-body text-[15px] leading-relaxed text-brand-pink desk:mt-6 desk:text-[22px]">
            {t('pricing_body')}
          </p>
          <div className="mt-7 grid grid-cols-1 gap-4 desk:mt-12 desk:grid-cols-2 wide:grid-cols-4">
            {pricing.map((c) => (
              <PriceCard key={c.title} {...c} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. CONTACT CTA ────────────────────────────────────────────────── */}
      <section className="bg-brand-pinkHot px-6 py-10 desk:px-[60px] desk:py-16">
        <div className="mx-auto max-w-content">
          <p className="font-title text-[28px] leading-tight text-brand-cream2 desk:text-[52px]">
            {t('cta_text')}
          </p>
          <Link
            href="/contacts"
            className="mt-7 inline-block rounded-full bg-brand-pinkBright px-7 py-3.5 font-special text-[26px] text-brand-cream2 transition-all duration-200 desk:mt-10 desk:px-9 desk:py-[18px] desk:text-[32px] desk:hover:-translate-y-0.5 desk:hover:shadow-lift"
          >
            {t('cta_btn')}
          </Link>
        </div>
      </section>

      {/* ── 6. TESTIMONIAL ────────────────────────────────────────────────── */}
      <section
        className="bg-brand-cream px-4 py-[72px] desk:px-10 desk:py-[120px]"
        style={{ backgroundImage: "url('/pattern/7.webp')", backgroundRepeat: 'repeat' }}
      >
        <LpTestimonials title={t('reviews_title')} reviews={reviews} />
      </section>

      {/* ── 7. BOMBONIERE A DISTANZA ──────────────────────────────────────── */}
      <section className="bg-[#FFF3BC] px-6 py-12 desk:px-[60px] desk:py-20">
        <div className="mx-auto max-w-content text-center">
          <h2 className="font-title text-[38px] leading-tight text-brand-red desk:text-[72px]">
            {t('bomboniere_title')}
          </h2>
          <p className="mx-auto mt-3 max-w-3xl font-body text-[15px] font-medium leading-relaxed text-brand-red desk:mt-5 desk:text-xl">
            {t('bomboniere_subtitle')}
          </p>
          <div className="mt-8 grid gap-9 desk:mt-[52px] desk:grid-cols-2 desk:gap-[60px]">
            <BomboniereColumn
              desc={t('bomboniere_shop_desc')}
              btn={t('bomboniere_shop_btn')}
              href="/shop"
            />
            <BomboniereColumn
              desc={t('bomboniere_contact_desc')}
              btn={t('bomboniere_contact_btn')}
              href="/contacts"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Sotto-componenti ──────────────────────────────────────────────────────

function AboutText({
  h1,
  h2,
  body1,
  body2,
  cta,
}: {
  h1: string;
  h2: string;
  body1: string;
  body2: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col items-start">
      <h2 className="font-title text-[26px] leading-tight text-brand-red desk:text-[40px]">
        {h1}
      </h2>
      <span className="font-special text-[54px] leading-none text-brand-red desk:text-[90px]">
        {h2}
      </span>
      <p className="mt-4 font-body text-[15px] leading-relaxed text-brand-pink desk:mt-6 desk:text-[22px]">
        {body1}
      </p>
      <p className="mt-2.5 font-body text-[15px] leading-relaxed text-brand-pink desk:text-[22px]">
        {body2}
      </p>
      <Link
        href="/contacts"
        className="mt-6 inline-block rounded-full bg-brand-pink px-7 py-3 font-special text-[28px] text-brand-cream2 transition-all duration-200 desk:mt-9 desk:px-[34px] desk:hover:-translate-y-0.5 desk:hover:shadow-lift"
      >
        {cta}
      </Link>
    </div>
  );
}

/** Punto "Perché" con bullet ✦ e parsing di **grassetto** (replica `WhyPoint`). */
function WhyPoint({ text }: { text: string }) {
  const parts = text.split('**');
  return (
    <div className="mb-2.5 flex items-start gap-2.5 desk:mb-3.5 desk:gap-3.5">
      <span className="mt-0.5 font-body text-[18px] font-extrabold text-brand-red desk:mt-1 desk:text-[28px]">
        ✦
      </span>
      <p className="font-body text-[18px] font-medium leading-snug text-brand-red desk:text-[27px]">
        {parts.map((p, i) =>
          i % 2 === 1 ? (
            <strong key={i} className="font-extrabold">
              {p}
            </strong>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </p>
    </div>
  );
}

function PriceCard({
  title,
  price,
  desc,
  badge,
}: {
  title: string;
  price: string;
  desc: string;
  badge?: string;
}) {
  return (
    <div className="relative">
      <div
        className={`h-full rounded-lg border-2 border-brand-pink bg-brand-cream px-4 pt-4 ${
          badge ? 'pb-[70px] desk:pb-20' : 'pb-4'
        }`}
      >
        <p className="font-body text-[10px] font-extrabold uppercase text-brand-pink desk:text-[15px]">
          {title}
        </p>
        <p className="mt-1.5 font-special text-[36px] leading-tight text-brand-pink desk:text-[42px]">
          {price}
        </p>
        <p className="mt-2.5 font-body text-[15px] leading-snug text-brand-pink desk:text-[22px]">
          {desc}
        </p>
      </div>
      {badge && <StarburstBadge label={badge} />}
    </div>
  );
}

/** Badge a stella rossa "Il più completo e richiesto!" (replica `_LpStarburstPainter`). */
function StarburstBadge({ label }: { label: string }) {
  return (
    <div className="absolute -bottom-12 -right-3 h-[130px] w-[130px] desk:-bottom-12 desk:-right-10 desk:h-[170px] desk:w-[170px]">
      <svg viewBox="0 0 200 200" className="h-full w-full drop-shadow-sm">
        <polygon points={starburstPoints(100, 100, 100, 78, 14)} fill="#E01919" />
      </svg>
      <span className="absolute inset-0 grid rotate-[20deg] place-items-center px-3 text-center font-body text-[13px] font-bold leading-tight text-white desk:text-[18px]">
        {label}
      </span>
    </div>
  );
}

/** Genera i vertici di una stella a `points` punte (outer/inner radius). */
function starburstPoints(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points: number,
): string {
  const verts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    verts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return verts.join(' ');
}

function BomboniereColumn({
  desc,
  btn,
  href,
}: {
  desc: string;
  btn: string;
  href: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <p className="whitespace-pre-line font-body text-[15px] leading-relaxed text-brand-pink desk:text-[22px]">
        {desc}
      </p>
      <Link
        href={href}
        className="mt-5 inline-block rounded-full bg-brand-pinkBright px-7 py-3.5 font-special text-[22px] text-brand-cream2 transition-all duration-200 desk:px-9 desk:py-[18px] desk:text-[28px] desk:hover:-translate-y-0.5 desk:hover:shadow-lift"
      >
        {btn}
      </Link>
    </div>
  );
}
