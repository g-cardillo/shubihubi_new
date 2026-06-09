import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { LegalArticle } from '@/components/content/LegalArticle';

// Sequenza di chiavi nell'ordine della pagina Flutter (TermsPage.dart).
const KEYS = [
  'title', 'effective_date', 'intro',
  's1_title', 's1_body', 's1_form_pre', 's1_form_post',
  's2_title', 's2_body', 's3_title', 's3_body',
  's4_title', 's4_intro', 's4_b1', 's4_b2', 's4_mid', 's4_b3', 's4_b4', 's4_b5',
  's5_title', 's5_body',
  's6_title', 's6_pre', 's6_post', 's7_title', 's7_pre', 's7_post',
  's8_title', 's8_body', 's9_title', 's9_body',
  's10_title', 's10_intro', 's10_b1', 's10_b2', 's10_b3', 's10_outro',
  's11_title', 's11_body', 's12_title', 's12_body', 's13_title', 's13_body',
  's14_title', 's14_body',
  's15_title', 's15_pre', 's15_bold', 's15_mid', 's15_post',
  's16_title', 's16_body', 's17_title', 's17_body',
  's18_title', 's18_pre', 's18_post', 's19_title', 's19_pre', 's19_post',
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'terms' });
  return { title: t('title') };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalArticle namespace="terms" keys={KEYS} />;
}
