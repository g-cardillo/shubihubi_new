import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';

// Immagini gallery migrate da assets/gallery (Flutter) → public/gallery.
const IMAGES = Array.from({ length: 24 }, (_, i) => `/gallery/galleria-${25 + i}.webp`);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'gallery' });
  return { title: t('title') };
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('gallery');

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-neutral-900">{t('title')}</h1>

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {IMAGES.map((src, i) => (
          <li key={src} className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
            <Image
              src={src}
              alt={`${t('title')} ${i + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
