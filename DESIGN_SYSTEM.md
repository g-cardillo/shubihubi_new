# Design System — Shubihubi

Estratto dal progetto Flutter `../shubihubi` per replicare fedelmente il design
in **Tailwind CSS** (Fase 7). Tema attivo: `AppleHigTheme.lightTheme()`
(`lib/core/theme/apple_hig_theme.dart`), wired in `main.dart` riga 84.
**Solo tema chiaro** — non esiste dark mode (`main.dart` non imposta `darkTheme`
né `themeMode`).

Fonti analizzate:
- `lib/core/theme/app_colors.dart` (palette base)
- `lib/core/theme/apple_hig_theme.dart` (ColorScheme, TextTheme, component themes, spacing)
- `lib/core/theme/text_styles.dart` (font families)
- `pubspec.yaml` (font locale Genty + google_fonts)
- Componenti reali: `ProductGridCard`, `NavigationMenu`, `CartDrawer`,
  `ProductDetailView`, `FilterButton`, `SiteFooterSliver`, `CartIconButton`

> ⚠️ Nota sulla coerenza: il codebase Flutter ha **più "rossi" e "crema"**
> leggermente diversi, definiti sia globalmente sia come costanti locali nei
> widget. Qui sono documentati tutti, segnalando quelli **canonici** (usati nel
> tema + nei componenti principali). In fase di implementazione conviene
> consolidare sulle versioni canoniche.

---

## 1. Colori

### 1.1 Core (ColorScheme del tema — canonici)

| Ruolo | Hex | Note |
|---|---|---|
| **Primary** (brand) | `#EE67AB` | Rosa Shubihubi. `ColorScheme.primary`, `_kPink`, cart `_pink`, pill attivo navbar, bottone Add-to-cart. **Il colore identitario.** |
| Secondary | `#FFD0C9` | Rosa pesca tenue. `ColorScheme.secondary` |
| Surface | `#F5F5F7` | Grigio chiarissimo (card/surface neutre) |
| On-surface (testo) | `#1D1D1F` | Quasi-nero Apple. Colore testo di base |
| Background / Scaffold | `#FFFFFF` | Bianco |
| Input fill (Flutter) | `#F2F2F7` | Riempimento input nel tema Flutter (vedi §4.4) |

### 1.2 Rossi / coralli (accenti)

| Hex | Nome sorgente | Uso |
|---|---|---|
| `#E01919` | `_kRed`, cart `_red` | **Rosso canonico** — prezzi, errori, bordo stato errore |
| `#D20001` | `titleRed`, `_kRedTitle` | Rosso titolo (più scuro/intenso) |
| `#E01111` | footer `textColor` | Testo footer (variante rosso) |
| `#FF5757` | `corallo` (legacy) | Corallo pieno (poco usato) |
| `#E96F63` | `coralloChiaro` | Corallo chiaro |

> Consiglio: usare **`#E01919`** come rosso accento e **`#D20001`** per i titoli.

### 1.3 Rosa (accenti e superfici)

| Hex | Nome sorgente | Uso |
|---|---|---|
| `#F2619C` | `textPink`, `_kPinkHot` | Rosa "hot" per testi accento/secondari |
| `#F4D8DA` | `rosaChiaro`, `_kPinkSkin` | Rosa "skin" tenue (sfondi/bordi non selezionati) |
| `#FFD4D9` | `_kPinkInput`, cart `_pinkLight` | **Bordi/divisori rosa chiaro** (divider cart, bordi input prodotto) |

### 1.4 Gialli / crema (sfondi caldi)

| Hex | Nome sorgente | Uso |
|---|---|---|
| `#F5EBC1` | footer `backgroundColor` | **Sfondo footer** (crema) |
| `#FFF3CC` | `_kCream`, cart `_cream` | Crema chiara (superfici calde) |
| `#FFF4C2` | `_kCream3` | Crema per testo su bottone rosa (Add-to-cart) + chip prezzo |
| `#FFF3BC` | cart `_yellow` | Giallo crema |
| `#FFE78F` | `gialloChiaro` | Giallo chiaro |
| `#F2D672` | `gialloChiaro1` | Giallo medio |
| `#F8F4EC` | `formColor` | Sfondo form/sezioni (crema neutra) |

### 1.5 Neutri / overlay

