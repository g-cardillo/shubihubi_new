'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * Galleria immagini prodotto (design system Shubihubi): immagine principale su
 * card crema con bordo rosa pelle, frecce di navigazione e thumbnail 76×76.
 * Slot opzionali `topLeft` / `topRight` per pill di stato e badge formato.
 * Client Component (stato di selezione).
 */
export function ProductGallery({
  images,
  alt,
  topLeft,
  topRight,
}: {
  images: string[];
  alt: string;
  topLeft?: React.ReactNode;
  topRight?: React.ReactNode;
}) {
  const [active, setActive] = useState(0);
  const main = images[active];
  const many = images.length > 1;

  const go = (delta: number) =>
    setActive((i) => (i + delta + images.length) % images.length);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="relative aspect-square overflow-hidden rounded-panel border-2 border-brand-pinkSkin bg-brand-cream">
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
          <div className="flex h-full items-center justify-center text-sm text-brand-pinkHot">
            —
          </div>
        )}

        {topLeft && <div className="absolute left-4 top-4">{topLeft}</div>}
        {topRight && <div className="absolute right-4 top-4">{topRight}</div>}

        {many && (
          <>
            <NavArrow side="left" onClick={() => go(-1)} />
            <NavArrow side="right" onClick={() => go(1)} />
          </>
        )}
      </div>

      {many && (
        <ul className="flex flex-wrap gap-2.5">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`${alt} — ${i + 1}`}
                aria-current={i === active}
                className={`block h-[76px] w-[76px] rounded-[14px] border-2 bg-white p-1 transition ${
                  i === active
                    ? 'border-brand-pink'
                    : 'border-brand-pinkSkin hover:border-brand-pink'
                }`}
              >
                <span
                  className="block h-full w-full rounded-[10px] bg-cover bg-center"
                  style={{ backgroundImage: `url('${src}')` }}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NavArrow({
  side,
  onClick,
}: {
  side: 'left' | 'right';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous' : 'Next'}
      className={`absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border-2 border-brand-pinkSkin bg-white/95 pb-1 text-2xl font-bold leading-none text-brand-pink transition hover:border-brand-pink ${
        side === 'left' ? 'left-3' : 'right-3'
      }`}
    >
      {side === 'left' ? '‹' : '›'}
    </button>
  );
}
