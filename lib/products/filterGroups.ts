/**
 * Gruppi di filtri utente per la pagina shop — SOLO server (Admin SDK).
 *
 * I gruppi partono dal seed `USER_FILTER_GROUPS` della tassonomia admin e
 * vengono estesi con i valori aggiunti a runtime dal pannello admin nella
 * collezione `filter_options` (type `userFilter`), così lo shop raggruppa
 * correttamente anche i filtri nuovi. Stessa strategia di cache del
 * repository prodotti (in dev niente cache, in prod ISR + tag `products`).
 */
import 'server-only';
import { unstable_cache } from 'next/cache';
import { adminDb } from '@/lib/firebase/admin';
import { USER_FILTER_GROUPS } from '@/lib/admin/taxonomy';
import { PRODUCTS_REVALIDATE } from './repository';

export interface UserFilterGroup {
  /** Nome del gruppo (es. "Occasione"), canonico italiano. */
  group: string;
  /** Valori del gruppo nell'ordine seed + extra runtime. */
  values: string[];
}

const IS_DEV = process.env.NODE_ENV === 'development';

async function loadUserFilterGroups(): Promise<UserFilterGroup[]> {
  const groups = new Map<string, string[]>(
    Object.entries(USER_FILTER_GROUPS).map(([g, vals]) => [g, [...vals]]),
  );
  try {
    const snap = await adminDb
      .collection('filter_options')
      .where('type', '==', 'userFilter')
      .get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const group = typeof data.group === 'string' ? data.group.trim() : '';
      const value = typeof data.value === 'string' ? data.value.trim() : '';
      if (!group || !value) continue;
      const list = groups.get(group) ?? [];
      if (!list.includes(value)) list.push(value);
      groups.set(group, list);
    }
  } catch {
    // Senza gli extra runtime lo shop usa comunque i gruppi seed.
  }
  return Array.from(groups, ([group, values]) => ({ group, values }));
}

export const getUserFilterGroups = IS_DEV
  ? loadUserFilterGroups
  : unstable_cache(loadUserFilterGroups, ['user-filter-groups'], {
      revalidate: PRODUCTS_REVALIDATE,
      tags: ['products'],
    });
