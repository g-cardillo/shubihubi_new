'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Scroll reveal: il contenuto entra con fade + translateY(20px→0) in 500ms
 * ease-out quando il wrapper entra nel viewport (IntersectionObserver), una
 * volta sola. Lo stato nascosto vive SOLO sotto `prefers-reduced-motion:
 * no-preference` (vedi `.reveal` in globals.css), quindi con reduced-motion
 * il contenuto è sempre visibile e fermo.
 *
 * I children restano Server Components: questo wrapper client aggiunge solo
 * la classe `reveal-in` al passaggio in viewport.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  /** Ritardo (ms) della transizione, per lo stagger tra sezioni. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? 'reveal-in' : ''} ${className}`}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
