/**
 * Onda di raccordo riusabile (replica `_WavePainter` del Flutter): cresta in
 * alto (y=0), gola verso il basso (88% dell'altezza), tangenti orizzontali ai
 * vertici → curva sinusoidale C1-continua. Il riempimento sta SOTTO la curva;
 * lo spazio sopra è trasparente e lascia trasparire lo sfondo sovrastante.
 *
 * Responsive: due SVG alternati con `hidden`/`block` sul breakpoint `desk`
 * (900px) — 3 onde su mobile (sotto i 900px le 6 onde compresse erano troppe),
 * 6 onde su desktop.
 */

/** Sfondo crema del footer (#F5EBC1): default per il raccordo seamless. */
const FOOTER_BG = '#F5EBC1';

const WAVE_HEIGHT = 80;

function wavePath(width: number, height: number, waves: number): string {
  const seg = width / waves;
  const half = seg / 2;
  const ctrl = seg * 0.25;
  const trough = height * 0.88;

  let d = 'M0,0';
  for (let i = 0; i < waves; i++) {
    const x = seg * i;
    // cresta → gola
    d += ` C${x + ctrl},0 ${x + half - ctrl},${trough} ${x + half},${trough}`;
    // gola → cresta
    d += ` C${x + half + ctrl},${trough} ${x + seg - ctrl},0 ${x + seg},0`;
  }
  d += ` L${width},${height} L0,${height} Z`;
  return d;
}

/** Banda a onde responsive (3 onde mobile / 6 desktop), colore arbitrario. */
export function WaveBand({
  color,
  className = '',
}: {
  color: string;
  className?: string;
}) {
  return (
    <div aria-hidden className={className}>
      <svg
        className="block h-[80px] w-full desk:hidden"
        viewBox={`0 0 600 ${WAVE_HEIGHT}`}
        preserveAspectRatio="none"
      >
        <path fill={color} d={wavePath(600, WAVE_HEIGHT, 3)} />
      </svg>
      <svg
        className="hidden h-[80px] w-full desk:block"
        viewBox={`0 0 1200 ${WAVE_HEIGHT}`}
        preserveAspectRatio="none"
      >
        <path fill={color} d={wavePath(1200, WAVE_HEIGHT, 6)} />
      </svg>
    </div>
  );
}

/**
 * Bordo inferiore a onde per le sezioni che precedono un footer SENZA wave
 * (`<Footer wave={false} />`): si aggiunge come ultimo elemento full-bleed
 * della sezione colorata/scura. Il colore di default è lo sfondo del footer
 * (#F5EBC1) così la transizione sezione → footer è seamless; su pagine con
 * footer bianco (es. Contatti) passare `color="#FFFFFF"`.
 */
export function SectionWaveBottom({
  color = FOOTER_BG,
  className = '',
}: {
  color?: string;
  className?: string;
}) {
  return <WaveBand color={color} className={className} />;
}
