'use client';

import { useState } from 'react';

export type LpReview = {
  nameDate: string;
  title: string;
  text: string;
};

/**
 * Carosello recensioni della pagina Live Painting (replica
 * `_LpTestimonialSection` Flutter): card bianca con fade tra le recensioni,
 * titolo "Dicono di me.." in overlay, frecce (solo desktop) e pallini.
 */
export function LpTestimonials({
  title,
  reviews,
}: {
  title: string;
  reviews: LpReview[];
}) {
  const [index, setIndex] = useState(0);
  const n = reviews.length;
  const goTo = (i: number) => setIndex(((i % n) + n) % n);
  const current = reviews[index];

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="relative">
        {/* Card recensione */}
        <div className="mt-9 rounded-[24px] bg-white desk:mt-14 desk:rounded-[36px]">
          <div className="flex flex-col px-[22px] py-7 desk:px-[52px] desk:py-10">
            <p className="font-title text-[22px] font-bold leading-snug text-brand-red desk:text-[32px]">
              {current.nameDate}
            </p>
            <p className="mt-3 font-body text-[15px] font-extrabold text-brand-red desk:mt-[18px] desk:text-[22px]">
              {current.title}
            </p>
            <p className="mt-2 whitespace-pre-line font-body text-[15px] leading-[1.65] text-[#F0508A] desk:mt-3 desk:text-[22px]">
              {current.text}
            </p>
          </div>
        </div>

        {/* Titolo "Dicono di me.." in overlay */}
        <span className="pointer-events-none absolute -left-2.5 -top-2.5 font-special text-[52px] leading-[0.9] text-brand-red desk:-left-10 desk:-top-6 desk:text-[90px] wide:-left-20">
          {title}
        </span>

        {/* Frecce (solo desktop) */}
        <ArrowButton side="left" onClick={() => goTo(index - 1)} />
        <ArrowButton side="right" onClick={() => goTo(index + 1)} />
      </div>

      {/* Pallini indicatori */}
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        {reviews.map((r, i) => {
          const active = i === index;
          return (
            <button
              key={r.nameDate + i}
              type="button"
              aria-label={`${i + 1}`}
              aria-current={active}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-200 ${
                active ? 'w-5 bg-brand-red' : 'w-2 bg-brand-pink/40'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

function ArrowButton({
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
      className={`absolute top-1/2 hidden h-14 w-14 -translate-y-1/2 place-items-center rounded-full bg-white text-3xl leading-none text-brand-red shadow-[0_2px_8px_rgba(0,0,0,0.13)] transition hover:-translate-y-[calc(50%+2px)] desk:grid ${
        side === 'left' ? '-left-6' : '-right-6'
      }`}
    >
      <span className="pb-1">{side === 'left' ? '‹' : '›'}</span>
    </button>
  );
}