| Hex / valore | Uso |
|---|---|
| `rgba(0,0,0,0.06)` | Sfondo chip formati, placeholder immagine |
| `rgba(0,0,0,0.08)` | Bordo chip formati |
| `#14000000` (≈ `rgba(0,0,0,0.08)`) | Bordo badge NEW / low-stock |
| `rgba(128,128,128,0.55)` | Overlay "sold out" (grigio) |
| `rgba(0,0,0,0.55)` | Pill "SOLD OUT" su overlay |
| `black` / `white` | Badge SALE (nero su bianco testo), badge NEW (bianco/nero) |

### 1.6 Proposta token Tailwind (`theme.extend.colors`)

```js
colors: {
  brand: {
    pink:      '#EE67AB', // primary
    pinkHot:   '#F2619C',
    pinkSkin:  '#F4D8DA',
    pinkLight: '#FFD4D9', // divider/bordi
    peach:     '#FFD0C9', // secondary
    red:       '#E01919', // accento/prezzo/errore
    redTitle:  '#D20001', // titoli
    cream:     '#FFF3CC',
    cream2:    '#FFF4C2', // testo su bottone rosa
    creamFooter: '#F5EBC1',
    yellow:    '#FFE78F',
    form:      '#F8F4EC',
  },
  surface: '#F5F5F7',
  ink:     '#1D1D1F', // testo base
}
```

---

## 2. Font

### 2.1 Famiglie (4 + fallback)

| Alias Flutter | Famiglia | Provenienza | Uso |
|---|---|---|---|
| `titoloHome` | **Comfortaa** | Google Fonts | Titolo hero della home |
| `titolo` | **Gowun Batang** | Google Fonts | Titoli sezione / heading (display + headline) |
| `corpo` | **Quicksand** | Google Fonts | Body e UI (paragrafi, label, bottoni) |
| `special` | **Genty** | **Locale** (`fonts/Genty-Regular.otf`, peso Regular) | Accento decorativo: titolo cart drawer, hero, label "Aggiungi al carrello" |

**Fallback chain** (da `apple_hig_theme.dart`):
`Poppins, SF Pro Text, SF Pro Display, San Francisco, -apple-system,
BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif`

> Implementazione Next: caricare Comfortaa / Gowun Batang / Quicksand via
> `next/font/google`; **Genty** via `next/font/local` (serve il file
> `Genty-Regular.otf`, da copiare da `../shubihubi/fonts/`). Genty ha **solo il
> peso Regular** — non usare pesi diversi.

### 2.2 Scala tipografica (dal TextTheme)

Tutti i titoli usano **Gowun Batang** (`titolo`), il corpo **Quicksand** (`corpo`).
Le dimensioni assolute ereditano da `Typography.blackCupertino` (base Material);
quel che il tema definisce sono **peso + letter-spacing**:

| Token Material | Font | Weight | Letter-spacing | Uso suggerito |
|---|---|---|---|---|
| displayLarge | Gowun Batang | 700 | -0.9 | Titolone pagina |
| displayMedium | Gowun Batang | 700 | -0.6 | Titolo grande |
| headlineLarge | Gowun Batang | 700 | -0.4 | Heading |
| headlineMedium | Gowun Batang | 600 | -0.2 | Sotto-heading |
| titleLarge | Quicksand | 600 | — | Titolo card/appbar |
| titleMedium | Quicksand | 600 | — | Titolo prodotto (override w700) |
| bodyLarge / bodyMedium | Quicksand | 400 | — | `line-height: 1.35` |
| labelLarge | Quicksand | 600 | 0.1 | Testo bottoni |

**Body size responsiva** (`AppTextStyles.corpoSize`): **15px sotto i 900px**,
**22px da 900px in su**. → Il corpo desktop è volutamente **grande**.

**Dimensioni Genty (`special`) osservate**: 26, 28, 32, 42, 52, 90 px
(decorativo, scala molto su hero e titoli). Esempi: cart drawer title 28,
add-to-cart 22 (16 sotto 380px), hero prodotto 42.

---

## 3. Spaziature & Border Radius

### 3.1 Spacing (8pt grid — `AppSpacing`)

| Token | px | Tailwind |
|---|---|---|
| xxs | 4 | `1` |
| xs | 8 | `2` |
| sm | 12 | `3` |
| md | 16 | `4` |
| lg | 24 | `6` |
| xl | 32 | `8` |
| xxl | 48 | `12` |

Padding ricorrenti reali: contenuti `16` (`md`), sezioni cart `20`, card margin `16`,
input `16×12` (h×v), bottoni tema `24×12`.

### 3.2 Border radius

