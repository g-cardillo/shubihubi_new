'use client';

import { useState } from 'react';

/**
 * Voce FAQ con apertura animata: sostituisce il `<details>` (display:none
 * secco) con il trick `grid-template-rows: 0fr → 1fr` in 300ms, che anima
 * l'altezza reale del contenuto senza il salto del max-height fisso.
 * Domanda e risposta arrivano già tradotte dal server, quindi il testo resta
 * nell'HTML iniziale (SEO invariato rispetto a `<details>`).
 */
export function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-brand-pink/25">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="font-body text-[16px] font-semibold text-brand-pink desk:text-[20px]">
          {question}
        </span>
        <span
          aria-hidden
          className={`shrink-0 text-brand-pink transition-transform duration-200 ${
            open ? 'rotate-90' : ''
          }`}
        >
          ›
        </span>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <p className="whitespace-pre-line pb-5 pl-4 pr-8 font-body text-[15px] leading-relaxed text-brand-pinkHot desk:pl-6 desk:text-[18px]">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
