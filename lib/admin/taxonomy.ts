/**
 * Tassonomia prodotti — categorie (macroId), sottocategorie e gruppi di filtri.
 *
 * Questi sono i valori di partenza forniti dal cliente; sottocategorie e
 * filtri sono ESTENSIBILI a runtime dal pannello admin ("+ Aggiungi nuovo"),
 * con i valori extra persistiti nella collezione Firestore `filter_options`
 * (vedi `lib/admin/filterOptions.ts`).
 *
 * Il valore salvato su Firestore è sempre quello italiano (`id` / `it`);
 * le etichette inglesi restano qui per il futuro uso lato shop.
 */

export interface MacroCategory {
  /** Valore salvato in `macroId` (italiano, canonico). */
  id: string;
  labelEng: string;
  description_it: string;
  description_eng: string;
  /** Sottocategorie predefinite (IT canonico + etichetta EN). */
  subcategories: Array<{ it: string; eng: string }>;
}

export const MACRO_CATEGORIES: MacroCategory[] = [
  {
    id: 'Cartoleria',
    labelEng: 'Paper goods',
    description_it:
      "Biglietti d'auguri per ogni occasione e articoli di cancelleria illustrati, come segnalibri, libretti e altro.",
    description_eng:
      'Greeting cards for every occasion and illustrated paper goods, including bookmarks, notebooks and more.',
    subcategories: [
      { it: 'Tutta la cartoleria', eng: 'All paper goods' },
      { it: 'Biglietti stampati', eng: 'Printed cards' },
      { it: 'Segnalibri stampati', eng: 'Printed bookmarks' },
      { it: 'Libretti stampati', eng: 'Printed notebooks' },
    ],
  },
  {
    id: 'Acquerelli formato cartolina',
    labelEng: 'Watercolour postcards',
    description_it:
      'Acquerelli realizzati a mano e personalizzabili in formato cartolina, disponibili in più pezzi — ideali come regalo, bomboniera o ricordo di un evento.',
    description_eng:
      'Hand-painted watercolours in postcard format, customisable and available in multiple copies — ideal as a gift, wedding favour or event keepsake.',
    subcategories: [
      { it: 'Tutti gli acquerelli formato cartolina', eng: 'All watercolour postcards' },
      { it: 'Collezione Baby', eng: 'Baby Collection' },
      { it: 'Collezione Marina', eng: 'Marina Collection' },
      { it: 'Collezione Botanica', eng: 'Botanica Collection' },
      { it: 'Collezione It', eng: 'It Collection' },
      { it: 'Collezione Fiocchi', eng: 'Bows Collection' },
      { it: 'Collezione Monogrammi', eng: 'Monograms Collection' },
      { it: 'Collezione Market', eng: 'Market Collection' },
      { it: 'Collezione Extra', eng: 'Extra Collection' },
      { it: 'Collezione Urban Sketch', eng: 'Urban Sketch Collection' },
      {
        it: 'Collezione Radisson Collection Hotel Roma Antica',
        eng: 'Radisson Collection Hotel Roma Antica',
      },
    ],
  },
  {
    id: 'Stampe',
    labelEng: 'Prints',
    description_it:
      'Riproduzioni di alta qualità delle illustrazioni di Shubi Hubi Studio, tra cui alcune tirature numerate e in edizione limitata.',
    description_eng:
      'High-quality reproductions of Shubi Hubi Studio illustrations, including some numbered and limited edition prints.',
    subcategories: [
      { it: 'Tutte le stampe', eng: 'All prints' },
      { it: 'Formato A4', eng: 'A4' },
      { it: 'Formato A3', eng: 'A3' },
      { it: 'Edizioni limitate', eng: 'Limited editions' },
    ],
  },
  {
    id: 'Mail Club',
    labelEng: 'Mail club',
    description_it:
      "Un abbonamento che ti permetterà di ricevere ogni mese una cartolina con francobollo, contenente una lettera personale, consigli, esercizi d'arte e piccoli gadget.",
    description_eng:
      'A subscription that brings you a stamped postcard every month, containing a personal letter, tips, art exercises and small surprises.',
    subcategories: [],
  },
  {
    id: 'Opere uniche - Acquerello',
    labelEng: 'One of a kind - Watercolour',
    description_it:
      "Acquerelli originali e irripetibili, ogni opera esiste in un solo esemplare e non potrà essere riprodotta. Scopri la visione dell'autrice attraverso i suoi lavori unici.",
    description_eng:
      "Original and unrepeatable watercolours, each work exists as a single piece and will never be reproduced — discover the artist's vision through her unique works.",
    subcategories: [{ it: 'Tutte le opere ad acquerello', eng: 'All watercolour works' }],
  },
];

export function macroById(id: string): MacroCategory | undefined {
  return MACRO_CATEGORIES.find((m) => m.id === id);
}

/** Filtri selezionabili dall'utente finale, raggruppati. */
export const USER_FILTER_GROUPS: Record<string, string[]> = {
  Occasione: ['Nascita', 'Compleanno', 'Evento', 'Regalo', 'Bomboniera'],
  Prodotto: ['In saldo', 'Nuovo'],
  'Fascia di prezzo': [
    'Bassa - meno di 50€',
    'Media - da 50€ a 100€',
    'Alta - più di 100€',
  ],
  Personalizzabile: ['Sì', 'No'],
};

/** Filtri interni per aiutare la ricerca, raggruppati. */
export const SEARCH_FILTER_GROUPS: Record<string, string[]> = {
  Occasione: ['Nascita', 'Compleanno', 'Evento', 'Regalo', 'Bomboniera'],
  Tema: [
    'Botanico',
    'Marino',
    'Baby',
    'Persone',
    'Fiocchi',
    'Trend',
    'Monogrammi',
    'Market',
    'Urban Sketch',
    'Regalo',
  ],
};