| Elemento | Radius (px) | Tailwind |
|---|---|---|
| Card (tema) | 16 | `rounded-2xl` (16) |
| Input (tema) | 12 | `rounded-xl` |
| Bottone (tema ElevatedButton) | 12 | `rounded-xl` |
| **Pill / badge / bottoni CTA** | 999 | `rounded-full` |
| Bottone checkout cart | 100 | `rounded-full` |
| Product card (immagine) | 18 | `rounded-[18px]` |
| Product detail — pannelli | 22 / 14 / 10 | `rounded-[22px]` ecc. |
| Cart item thumb | 10 | `rounded-[10px]` |
| Badge "cart sale" (piccolo) | 4 | `rounded` |
| Dropdown menu (navbar) | 8 | `rounded-lg` |

---

## 4. Componenti chiave

### 4.1 Navbar (`NavigationMenu`)
- **Sfondo**: bianco (`#FFFFFF`); `AppBar` con `elevation: 0`,
  `surfaceTint: transparent`, `toolbarHeight: 64`.
- **Logo**: `assets/logo.webp`, altezza **32px**.
- **Link**: Quicksand, `w400` normale / `w600` (o `bold`) selezionato; colore testo `#1D1D1F`.
- **Indicatore attivo / badge carrello**: pill `#EE67AB`, `rounded-full` (999),
  testo bianco `w800`, padding simmetrico.
- **Dropdown** (lingua/shop): `Material elevation 6`, `rounded-lg` (8),
  item padding `20×12`; selettore lingua con emoji bandiera 🇮🇹 / 🇬🇧 (fontSize 22).
- **Nessuna ombra** sotto la navbar (flat).

### 4.2 ProductCard (`ProductGridCard`)
- **Immagine**: `AspectRatio 4/5`, `rounded-[18px]`, `object-cover`.
- **Hover** (solo desktop/web): crossfade alla 2ª immagine —
  opacity 180ms, scale `1.03` (primary) / da `0.98` a `1.0` (hover img) 220ms.
- **Badge SALE** (top-left): sfondo **nero**, testo **bianco**, pill `rounded-full`,
  padding `10×7`, `labelMedium w800 ls 0.2`.
- **Badge NEW** (top-right): sfondo **bianco**, testo **nero**, bordo `rgba(0,0,0,0.08)`.
- **Badge LIMITED**: sfondo **nero**, testo **bianco**.
- **Low-stock** (bottom-left): bianco/92% opacità, testo nero, stesso bordo tenue.
- **Sold-out overlay**: velo grigio `rgba(128,128,128,0.55)` + pill centrale
  `rgba(0,0,0,0.55)` con testo bianco `w800 ls 1.0`.
- **Titolo**: `titleMedium` override **w700**, `line-height 1.2`, max 2 righe, ellipsis.
- **Prezzo**: `titleSmall w600`. In saldo: prezzo originale **barrato** (`w500`,
  opacità 65%) + prezzo scontato **w800**. Sold-out → opacità 55%.
- **Chip formati**: sfondo `rgba(0,0,0,0.06)`, bordo `rgba(0,0,0,0.08)`,
  `rounded-full`, padding `10×6`, `labelMedium w600`; overflow `+N` con tooltip.

### 4.3 Bottone primario — Add-to-cart (`ProductDetailView._AddToCartButton`)
- **Sfondo** `#EE67AB`, **pill** `rounded-full` (999), `min-height 58px`, padding `20×10`.
- **Testo**: font **Genty** (`special`), colore crema `#FFF4C2`, 22px (16 sotto 380px).
- **Chip prezzo** a destra: sfondo crema `#FFF4C2`, testo rosso `#E01919`, pill.
- **Hover** (no sold-out): translateY **-2px** + ombra
  `color #EE67AB/30%, blur 24, offset (0,8)`.
- **Stato errore** (opzioni mancanti): bordo `#E01919` 2px.
- **Transizione**: 180ms.

### 4.4 Bottone tema & Input
- **ElevatedButton (tema)**: `rounded-xl` (12), padding `24×12`, testo `labelLarge`
  (Quicksand w600), colore primario.
- **OutlinedButton** (es. `FilterButton`): default tema + icona `Icons.tune`.
- **Input (tema Flutter)**: `filled`, fill `#F2F2F7`, `rounded-xl` (12), **niente bordo**,
  padding `16×12`.
  > ⚠️ Discrepanza: nelle aree già migrate in Next (cart/checkout/admin) gli input
  > sono **bianchi con focus rosa** (`.admin-input`). Decidere se uniformare al
  > grigio Flutter o tenere il bianco già introdotto.

