import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { ContactForm } from '@/components/contact/ContactForm';

const SUPPORT_EMAIL = 'support@shubihubi.com';

// Gruppi FAQ — mappatura fedele a ContactsView.dart.
const GROUPS: Array<{ titleKey: string; questions: Array<[string, string]> }> = [
  {
    titleKey: 'faq_title',
    questions: Array.from({ length: 8 }, (_, i) => [`faq_q${i + 1}`, `faq_a${i + 1}`] as [string, string]),
  },
  {
    titleKey: 'shop_title',
    questions: [
      ...Array.from({ length: 4 }, (_, i) => [`shop_q${i + 1}`, `shop_a${i + 1}`] as [string, string]),
      ['faq_q9', 'faq_a9'],
    ],
  },
  {
    titleKey: 'ship_title',
    questions: Array.from({ length: 8 }, (_, i) => [`ship_q${i + 1}`, `ship_a${i + 1}`] as [string, string]),
  },
  {
    titleKey: 'orders_title',
    questions: Array.from({ length: 8 }, (_, i) => [`orders_q${i + 1}`, `orders_a${i + 1}`] as [string, string]),
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: t('contacts') };
}

export default async function ContactsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contacts');

  return (
    <div className="bg-white">
      {/* ── 1. Form Scrivimi + foto ovale — centrati ──────────────────────── */}
      <section className="px-6 py-12 desk:py-16">
        <div className="mx-auto flex max-w-[1140px] flex-col items-center gap-10 desk:flex-row desk:items-center desk:justify-center desk:gap-12">
          <ContactForm />
          <div className="flex w-full justify-center desk:w-auto">
            <div className="relative aspect-square w-full max-w-[420px] overflow-hidden rounded-full">
              <Image
                src="/gallery/profilo.webp"
                alt="Clarissa"
                fill
                sizes="(min-width:900px) 420px, 80vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. FAQ (sfondo crema) ─────────────────────────────────────────── */}
      <section className="bg-brand-cream px-6 py-16 desk:px-[60px] desk:py-24">
        <div className="mx-auto flex max-w-content flex-col gap-16">
          {GROUPS.map((g) => (
            <div key={g.titleKey}>
              <h2 className="mb-6 font-title text-[28px] font-bold uppercase tracking-wide text-brand-pink desk:mb-8 desk:text-[44px]">
                {t(g.titleKey)}
              </h2>
              <div className="border-t border-brand-pink/25">
                {g.questions.map(([qk, ak]) => (
                  <details key={qk} className="group border-b border-brand-pink/25">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                      <span className="font-body text-[16px] font-semibold text-brand-pink desk:text-[20px]">
                        {t(qk)}
                      </span>
                      <span className="shrink-0 text-brand-pink transition-transform duration-200 group-open:rotate-90">
                        ›
                      </span>
                    </summary>
                    <p className="whitespace-pre-line pb-5 pl-4 pr-8 font-body text-[15px] leading-relaxed text-brand-pinkHot desk:pl-6 desk:text-[18px]">
                      {t(ak)}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Banner "Non hai trovato la risposta?" ──────────────────────── */}
      <section className="bg-brand-cream px-6 py-12">
        <div className="mx-auto flex max-w-content flex-col items-center text-center">
          <p className="font-body text-[16px] font-semibold leading-relaxed text-brand-pink desk:text-[20px]">
            {t('not_found')}
          </p>
          <p className="mt-1.5 font-body text-[15px] leading-relaxed text-brand-pink desk:text-[18px]">
            {t('not_found_sub')}
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-1 font-body text-[15px] font-bold text-brand-pink underline desk:text-[18px]"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
      </section>
    </div>
  );
}
