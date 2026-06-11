import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { SupportForm } from '@/components/support/SupportForm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'support' });
  return { title: t('form_title') };
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fondo bianco come `SupportView` Flutter; il footer globale è bianco su /support.
  return (
    <div className="bg-white px-6 py-8 desk:py-12">
      <SupportForm />
    </div>
  );
}
