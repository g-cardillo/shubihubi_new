'use client';

import { useEffect, useState } from 'react';

/**
 * Hero video Vimeo — replica il comportamento di `vimeo_hero.dart` del Flutter,
 * dove l'iframe NON è nell'HTML iniziale ma viene iniettato via JS dopo il boot
 * dell'app. Qui montiamo l'iframe solo dopo l'idratazione (`mounted`), così il
 * player Vimeo si inizializza a pagina pronta invece che durante l'SSR/hydration
 * (causa tipica del "Player error" su embed renderizzati lato server).
 */
export function VimeoHero({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const src =
    `https://player.vimeo.com/video/${videoId}` +
    `?autoplay=1&muted=1&loop=1&background=1&autopause=0&dnt=1`;

  return (
    <div className="pointer-events-none absolute inset-0">
      {mounted && (
        <iframe
          src={src}
          allow="autoplay; fullscreen; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
          title={title}
        />
      )}
    </div>
  );
}
