import { Fragment, type ReactNode } from 'react';
import { Link } from '@/i18n/navigation';

/**
 * Renderer markdown minimale per i testi migrati da Flutter:
 *  - **grassetto**
 *  - *corsivo*
 *  - [etichetta](/rotta)  → Link locale-aware (rotte interne) o <a> (URL esterni)
 *
 * I newline si preservano con `whitespace-pre-line` sul contenitore.
 * Non è un parser markdown completo: copre solo i pattern usati nei contenuti.
 */
export function RichText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return <p className={className}>{parseInline(children)}</p>;
}

/** Variante inline (senza <p>), per titoli composti o frammenti. */
export function RichInline({ children }: { children: string }) {
  return <>{parseInline(children)}</>;
}

const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

export function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(
        <Fragment key={key++}>{parseEmphasis(text.slice(last, m.index))}</Fragment>,
      );
    }
    const [, label, target] = m;
    const isExternal = /^(https?:|mailto:|tel:)/.test(target);
    if (isExternal) {
      nodes.push(
        <a key={key++} href={target} className="text-brand-pinkHot underline" target={target.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
          {parseEmphasis(label)}
        </a>,
      );
    } else {
      const href = target.startsWith('/') ? target : `/${target}`;
      nodes.push(
        <Link key={key++} href={href} className="text-brand-pinkHot underline">
          {parseEmphasis(label)}
        </Link>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    nodes.push(<Fragment key={key++}>{parseEmphasis(text.slice(last))}</Fragment>);
  }
  return nodes;
}

/** Applica **grassetto** e *corsivo* a un segmento senza link. */
function parseEmphasis(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Token: **...** oppure *...*
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) nodes.push(<strong key={key++}>{m[1]}</strong>);
    else nodes.push(<em key={key++}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
