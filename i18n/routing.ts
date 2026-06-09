import { defineRouting } from 'next-intl/routing';

// Configurazione routing i18n condivisa tra middleware e navigazione.
// Le route pubbliche sono prefissate con la locale: /it/... e /en/...
export const routing = defineRouting({
  locales: ['it', 'en'],
  defaultLocale: 'it',
});

export type Locale = (typeof routing.locales)[number];
