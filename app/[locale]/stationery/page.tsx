import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';

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

  const priceCards = [1, 2, 3, 4, 5, 6].map((n) => ({
    title: `price_card${n}_title`,
    desc: `price_card${n}_desc`,
    badge: n === 6 ? 'price_card6_badge' : undefined,
  }));

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-neutral-900">{t('hero_title')}</h1>
      <p className="mt-4 whitespace-pre-line text-neutral-700">{t('intro_left')}</p>
      <p className="mt-2 whitespace-pre-line text-neutral-700">{t('intro_right')}</p>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-neutral-900">
          {t('section_h1')} {t('section_h2')}
        </h2>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
          {t('section_body1')}
        </p>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
          {t('section_body2')}
        </p>
        <Link
          href="/contacts"
          className="mt-4 inline-block rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-700"
        >
          {t('section_btn')}
        </Link>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-neutral-900">{t('price_title')}</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
          {t('price_body')}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {priceCards.map((c) => (
            <div key={c.title} className="rounded-lg border border-neutral-200 p-4">
              {c.badge && (
                <span className="mb-1 inline-block rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                  {t(c.badge)}
                </span>
              )}
              <h3 className="font-semibold text-neutral-900">{t(c.title)}</h3>
              <p className="mt-1 whitespace-pre-line text-sm text-neutral-600">{t(c.desc)}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
