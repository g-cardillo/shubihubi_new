import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { SITE } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'support' });
  return { title: t('title') };
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('support');

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-neutral-900">{t('title')}</h1>
      <p className="mt-4 text-sm leading-relaxed text-neutral-700">{t('intro')}</p>

      <p className="mt-4 text-sm text-neutral-700">
        {t('email_cta')}{' '}
        <a href={`mailto:${SITE.supportEmail}`} className="underline">
          {SITE.supportEmail}
        </a>
      </p>

      {/* TODO Fase form: integrare il modulo di supporto (supportForm Cloud Function). */}
      <p className="mt-6 text-sm text-neutral-500">
        <Link href="/contacts" className="underline">
          FAQ &amp; contatti
        </Link>
      </p>
    </main>
  );
}
