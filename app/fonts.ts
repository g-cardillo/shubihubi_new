/**
 * Font del design system (DESIGN_SYSTEM §2).
 *  - Comfortaa   → titolo hero home        (--font-comfortaa)
 *  - Gowun Batang→ titoli sezione/heading  (--font-gowun)
 *  - Quicksand   → corpo / UI              (--font-quicksand)
 *  - Genty       → accento decorativo (locale, solo Regular)  (--font-genty)
 *
 * Le famiglie sono esposte come CSS variables e referenziate da
 * tailwind.config (fontFamily.home/title/body/special).
 */
import { Comfortaa, Gowun_Batang, Quicksand } from 'next/font/google';
import localFont from 'next/font/local';

export const comfortaa = Comfortaa({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-comfortaa',
  display: 'swap',
});

export const gowunBatang = Gowun_Batang({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-gowun',
  display: 'swap',
});

export const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-quicksand',
  display: 'swap',
});

// Genty: font locale, unico peso Regular (vedi DESIGN_SYSTEM §2.1).
export const genty = localFont({
  src: './fonts/Genty-Regular.otf',
  weight: '400',
  variable: '--font-genty',
  display: 'swap',
});

/** Classe combinata da applicare a <html> per esporre tutte le variabili. */
export const fontVariables = `${comfortaa.variable} ${gowunBatang.variable} ${quicksand.variable} ${genty.variable}`;
