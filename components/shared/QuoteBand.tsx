/**
 * Banda citazione a tutta larghezza (replica `QuoteBand` di GalleryView):
 * sfondo pieno, testo in corsivo centrato (Gowun) + autore sotto (Quicksand
 * light). Colori sfondo/testo parametrizzabili — si alternano rosa/crema.
 */
export function QuoteBand({
  quote,
  author,
  bgClassName,
  textClassName,
}: {
  quote: string;
  author: string;
  bgClassName: string;
  textClassName: string;
}) {
  return (
    <section className={`w-full px-6 py-7 desk:px-20 desk:py-10 ${bgClassName}`}>
      <div className={`mx-auto max-w-[860px] text-center ${textClassName}`}>
        <p className="font-title text-[18px] italic leading-[1.45] desk:text-[26px]">
          {quote}
        </p>
        <p className="mt-2.5 font-body text-[15px] font-light desk:text-[22px]">
          {author}
        </p>
      </div>
    </section>
  );
}
