# MIGRATION_PLAN.md — Shubihubi: Flutter Web → Next.js 14 (App Router)

> Documento di pianificazione. **Nessun codice Next.js viene scritto in questa fase.**
> Obiettivo: migrare il frontend Flutter Web a **Next.js 14 (App Router) + TypeScript + Tailwind CSS**, mantenendo **invariato** tutto il backend Firebase (Firestore, Auth, Storage, Cloud Functions, PayPal/Stripe Live).

---

## 0. Perché migrare (motivazione e principio guida)

Il frontend attuale è una **SPA Flutter Web** renderizzata con CanvasKit/WASM. Implicazioni:

- **SEO praticamente assente**: i contenuti (titoli, descrizioni prodotti) sono dipinti su canvas, non sono DOM crawlabile. C'è un workaround fragile via JS interop (`lib/core/seo/seo_service.dart` → `updateSeoMeta`) che aggiorna solo `<title>`/meta dopo il render client.
- **Memoria/performance**: presenti crash documentati legati alla heap WASM di CanvasKit che non rilascia memoria immagini (vedi commit recenti `fix performance crash`, `memory usage optimization`).
- **Time-to-first-content** alto (download runtime WASM + framework).

**Principio guida della migrazione**: le pagine **prodotto** e **shop** devono diventare **Server Components con dati pre-renderizzati lato server** (SSR/SSG + ISR) per SEO e performance. Le aree interattive/private (carrello, checkout, profilo, admin) restano Client Components.

---

## 1. Stack attuale (fotografia)

| Aspetto | Flutter | Note migrazione |
|---|---|---|
| Architettura | Clean Architecture in `lib/features/<feature>/{data,domain,presentation}` | Mappabile 1:1 su Next: `domain` → tipi+repository TS, `data` → Firebase client, `presentation` → componenti React |
| State management | **GetX** (`Get.find`, controllers, bindings) | Sostituito da: React Server Components + Zustand/Context per stato client (carrello, lingua) |
| Routing | **Navigator 2.0 custom** (`lib/core/routing/app_router.dart`): una "shell" persistente + pagine "above-shell" | Sostituito da App Router file-based |
| Backend | Firebase Firestore / Auth / Storage / Cloud Functions | **INVARIATO** |
| Pagamenti | Stripe + PayPal via Cloud Functions onCall + webhook onRequest | **INVARIATO** (solo i call-site cambiano) |
| Localizzazione | IT/EN — campi `_it`/`_eng` su Firestore + `lib/l10n/app_translations.dart` | `next-intl` o `next-i18next`, routing `/it` `/en` |
| Immagini | `cached_network_image`, convenzione cache-key 600/1000/240, webp resize | `next/image` con loader Firebase Storage |
| Storage guest cart | `GetStorage` (localStorage) | `localStorage` / Zustand persist |

---

## 2. Mappa Route Flutter → Next.js App Router

Route attuali definite in `lib/main.dart` (classe `Routes`). La lingua diventa segmento prefisso (`/[locale]`).

