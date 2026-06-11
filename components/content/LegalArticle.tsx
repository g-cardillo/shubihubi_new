import { getTranslations } from 'next-intl/server';
import { RichText } from './RichText';

// Fascia hero a righe verticali crema/rosa (stesso pattern di Gallery/Events).
const STRIPES =
  'repeating-linear-gradient(to right, rgba(238,103,171,0.22) 0 2px, transparent 2px 22px)';

/**
 * Renderer per le pagine legali (Cookie Policy, Shipping, Terms).
 * Riceve il namespace i18n e la sequenza ordinata di chiavi (così come
 * appaiono nella pagina Flutter originale) e le classifica per suffisso:
 *  - prima chiave            → titolo pagina (hero Genty rosa su righe)
 *  - 'effective_date'        → sottotitolo (data di efficacia)
 *  - *_title                 → titolo di sezione (h2)
 *  - *_b{n} / *_rb{n}        → punto elenco (raggruppati in <ul>)
 *  - *_bold                  → paragrafo in grassetto
 *  - tutto il resto          → paragrafo (con markdown inline)
 */
export async function LegalArticle({
  namespace,
  keys,
}: {
  namespace: string;
  keys: string[];
}) {
  const t = await getTranslations(namespace);

  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flushBullets = () => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="my-3 list-disc space-y-1 pl-6">
        {bullets.map((b) => (
          <li key={b} className="whitespace-pre-line">
            <RichText>{t(b)}</RichText>
          </li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  // La prima chiave è il titolo pagina: va nella fascia hero, non nell'articolo.
  const pageTitle = t(keys[0]);

  keys.forEach((key, i) => {
    if (i === 0) return;
    const isBullet = /r?b\d+$/.test(key);
    if (isBullet) {
      bullets.push(key);
      return;
    }
    flushBullets();

    const value = t(key);
    if (key === 'effective_date') {
      blocks.push(
        <p key={key} className="mb-6 text-sm text-neutral-500">
          {value}
        </p>,
      );
    } else if (key.endsWith('_title')) {
      blocks.push(
        <h2 key={key} className="mt-8 text-xl font-semibold text-neutral-900">
          {value}
        </h2>,
      );
    } else if (key.endsWith('_bold')) {
      blocks.push(
        <p key={key} className="my-2 font-semibold text-neutral-900">
          {value}
        </p>,
      );
    } else {
      blocks.push(
        <RichText key={key} className="my-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
          {value}
        </RichText>,
      );
    }
  });
  flushBullets();

  return (
    <>
      {/* Hero: titolo Genty rosa su fascia a righe verticali (come Flutter). */}
      <section
        className="flex min-h-[220px] items-center justify-center px-4 py-10 desk:min-h-[300px]"
        style={{ backgroundColor: '#FFFDE7', backgroundImage: STRIPES }}
      >
        <h1 className="text-center font-special text-[44px] leading-[1.05] text-brand-pink desk:text-[72px]">
          {pageTitle}
        </h1>
      </section>
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <article>{blocks}</article>
      </main>
    </>
  );
}
