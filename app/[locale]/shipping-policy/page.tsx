import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { LegalArticle } from '@/components/content/LegalArticle';

// Sequenza di chiavi nell'ordine della pagina Flutter (ShippingPolicyPage.dart).
const KEYS = [
  'title', 'effective_date', 'intro_pre', 'intro_post',
  's1_title', 's1_body',
  's2_title', 's2_intro', 's2_b1', 's2_b2',
  's3_title', 's3_body',
  's4_title', 's4_intro', 's4_b1', 's4_b2', 's4_outro',
  's5_title', 's5_body', 's6_title', 's6_body',
  's7_title', 's7_intro_pre', 's7_intro_post', 's7_b1', 's7_b2',
  's7_outro_a', 's7_outro_bold', 's7_outro_b', 's7_rb1', 's7_rb2',
  's8_title', 's8_body_pre', 's8_body_post',
  's9_title', 's9_intro_pre', 's9_intro_post', 's9_b1', 's9_b2', 's9_outro',
  's10_title', 's10_intro_pre', 's10_intro_post', 's10_b1', 's10_b2', 's10_outro',
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'shippingPolicy' });
  return { title: t('title') };
}

export default async function ShippingPolicyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalArticle namespace="shippingPolicy" keys={KEYS} />;
}
