'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Macro-categoria con le sottocategorie disponibili (derivate dai prodotti). */
export interface ShopMacro {
  /** Valore canonico `macroId` su Firestore. */
  value: string;
  /** Etichetta localizzata mostrata nel tab. */
  label: string;
  subs: Array<{ value: string; label: string }>;
}

/** Ritardo di chiusura del dropdown all'uscita del mouse (come Flutter: 120ms). */
const CLOSE_DELAY_MS = 120;

/**
 * Barra macro-categorie dello shop (replica `ShopCategoriesBar` Flutter):
 * - prima voce "Tutti" (value vuoto, senza dropdown);
 * - desktop (hover): hover su una macro apre il dropdown delle sottocategorie,
 *   click sulla macro seleziona tutta la macro;
 * - mobile (touch): primo tap apre il dropdown, secondo tap sulla stessa macro
 *   lo chiude e seleziona tutta la macro;
 * - click/tap su una sottocategoria filtra per macro + sottocategoria.
 * La voce attiva ha l'underline rosa brand (#EE67AB).
 */
export function CategoryBar({
  macros,
  activeMacro,
  activeSub,
  allLabel,
  onSelectMacro,
  onSelectSub,
}: {
  macros: ShopMacro[];
  activeMacro: string;
  activeSub: string;
  allLabel: string;
  onSelectMacro: (macro: string) => void;
  onSelectSub: (macro: string, sub: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);
  // Tipo dell'ultimo pointer sul bottone macro: distingue tap touch da click mouse.
  const lastPointer = useRef<string>('mouse');

  // ── Indicatore attivo scorrevole ───────────────────────────────────────────
  // Un'unica barretta rosa (#EE67AB) assoluta dentro la <ul> che trasla
  // (translateX + width) sul tab attivo con transizione 300ms.
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null);

  const registerTab = useCallback(
    (value: string) => (el: HTMLButtonElement | null) => {
      if (el) tabRefs.current.set(value, el);
      else tabRefs.current.delete(value);
    },
    [],
  );

  const measureIndicator = useCallback(() => {
    const btn = tabRefs.current.get(activeMacro);
    // offsetParent dei bottoni = la <ul> (relative), quindi offsetLeft è già
    // nello spazio di coordinate dell'indicatore.
    setIndicator(btn ? { x: btn.offsetLeft, w: btn.offsetWidth } : null);
  }, [activeMacro]);

  useEffect(() => {
    measureIndicator();
    window.addEventListener('resize', measureIndicator);
    // Ri-misura quando i webfont arrivano (cambiano la larghezza dei tab).
    document.fonts?.ready.then(measureIndicator).catch(() => {});
    return () => window.removeEventListener('resize', measureIndicator);
  }, [measureIndicator]);

  const cancelClose = useCallback(() => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(null), CLOSE_DELAY_MS);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  function handleMacroClick(m: ShopMacro) {
    const isTouch = lastPointer.current === 'touch';
    if (m.subs.length === 0 || !isTouch) {
      // Desktop o macro senza sottocategorie: il click seleziona la macro.
      onSelectMacro(m.value);
      setOpen(null);
      return;
    }
    // Touch: primo tap apre il dropdown, secondo tap seleziona tutta la macro.
    if (open === m.value) {
      onSelectMacro(m.value);
      setOpen(null);
    } else {
      cancelClose();
      setOpen(m.value);
    }
  }

  const openMacro = open ? macros.find((m) => m.value === open) : undefined;

  return (
    <div className="relative" onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
      <nav aria-label={allLabel} className="overflow-x-auto border-b border-black/10">
        <ul className="relative flex w-max gap-7 px-1">
          {/* Indicatore attivo: scorre tra i tab (300ms ease). */}
          <span
            aria-hidden
            className="absolute bottom-0 left-0 h-0.5 rounded-full bg-brand-pink transition-[transform,width] duration-300 ease-out"
            style={{
              width: indicator?.w ?? 0,
              transform: `translateX(${indicator?.x ?? 0}px)`,
              opacity: indicator ? 1 : 0,
            }}
          />
          <li>
            <TabButton
              buttonRef={registerTab('')}
              isActive={activeMacro === ''}
              onClick={() => {
                onSelectMacro('');
                setOpen(null);
              }}
            >
              {allLabel}
            </TabButton>
          </li>
          {macros.map((m) => {
            const isActive = m.value === activeMacro;
            const hasMenu = m.subs.length > 0;
            return (
              <li
                key={m.value}
                onPointerEnter={(e) => {
                  // Solo hover mouse — i tap touch generano pointerenter ma non
                  // devono aprire il dropdown (lo gestisce il click in due tap).
                  if (e.pointerType !== 'mouse' || !hasMenu) return;
                  cancelClose();
                  setOpen(m.value);
                }}
              >
                <TabButton
                  buttonRef={registerTab(m.value)}
                  isActive={isActive}
                  ariaExpanded={hasMenu ? open === m.value : undefined}
                  ariaHasPopup={hasMenu || undefined}
                  onPointerDown={(type) => {
                    lastPointer.current = type || 'mouse';
                  }}
                  onFocus={() => {
                    if (hasMenu) setOpen(m.value);
                  }}
                  onClick={() => handleMacroClick(m)}
                >
                  {m.label}
                </TabButton>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Dropdown sottocategorie: pannello a tutta larghezza sotto la barra. */}
      {openMacro && openMacro.subs.length > 0 && (
        <div className="absolute inset-x-0 top-full z-20 border-b border-black/10 bg-white shadow-lg">
          <ul className="flex flex-wrap gap-x-7 gap-y-2.5 px-4 py-4">
            {openMacro.subs.map((s) => {
              const isSel =
                openMacro.value === activeMacro &&
                s.value.toLowerCase() === activeSub.toLowerCase();
              return (
                <li key={s.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSub(openMacro.value, s.value);
                      setOpen(null);
                    }}
                    className={`whitespace-nowrap py-1 text-sm transition-colors ${
                      isSel
                        ? 'font-semibold text-brand-pink'
                        : 'text-ink/70 hover:text-brand-pink'
                    }`}
                  >
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function TabButton({
  buttonRef,
  isActive,
  onClick,
  onPointerDown,
  onFocus,
  ariaExpanded,
  ariaHasPopup,
  children,
}: {
  buttonRef?: (el: HTMLButtonElement | null) => void;
  isActive: boolean;
  onClick: () => void;
  onPointerDown?: (pointerType: string) => void;
  onFocus?: () => void;
  ariaExpanded?: boolean;
  ariaHasPopup?: boolean;
  children: React.ReactNode;
}) {
  // L'underline attiva è disegnata dall'indicatore scorrevole nella <ul>;
  // il border-b trasparente resta solo per mantenere identico il layout.
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown ? (e) => onPointerDown(e.pointerType) : undefined}
      onFocus={onFocus}
      aria-current={isActive ? 'page' : undefined}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup ? 'menu' : undefined}
      className={`relative -mb-px whitespace-nowrap border-b-2 border-transparent pb-3 pt-1 text-sm font-medium transition-colors ${
        isActive ? 'text-ink' : 'text-ink/55 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}