### 4.5 CartDrawer (`CartDrawer`)
- **Larghezza**: `420px`; **full-width sotto 520px**.
- **Header**: titolo font **Genty** colore `#EE67AB`, 28px; padding `20,16,12,8`.
- **Divider**: `#FFD4D9` (rosa chiaro), height 1.
- **Riga prodotto**: thumb `rounded-[10px]` 80px; titolo 14px w700; badge prezzo/sale
  10–12px w700/w800; badge piccolo `rounded` (4) padding `6×2`.
- **Footer drawer**: bordo-top `#FFD4D9`; subtotale 15px w700 / 20px; nota minimo ordine
  12px (w500 se ok / w400 se sotto soglia).
- **Bottone checkout**: sfondo `#EE67AB`, `rounded-full` (100), testo 18px.
- **Palette interna**: red `#E01919`, pink `#EE67AB`, pinkLight `#FFD4D9`,
  yellow `#FFF3BC`, cream `#FFF3CC`.

### 4.6 Badge (riassunto pattern)
- **Pill grande** (product card): `rounded-full`, padding `10×7`, `labelMedium w800 ls 0.2`.
  Varianti: SALE nero/bianco, NEW bianco/nero+bordo, LIMITED nero/bianco.
- **Badge piccolo** (cart): `rounded` (4), 10px `w700`, padding `6×2`.

### 4.7 Footer (`SiteFooterSliver`)
- **Sfondo**: `#F5EBC1` (crema). **Testo**: `#E01111` (rosso).
- Font size responsivi (nav/body/small) calcolati su larghezza.

---

## 5. Breakpoint responsive

Layout **mobile-first**, basato su `MediaQuery.size.width`. Frequenza dei breakpoint
nel codice (occorrenze):

| Soglia (px) | Occorrenze | Significato |
|---|---|---|
| **900** | 35 | **Principale** mobile↔desktop. Anche switch body 15→22px |
| 1200 | ~17 | **Max-width contenuto** + secondo step layout |
| 980 | 8 | Variante layout |
| 700 | 3 | `FilterButton`: sotto → right-sheet, sopra → dropdown |
| 600 / 640 | vari | Step minori |
| 520 | 1 | CartDrawer diventa full-width |
| 380 | 3 | Telefoni piccoli (riduce font hero/CTA) |

**Regole pratiche**:
- **< 900px = mobile**, **≥ 900px = desktop** (soglia dominante).
- **Contenuto centrato con `max-width: 1200px`**.
- Corpo testo: **15px mobile → 22px desktop** (a 900).
- Cart drawer: pannello 420px, **full-screen sotto 520px**.
- Hero/CTA Genty rimpiccioliscono sotto 380px.

### 5.1 Proposta `theme.extend.screens` (Tailwind)
Tailwind di default: `sm 640, md 768, lg 1024, xl 1280`. Per mappare le soglie del
progetto conviene aggiungere screen custom:

```js
screens: {
  // mantieni i default sm/md/lg/xl, e aggiungi:
  'mobile': '380px',  // telefoni piccoli (max: usare max-mobile)
  'tablet': '700px',  // filtri / layout intermedio
  'desk':   '900px',  // PRINCIPALE mobile↔desktop
  'wide':   '1200px', // max-width contenuto / layout largo
}
```
Container centrale: `max-w-[1200px] mx-auto px-4` (px-6 da `desk`).

---

## 6. Checklist per la Fase 7 (implementazione)

1. **Tailwind config**: aggiungere `colors` (§1.6), `screens` (§5.1),
   `borderRadius` custom (18, 22, 100/999→`full`), `fontFamily`.
2. **Font**: `next/font/google` per Comfortaa / Gowun Batang / Quicksand;
   `next/font/local` per **Genty** (copiare `Genty-Regular.otf`). Impostare
   le CSS variables e la fallback chain (Poppins → system).
3. **Body**: base 15px, `desk:text-[22px]` (o scala equivalente), `leading-[1.35]`.
4. **Consolidare le ridondanze**: scegliere un solo rosso accento (`#E01919`),
   un solo rosso-titolo (`#D20001`), una sola crema bottone (`#FFF4C2`).
5. **Decidere stile input**: grigio fill Flutter (`#F2F2F7`) vs bianco+focus-rosa
   già presente in Next.
6. Applicare componente per componente seguendo §4 (navbar → card → bottoni →
   cart → footer), verificando hover solo desktop.

---

*Documento di sola analisi. Nessun file TSX/CSS è stato modificato — in attesa di
approvazione prima di procedere con la Fase 7.*
