import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { getLatest } from '@/lib/products/repository';
import { ProductGrid } from '@/components/product/ProductGrid';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const latest = await getLatest(4);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      {/* Hero */}
      <section className="py-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-pinkHot">
          {t('my_work_label')} {t('my_work_bold')}
        </p>
        <h1 className="mt-3 font-home text-4xl font-bold text-brand-redTitle desk:text-6xl">
          {t('give_shape')} {t('ideas')}
        </h1>
        <p className="mt-4 max-w-2xl whitespace-pre-line text-ink">
          {t('welcome')} {t('welcome_bold')}
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-brand-pink px-7 py-3 font-semibold text-white transition-all duration-200 desk:hover:-translate-y-0.5 desk:hover:shadow-pink-cta"
        >
          {t('visit_my')} — {t('here_btn')}
        </Link>
      </section>

      {/* Ultimi prodotti */}
      <section className="mt-8">
        {latest.length > 0 ? (
          <ProductGrid products={latest} locale={locale} />
        ) : (
          <p className="py-8 text-center text-sm text-neutral-500">{t('no_products')}</p>
        )}
      </section>

      {/* Promo Live Painting */}
      <Promo
        title={t('lp_title')}
        body={t('lp_body')}
        cta={t('lp_btn')}
        href="/live-painting"
      />

      {/* Promo Stationery */}
      <Promo
        title={t('stat_title')}
        body={t('stat_body')}
        cta={t('stat_btn')}
        href="/stationery"
      />

      {/* CTA Gallery */}
      <section className="mt-12 rounded-card bg-brand-cream p-8 text-center">
        <h2 className="text-2xl font-bold text-brand-redTitle">{t('gallery_cta_title')}</h2>
        <p className="mt-2 text-ink">{t('gallery_cta_sub')}</p>
        <Link
          href="/gallery"
          className="mt-4 inline-block font-semibold text-brand-pinkHot hover:underline"
        >
          {t('gallery_cta_title')}
        </Link>
      </section>
    </main>
  );
}

function Promo({
  title,
  body,
  cta,
  href,
}: {
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <section className="mt-12 grid items-center gap-4 rounded-card border-2 border-brand-pinkSkin p-8 sm:grid-cols-[2fr_1fr]">
      <div>
        <h2 className="text-2xl font-bold text-brand-redTitle">{title}</h2>
        <p className="mt-2 whitespace-pre-line leading-relaxed text-ink">{body}</p>
      </div>
      <Link
        href={href}
        className="inline-block justify-self-start rounded-full bg-brand-pink px-6 py-3 font-semibold text-white transition-all duration-200 desk:hover:-translate-y-0.5 desk:hover:shadow-pink-cta sm:justify-self-end"
      >
        {cta}
      </Link>
    </section>
  );
}
