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
  const t = await getTranslations({ locale, namespace: 'livePainting' });
  return { title: t('hero_title') };
}

export default async function LivePaintingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('livePainting');

  const cards = [
    { title: 'card1_title', desc: 'card1_desc' },
    { title: 'card2_title', desc: 'card2_desc' },
    { title: 'card3_title', desc: 'card3_desc' },
    { title: 'card4_title', desc: 'card4_desc', badge: 'card4_badge' },
  ];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-neutral-900">{t('hero_title')}</h1>
      <p className="mt-4 whitespace-pre-line text-neutral-700">{t('hero_left')}</p>
      <p className="mt-2 whitespace-pre-line text-neutral-700">{t('hero_right')}</p>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-neutral-900">
          {t('about_h1')} {t('about_h2')}
        </h2>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
          {t('about_body1')}
        </p>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
          {t('about_body2')}
        </p>
        <Link href="/contacts" className="mt-4 inline-block underline">
          {t('about_cta')}
        </Link>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
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
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-neutral-900">{t('pricing_title')}</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
          {t('pricing_body')}
        </p>
      </section>

      <section className="mt-12 rounded-xl bg-neutral-100 p-6 text-center">
        <p className="whitespace-pre-line text-neutral-800">{t('cta_text')}</p>
        <Link
          href="/contacts"
          className="mt-4 inline-block rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-700"
        >
          {t('cta_btn')}
        </Link>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-neutral-900">{t('bomboniere_title')}</h2>
        <p className="mt-1 text-sm text-neutral-600">{t('bomboniere_subtitle')}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 p-4">
            <p className="whitespace-pre-line text-sm text-neutral-700">{t('bomboniere_shop_desc')}</p>
            <Link href="/shop" className="mt-3 inline-block underline">
              {t('bomboniere_shop_btn')}
            </Link>
          </div>
          <div className="rounded-lg border border-neutral-200 p-4">
            <p className="whitespace-pre-line text-sm text-neutral-700">{t('bomboniere_contact_desc')}</p>
            <Link href="/contacts" className="mt-3 inline-block underline">
              {t('bomboniere_contact_btn')}
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-neutral-900">{t('reviews_title')}</h2>
      </section>
    </main>
  );
}
