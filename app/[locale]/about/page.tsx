import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { RichText } from '@/components/content/RichText';

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
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <p className="whitespace-pre-line text-center text-lg italic text-neutral-600">
        {t('quote')}
      </p>

      <h1 className="mt-10 text-3xl font-semibold text-neutral-900">
        {t('banner')}
      </h1>
      <p className="mt-2 whitespace-pre-line text-neutral-700">
        {t('iam')}
        {t('created')}
      </p>

      <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
        {t('bio')}
      </p>

      <Link
        href="/contacts"
        className="mt-6 inline-block rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-700"
      >
        {t('cta_btn')}
      </Link>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-neutral-900">
          {t('creative_process_title')} {t('creative_process_special')}
        </h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            {['cp_left1', 'cp_left2', 'cp_left3'].map((k) => (
              <RichText key={k} className="text-sm leading-relaxed text-neutral-700">
                {t(k)}
              </RichText>
            ))}
          </div>
          <div className="space-y-3">
            {['cp_right1', 'cp_right2', 'cp_right3'].map((k) => (
              <RichText key={k} className="text-sm leading-relaxed text-neutral-700">
                {t(k)}
              </RichText>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-neutral-900">
          {t('watch_title1')}
          {t('watch_title2')}
        </h2>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-neutral-900">
          {t('sketches_title1')} {t('sketches_title2')}
        </h2>
      </section>
    </main>
  );
}
