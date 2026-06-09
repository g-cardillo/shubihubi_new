import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { LegalArticle } from '@/components/content/LegalArticle';

// Sequenza di chiavi nell'ordine della pagina Flutter (CookiePolicyPage.dart).
const KEYS = [
  'policy_title', 'effective_date', 'intro',
  's1_title', 's1_body_pre',
  's2_title', 's2_intro', 's2_b1', 's2_b2', 's2_b3', 's2_b4', 's2_b5',
  's3_title', 's3_intro', 's3_b1', 's3_b2', 's3_b3',
  's4_title', 's4_intro', 's4_b1', 's4_b2', 's4_b3', 's4_b4', 's4_b5', 's4_b6', 's4_outro',
  's5_title', 's5_intro', 's5_b1', 's5_b2', 's5_b3', 's5_b4',
  's6_title', 's6_body', 's7_title', 's7_body', 's8_title', 's8_body',
  's9_title', 's9_body', 's10_title', 's10_body',
  's11_title', 's11_intro', 's11_b1', 's11_b2', 's11_b3', 's11_b4', 's11_b5', 's11_outro_pre', 's11_outro_post',
  's12_title', 's12_body', 's13_title', 's13_pre', 's13_post',
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cookiePolicy' });
  return { title: t('policy_title') };
}

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalArticle namespace="cookiePolicy" keys={KEYS} />;
}
