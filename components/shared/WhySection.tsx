/**
 * Sezione "Perché …" condivisa da Live Painting e Stationery (replica
 * `WhyLivePaintingSection` / `WhyCoordinatoSection`): fondo crema con texture
 * watercolour ripetuta, card bianca arrotondata, titolo Genty rosso in overlay,
 * sottotitolo Gowun rosa e tre punti con bullet ✦ (supporta **grassetto**).
 */
export function WhySection({
  patternSrc,
  title,
  subtitle,
  points,
}: {
  patternSrc: string;
  title: string;
  subtitle: string;
  points: string[];
}) {
  return (
    <section
      className="bg-[#F4E8B8] px-4 py-[72px] desk:px-10 desk:py-[120px]"
      style={{ backgroundImage: `url('${patternSrc}')`, backgroundRepeat: 'repeat' }}
    >
      <div className="relative mx-auto max-w-[1350px]">
        <div className="mt-9 rounded-[28px] bg-white px-[22px] pb-7 pt-[60px] desk:mt-14 desk:rounded-[40px] desk:px-[70px] desk:pb-[46px] desk:pt-[82px]">
          <div className="px-0 py-5 wide:px-[100px]">
            <h2 className="max-w-[980px] whitespace-pre-line font-title text-[42px] leading-[0.95] text-brand-pink desk:text-[78px]">
              {subtitle}
            </h2>
            <div className="mt-[18px] max-w-[980px] desk:mt-7">
              {points.map((p, i) => (
                <WhyPoint key={i} text={p} />
              ))}
            </div>
          </div>
        </div>
        <span className="absolute left-[18px] top-0 font-special text-[64px] leading-[0.9] text-brand-red desk:left-10 desk:text-[116px]">
          {title}
        </span>
      </div>
    </section>
  );
}

/** Punto con bullet ✦ e parsing di **grassetto** (replica `WhyPoint`). */
export function WhyPoint({ text }: { text: string }) {
  const parts = text.split('**');
  return (
    <div className="mb-2.5 flex items-start gap-2.5 desk:mb-3.5 desk:gap-3.5">
      <span className="mt-0.5 font-body text-[18px] font-extrabold text-brand-red desk:mt-1 desk:text-[28px]">
        ✦
      </span>
      <p className="font-body text-[18px] font-medium leading-snug text-brand-red desk:text-[27px]">
        {parts.map((p, i) =>
          i % 2 === 1 ? (
            <strong key={i} className="font-extrabold">
              {p}
            </strong>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </p>
    </div>
  );
}