| Flutter route | Pagina Flutter | Next.js route (App Router) | Render | SEO | Complessità |
|---|---|---|---|---|---|
| `/home` | `home.dart` | `app/[locale]/page.tsx` | SSG/ISR | Alta | Media |
| `/shop` | `ShopView.dart` | `app/[locale]/shop/page.tsx` | **SSR/ISR** | **Critica** | **Alta** |
| `/shop/productDetail` *(arg: ProductUI)* | `ProductDetailView.dart` | `app/[locale]/shop/[slug]/page.tsx` | **SSG + ISR** | **Critica** | **Alta** |
| `/gallery` | `GalleryView.dart` | `app/[locale]/gallery/page.tsx` | SSG | Media | Bassa |
| `/about` | `AboutView.dart` | `app/[locale]/about/page.tsx` | SSG | Media | Bassa |
| `/contacts` | `ContactsView.dart` | `app/[locale]/contacts/page.tsx` | SSR (form) | Media | Bassa |
| `/home/live-painting` | `LivePaintingView.dart` | `app/[locale]/live-painting/page.tsx` | SSG | Media | Bassa |
| `/home/stationery` | `Coordinati.dart` | `app/[locale]/stationery/page.tsx` | SSG | Media | Bassa |
| `/home/events` | `Events.dart` | `app/[locale]/events/page.tsx` | SSG | Media | Bassa |
| `/checkout` | `CheckoutPage.dart` | `app/[locale]/checkout/page.tsx` | Client | No (noindex) | **Alta** |
| `/checkout/success` | `CheckoutSuccessPAge.dart` | `app/[locale]/checkout/success/page.tsx` | Client | No | Bassa |
| `/checkout/cancel` | `CheckoutCancelPage.dart` | `app/[locale]/checkout/cancel/page.tsx` | Client | No | Bassa |
| `/checkout/paypal/return` | `PaypalReturnPage.dart` | `app/[locale]/checkout/paypal/return/page.tsx` | Client | No | Media |
| `/profile` | `auth_gate.dart` / `profile_page.dart` | `app/[locale]/profile/page.tsx` | Client (auth) | No | Media |
| `/profile/wishlist` | `WishlistPage.dart` | `app/[locale]/profile/wishlist/page.tsx` | Client (auth) | No | Media |
| `/profile/ordersPage` | `OrdersPage.dart` | `app/[locale]/profile/orders/page.tsx` | Client (auth) | No | Media |
| `/profile/ordersPage/orderDetails` | `OrderDetailsPage.dart` | `app/[locale]/profile/orders/[id]/page.tsx` | Client (auth) | No | Media |
| `/profile/addresses` | `AddressesPage.dart` | `app/[locale]/profile/addresses/page.tsx` | Client (auth) | No | Bassa |
| `/admin` | `AdminPage.dart` | `app/[locale]/admin/page.tsx` | Client (auth+role) | No | **Alta** |
| `/support` | `SupportView.dart` | `app/[locale]/support/page.tsx` | SSR (form) | Bassa | Bassa |
| `/cookie-policy` | `CookiePolicyPage.dart` | `app/[locale]/cookie-policy/page.tsx` | SSG | Bassa | Bassa |
| `/shipping-policy` | `ShippingPolicyPage.dart` | `app/[locale]/shipping-policy/page.tsx` | SSG | Bassa | Bassa |
| `/terms-of-service` | `TermsPage.dart` | `app/[locale]/terms-of-service/page.tsx` | SSG | Bassa | Bassa |
| Cart (drawer) | `CartDrawer.dart` | Componente client globale (no route) | Client | No | Media |

