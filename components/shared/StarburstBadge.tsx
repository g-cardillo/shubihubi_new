/**
 * Badge a stella rossa (replica `_StarburstPainter` / `_LpStarburstPainter`):
 * stella a 14 punte rossa con label bianca ruotata, sovrapposta in basso a
 * destra di una card prezzo. Usato in Live Painting e Stationery.
 */
export function StarburstBadge({ label }: { label: string }) {
  return (
    <div className="absolute -bottom-12 -right-3 h-[130px] w-[130px] desk:-right-10 desk:h-[170px] desk:w-[170px]">
      <svg viewBox="0 0 200 200" className="h-full w-full drop-shadow-sm">
        <polygon points={starburstPoints(100, 100, 100, 78, 14)} fill="#E01919" />
      </svg>
      <span className="absolute inset-0 grid rotate-[20deg] place-items-center px-3 text-center font-body text-[13px] font-bold leading-tight text-white desk:text-[18px]">
        {label}
      </span>
    </div>
  );
}

/** Vertici di una stella a `points` punte (raggio esterno/interno). */
function starburstPoints(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points: number,
): string {
  const verts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    verts.push(
      `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return verts.join(' ');
}
