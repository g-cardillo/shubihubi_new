'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * Galleria immagini prodotto: immagine principale + thumbnail cliccabili.
 * Client Component (stato di selezione). Sostituisce `PhotoViewerPage` Flutter.
 */
export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const main = images[active];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden rounded-panel bg-black/[0.06]">
        {main ? (
          <Image
            src={main}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            —
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="flex flex-wrap gap-3">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`${alt} — ${i + 1}`}
                aria-current={i === active}
                className={`relative h-16 w-16 overflow-hidden rounded-[10px] border-2 transition ${
                  i === active
                    ? 'border-brand-pink'
                    : 'border-brand-pinkSkin hover:border-brand-pink'
                }`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