### Note sul routing
- **Slug prodotto**: oggi il product detail riceve un oggetto `ProductUI` come argomento di navigazione (non un ID nell'URL). Per SEO si usa uno slug leggibile nell'URL (`/shop/[slug]`). ✅ **FATTO** — campo `slug` aggiunto a tutti i 24 documenti `products` su Firestore tramite lo script `functions/add-slugs.js` (slug derivato da `title_it`, minuscolo, accenti rimossi, unico). Lo script è idempotente (rilanciabile, non sovrascrive).
  - ⚠️ **Da completare**: la Cloud Function `adminAddProduct` (`buildProductDoc`) **NON** genera ancora lo slug per i nuovi prodotti → va aggiunta la generazione lato Function (vedi sezione 8.1).
- La "shell persistente" di Flutter (Navbar + tab `IndexedStack`) diventa un **`layout.tsx`** condiviso. Il comportamento "no rebuild" che in Flutter era ottimizzazione manuale è gratis in Next (i layout non si rimontano tra route figlie).
- I redirect senza locale (`/shop` → `/it/shop`) si gestiscono con `middleware.ts`.

---

## 3. Servizi Firebase da adattare

Backend **invariato**; cambia solo il client. Riepilogo di ciò che il frontend usa.

### 3.1 Firestore — collezioni utilizzate
| Collezione | Uso attuale | Adattamento Next |
|---|---|---|
| `products` | Catalogo. Query: `where('categories', arrayContains: macro)` + `orderBy('title')`, paginazione cursore `startAfter`, `getById`, `getLatest` (`orderBy data_aggiunta`), `getManyByIds` (chunk whereIn 10) | **Admin SDK lato server** per shop/detail (SSR/SSG/ISR). Client SDK solo dove serve realtime |
| `users` | Documento utente | Client SDK (auth) |
| `users/{uid}/cart` | Carrello utente loggato | Client SDK realtime |
| `users/{uid}/wishlist` | Wishlist | Client SDK realtime |
| `orders` | Ordini (privati) | Client SDK (auth) / letti via Function |
| `order_public` | Vista pubblica ordine (es. conferma) | Client/Server |
| `discount_codes` | Codici sconto | Lato server (Function già esistente) |
| `gift_cards` | Buoni regalo | Lato server (Function già esistente) |

> ⚠️ **Decisione chiave**: per le pagine SEO (shop/detail) usare **Firebase Admin SDK** nei Server Components / Route Handlers (bypassa le security rules, dati pubblici, niente bundle client Firestore). Mantenere il **Client SDK** solo per aree autenticate/realtime (cart, wishlist, profilo, admin).

### 3.2 Auth
- Metodi attuali (`auth_repository_impl.dart`): **Email/Password** (con verifica email obbligatoria), **Google Sign-In**, signOut, resend verification.
- Next: `firebase/auth` client. Per proteggere route private + SSR auth: **session cookie** via Admin SDK (`createSessionCookie`) verificato in `middleware.ts`/Route Handler. Google Sign-In con popup web standard (non `google_sign_in` plugin).
- Verifica email: flusso invariato (Firebase invia l'email).

### 3.3 Storage
- Immagini prodotto su Firebase Storage (webp, resize 1600px+ lato upload — cfr. memoria progetto su CanvasKit).
- Next: `next/image` con **custom loader** che punta agli URL Storage. Mantiene la convenzione resize. Vantaggio: Next ottimizza/serve AVIF/WebP responsive automaticamente → risolve il problema memoria immagini all'origine.

### 3.4 Cloud Functions (call-site da riscrivere, logica invariata)
Functions esistenti (da `functions/index.js`):

**Callable (`onCall`)** — invocate dal frontend:
| Function | Chiamata da (Flutter) | Adattamento Next |
|---|---|---|
| `createDraftOrder` | `payment_repository_impl.dart` | `httpsCallable` client o Route Handler |
| `stripeCreateCheckoutSession` | `payment_repository_impl.dart`, `pay_with_stripe.dart` | idem |
| `paypalCreateOrder` | `payment_repository_impl.dart`, `PayPaypl.dart` | idem |
| `paypalCaptureOrder` | flusso ritorno PayPal | idem |
| `adminAddProduct` / `adminUpdateProduct` / `adminDeleteProduct` | `AdminController`, `AdminProductFormController` | Route Handler protetto |
| `adminCreateDiscountCode` / `adminCreateGiftCard` | `DiscountCodesTab`, `GiftCardsTab` | idem |
| `addEmailToMailingList` | `mailing_list_service.dart` | client/Route Handler |

**HTTP (`onRequest`)** — webhook/form, **nessun cambio frontend**:
- `stripeWebhook`, `paypalWebhook` (chiamate da Stripe/PayPal — invariate)
- `contactForm`, `supportForm` (oggi POST HTTP dai form Flutter → restano POST dai form React)

> Le Functions `onCall` si invocano da Next con `firebase/functions` `httpsCallable`. In alternativa, per quelle admin, proxy via Route Handler server-side (più sicuro, nasconde la logica).

### 3.5 Pagamenti — flussi da ricreare
- **Stripe**: `createDraftOrder` → `stripeCreateCheckoutSession` → redirect a `url` Stripe Checkout → webhook conferma → success page.
- **PayPal**: `createDraftOrder` → `paypalCreateOrder` (ritorna `approvalUrl`) → redirect → ritorno su `/checkout/paypal/return?token=...` → `paypalCaptureOrder` → success.
- Entrambi i flussi sono **redirect-based**, quindi mappano in modo naturale su pagine Next + Route Handlers. Complessità: **Alta** (soldi reali, Live).

---

## 4. Componenti da creare (presentation layer)

### 4.1 Layout & navigazione (shell)
- `RootLayout` / `LocaleLayout` (`app/[locale]/layout.tsx`) — html, provider, font (Google Fonts via `next/font`)
- `Navbar` (da `NavigationMenu.dart`) — con language switcher
- `Footer`
- `CartDrawer` (client, globale) — da `CartDrawer.dart`
- `CookieConsentBanner` (da `CookieConsentService`)

### 4.2 Shop & prodotto (priorità SEO)
- `ShopPage` (server) + `CategoryBar` (da `ShopCategoryBarView.dart`)
- `ProductGrid` + `ProductGridCard` (da `ProductGridCard.dart`) — staggered grid → CSS columns/masonry
- `ProductDetail` (da `ProductDetailView.dart`): gallery immagini, selettore colore/cornice/formato, prezzo (sale/original), badge (new/limited/soldout), recommendations
- `ProductGallery` (zoom/thumbnail) — sostituisce `PhotoViewerPage`
- Paginazione "load more" / infinite scroll (replica cursore Firestore)

### 4.3 Carrello & checkout
- `CartProvider` (Zustand, persist guest in localStorage, merge su login — replica `mergeGuestIntoUser`)
- `CheckoutForm` (indirizzo, validazione — da `checkout/.../utils` e `validation_result.dart`)
- `PaymentButtons` (Stripe / PayPal — da `PayStrype.dart`, `PayPaypl.dart`)
- Pagine `success` / `cancel` / `paypal/return`
- `DiscountCodeInput`, `GiftCardInput`

### 4.4 Auth & profilo
- `SignInForm` / `SignUpForm` / `VerifyEmail` / `CheckEmail` (da `auth/presentation/pages`)
- `GoogleSignInButton`
- `AuthGate` → middleware + client guard
- `ProfilePage`, `AddressesPage`, `WishlistPage`, `OrdersPage`, `OrderDetailsPage`

### 4.5 Admin (basso priorità SEO, alta complessità)
- `AdminDashboard`, `ProductForm` (con image upload Storage), `DiscountCodesTab`, `GiftCardsTab`
- Protetto da ruolo (custom claim / check Firestore)

### 4.6 Pagine statiche/contenuto
- `Home`, `Gallery`, `About`, `LivePainting`, `Stationery`, `Events`, `Contacts`, `Support`
- Legal: `CookiePolicy`, `ShippingPolicy`, `Terms`

### 4.7 Infrastruttura condivisa
- `lib/firebase` client config + `lib/firebase-admin` (server)
- Tipi TS da entità domain: `Product`, `CartItem`, `ShopCategory`, `ShopFilters`, `UserAddress`, `AppUser`, `PayMethod`, `Order`
- Mapper `ProductDto` (da `product_dto.dart`) — campi Firestore `title_it/_eng`, `price`, `salePrice`, `imageUrls`, `categories`, `macroId`, `data_aggiunta`, ecc.
- i18n: `messages/it.json`, `messages/en.json` (da `app_translations.dart`)
- `SEO/metadata` — sostituisce `seo_service.dart` con `generateMetadata()` nativo

---

## 5. Localizzazione

- Due strati:
  1. **UI statica** → `app_translations.dart` (≈1500 righe IT+EN) → JSON per `next-intl`.
  2. **Contenuto dinamico** → campi Firestore `*_it` / `*_eng` sui prodotti (logica `localizedX(lang)` nell'entità `Product`). In Next: helper `localized(field, locale)` lato server.
- Routing: `/it/...` e `/en/...` con `middleware` per default + `hreflang` tags per SEO.

---

## 6. Ordine di migrazione consigliato

Logica: **prima ciò che ha valore SEO/traffico, in modo incrementale e verificabile**. Strategia di rollout: si può tenere Flutter Web live e migrare per sezioni dietro path, oppure big-bang dopo che shop+prodotto sono pronti.

### Fase 0 — Fondamenta (1)
Setup Next 14 + TS + Tailwind, config Firebase client+admin, i18n (`next-intl`), `next/image` loader Storage, tipi domain, layout/shell base (Navbar+Footer). Script migrazione **slug** prodotti su Firestore.

### Fase 1 — SEO core (2) ⭐ priorità massima
- **Pagina prodotto** `/[locale]/shop/[slug]` — SSG + ISR, `generateMetadata`, JSON-LD `Product`, sitemap.
- **Pagina shop** `/[locale]/shop` — SSR/ISR, categorie, paginazione, filtri.
- Componenti `ProductGridCard`, `ProductGrid`, `ProductDetail`, `ProductGallery`.

### Fase 2 — Pagine contenuto statiche (3)
Home, Gallery, About, LivePainting, Stationery, Events, Contacts, Support, Legal. Tutte SSG, alto valore SEO secondario, bassa complessità.

### Fase 3 — Carrello (4)
`CartProvider`, `CartDrawer`, guest cart (localStorage) + sync Firestore + merge su login.

### Fase 4 — Auth & profilo (5)
Sign in/up (email+Google), verifica email, session cookie, route protette, profilo, wishlist, ordini, indirizzi.

### Fase 5 — Checkout & pagamenti (6) ⚠️ massima attenzione (Live)
`createDraftOrder` → Stripe / PayPal, pagine return/success/cancel, discount/gift card. Test approfonditi in sandbox prima del Live.

### Fase 6 — Admin (7)
Dashboard, form prodotto + upload immagini, codici sconto, gift card. Protezione ruolo.

### Fase 7 — Cutover & cleanup (8)
Redirect 301 dai vecchi URL (`/shop/productDetail` arg → `/shop/[slug]`), `sitemap.xml`, `robots.txt`, hreflang, rimozione hosting Flutter, monitoraggio Search Console.

---

## 7. Stima complessità per sezione

| Sezione | Complessità | Driver |
|---|---|---|
| Setup/fondamenta | Media | Admin SDK + i18n + image loader |
| Shop + Prodotto (SEO) | **Alta** | Paginazione cursore, slug, SSG/ISR, gallery, varianti |
| Pagine statiche | Bassa | Contenuto + i18n |
| Carrello | Media | Guest↔user merge, stato persistente |
| Auth/profilo | Media | Session cookie SSR, Google, verifica email |
| Checkout/pagamenti | **Alta** | Stripe+PayPal Live, redirect, webhook, sconti/buoni |
| Admin | **Alta** | Form complessi, upload Storage, ruoli |
| Localizzazione | Media | Trasversale (UI + contenuto Firestore) |
| SEO/metadata/sitemap | Media | Sostituisce hack JS interop |

---

## 8. Rischi e decisioni aperte (da confermare prima di scrivere codice)

1. ✅ **Slug prodotti**: RISOLTO — campo `slug` popolato su tutti i prodotti esistenti (`functions/add-slugs.js`). **Resta da fare**: aggiungere la generazione dello slug nella Cloud Function `adminAddProduct` (`buildProductDoc` in `functions/index.js`) così i nuovi prodotti nascono già con lo slug — oggi non avviene. Va gestita anche l'unicità lato server (query `where('slug','==',...)` o transazione).
2. **Admin SDK vs Client SDK** per le query pubbliche: confermo uso Admin SDK server-side per shop/detail.
3. **State management client**: Zustand (raccomandato) vs Context+Reducer.
4. **i18n lib**: `next-intl` (raccomandato per App Router) vs `next-i18next`.
5. **Strategia rollout**: big-bang dopo Fase 1-2, o convivenza Flutter+Next per sezioni?
6. **Realtime carrello/wishlist**: mantenere `onSnapshot` realtime o fetch on-demand?
7. **Hosting**: Firebase Hosting + Cloud Run / Vercel? (App Router SSR richiede runtime Node — Vercel più semplice, Firebase Hosting necessita frameworks/Functions).

---

> **Prossimo passo**: revisione e approvazione di questo piano + risposte ai punti della sezione 8. Solo dopo si procede con la Fase 0.
