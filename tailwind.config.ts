import type { Config } from "tailwindcss";

/**
 * Design system Shubihubi — vedi DESIGN_SYSTEM.md.
 * Tema light only, estratto dal Flutter (`AppleHigTheme.lightTheme()`).
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // ── Palette brand (DESIGN_SYSTEM §1) ───────────────────────────────
        brand: {
          pink: "#EE67AB", // primary
          pinkHot: "#F2619C", // accento testo
          pinkSkin: "#F4D8DA", // rosa tenue (sfondi/bordi)
          pinkLight: "#FFD4D9", // divisori/bordi input
          peach: "#FFD0C9", // secondary
          red: "#E01919", // accento/prezzo/errore
          redTitle: "#D20001", // titoli
          cream: "#FFF3CC", // superfici calde
          cream2: "#FFF4C2", // testo su bottone rosa
          creamFooter: "#F5EBC1", // sfondo footer
          yellow: "#FFE78F",
          form: "#F8F4EC", // sfondo form/sezioni
        },
        surface: "#F5F5F7",
        ink: "#1D1D1F", // testo base
        inputfill: "#F2F2F7", // riempimento input (grigio Flutter)
      },
      fontFamily: {
        // Le CSS variables sono impostate da next/font nel layout.
        home: ["var(--font-comfortaa)", "var(--font-fallback)"],
        title: ["var(--font-gowun)", "var(--font-fallback)"],
        body: ["var(--font-quicksand)", "var(--font-fallback)"],
        special: ["var(--font-genty)", "var(--font-fallback)"],
      },
      screens: {
        // Default sm/md/lg/xl mantenuti; soglie del progetto in aggiunta.
        mobile: "380px", // telefoni piccoli
        tablet: "700px", // filtri / layout intermedio
        desk: "900px", // PRINCIPALE mobile↔desktop
        wide: "1200px", // max-width contenuto / layout largo
      },
      borderRadius: {
        card: "16px",
        prod: "18px", // immagine product card
        panel: "22px", // pannelli product detail
      },
      maxWidth: {
        content: "1200px",
      },
      boxShadow: {
        "pink-cta": "0 8px 24px 0 rgba(238,103,171,0.30)",
      },
    },
  },
  plugins: [],
};
export default config;
