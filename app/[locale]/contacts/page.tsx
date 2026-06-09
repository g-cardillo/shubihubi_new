import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { SITE } from '@/lib/site';
import { RichText } from '@/components/content/RichText';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: t('contacts') };
}

// Gruppi FAQ con relativo numero di domande (cfr. ContactsView.dart).
const GROUPS = [
  { titleKey: 'faq_title', prefix: 'faq', count: 9 },
  { titleKey: 'shop_title', prefix: 'shop', count: 4 },
  { titleKey: 'ship_title', prefix: 'ship', count: 8 },
  { titleKey: 'orders_title', prefix: 'orders', count: 8 },
];

export default async function ContactsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contacts');
  const tn = await getTranslations('nav');

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-neutral-900">{tn('contacts')}</h1>

      <ul className="mt-4 space-y-1 text-sm text-neutral-700">
        <li>
          Email:{' '}
          <a href={`mailto:${SITE.email}`} className="underline">
            {SITE.email}
          </a>
        </li>
        <li>
          Instagram:{' '}
          <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" className="underline">
            @shubihubi
          </a>
        </li>
        <li>
          WhatsApp:{' '}
          <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer" className="underline">
            +39 345 344 6337
          </a>
        </li>
      </ul>

      {GROUPS.map((g) => (
        <section key={g.prefix} className="mt-10">
          <h2 className="text-xl font-semibold text-neutral-900">{t(g.titleKey)}</h2>
          <div className="mt-3 divide-y divide-neutral-200 border-t border-neutral-200">
            {Array.from({ length: g.count }, (_, i) => i + 1).map((n) => (
              <details key={n} className="group py-3">
                <summary className="cursor-pointer text-sm font-medium text-neutral-900">
                  {t(`${g.prefix}_q${n}`)}
                </summary>
                <RichText className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-600">
                  {t(`${g.prefix}_a${n}`)}
                </RichText>
              </details>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-10 rounded-lg bg-neutral-100 p-5 text-center">
        <p className="font-medium text-neutral-900">{t('not_found')}</p>
        <p className="text-sm text-neutral-600">
          {t('not_found_sub')}:{' '}
          <a href={`mailto:${SITE.supportEmail}`} className="underline">
            {SITE.supportEmail}
          </a>
        </p>
      </section>
    </main>
  );
}
