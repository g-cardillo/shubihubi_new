import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { SITE } from '@/lib/site';

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
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-neutral-900">{t('title')}</h1>
      <p className="mt-4 whitespace-pre-line text-neutral-700">{t('intro')}</p>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-neutral-900">{t('workshop_title')}</h2>
        {['workshop_body1', 'workshop_body2', 'workshop_body3', 'workshop_body4'].map((k) => (
          <p key={k} className="mt-3 text-sm leading-relaxed text-neutral-700">
            {t(k)}
          </p>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-neutral-900">{t('organize_title')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-700">{t('organize_body')}</p>
        <a
          href={`mailto:${SITE.email}`}
          className="mt-4 inline-block rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-700"
        >
          {SITE.email}
        </a>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-neutral-900">{t('reviews_title')}</h2>
      </section>
    </main>
  );
}
