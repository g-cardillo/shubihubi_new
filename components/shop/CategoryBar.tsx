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
        <ul className="flex w-max gap-7 px-1">
          <li>
            <TabButton
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
  isActive,
  onClick,
  onPointerDown,
  onFocus,
  ariaExpanded,
  ariaHasPopup,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  onPointerDown?: (pointerType: string) => void;
  onFocus?: () => void;
  ariaExpanded?: boolean;
  ariaHasPopup?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown ? (e) => onPointerDown(e.pointerType) : undefined}
      onFocus={onFocus}
      aria-current={isActive ? 'page' : undefined}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup ? 'menu' : undefined}
      className={`relative -mb-px whitespace-nowrap border-b-2 pb-3 pt-1 text-sm font-medium transition-colors ${
        isActive
          ? 'border-brand-pink text-ink'
          : 'border-transparent text-ink/55 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}
