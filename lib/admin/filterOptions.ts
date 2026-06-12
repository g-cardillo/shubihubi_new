'use client';

/**
 * Valori aggiunti a runtime dai menù del pannello admin ("+ Aggiungi nuovo"):
 * sottocategorie, filtri utente e filtri ricerca extra rispetto ai seed di
 * `taxonomy.ts`. Persistiti nella collezione Firestore `filter_options`
 * (lettura pubblica, scrittura solo admin — vedi security rules) così da
 * apparire come opzioni standard da quel momento in poi.
 */
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export type FilterOptionType =
  | 'macroId'
  | 'subcategory'
  | 'userFilter'
  | 'searchFilter';

export interface FilterOption {
  id: string;
  type: FilterOptionType;
  /** Solo per le sottocategorie: la categoria di appartenenza. */
  macroId?: string;
  /** Solo per i filtri: il gruppo di appartenenza (es. "Occasione"). */
  group?: string;
  value: string;
  /** Solo per le categorie (type 'macroId'): descrizioni bilingui. */
  description_it?: string;
  description_eng?: string;
}

const COL = 'filter_options';

/** Stream realtime di tutte le opzioni extra. Ritorna l'unsubscribe. */
export function streamFilterOptions(
  cb: (options: FilterOption[]) => void,
  onError?: (e: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, COL),
    (snap) => {
      cb(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            type: data.type as FilterOptionType,
            macroId: (data.macroId as string) || undefined,
            group: (data.group as string) || undefined,
            value: (data.value as string) ?? '',
            description_it: (data.description_it as string) || undefined,
            description_eng: (data.description_eng as string) || undefined,
          };
        }),
      );
    },
    (e) => onError?.(e),
  );
}

/** Aggiunge un nuovo valore; lo snapshot realtime aggiorna subito i menù. */
export async function addFilterOption(option: {
  type: FilterOptionType;
  macroId?: string;
  group?: string;
  value: string;
  description_it?: string;
  description_eng?: string;
}): Promise<void> {
  const value = option.value.trim();
  if (!value) return;
  await addDoc(collection(db, COL), {
    type: option.type,
    ...(option.macroId ? { macroId: option.macroId } : {}),
    ...(option.group ? { group: option.group } : {}),
    value,
    ...(option.description_it ? { description_it: option.description_it.trim() } : {}),
    ...(option.description_eng ? { description_eng: option.description_eng.trim() } : {}),
    createdAt: serverTimestamp(),
  });
}
