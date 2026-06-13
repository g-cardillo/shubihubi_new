/**
 * Blur placeholder per le `next/image` con URL esterni (Firebase Storage) o
 * path statici senza import: genera un piccolo SVG monocromo in base64 da
 * passare a `blurDataURL`. Il colore di default è il rosa pelle del brand
 * (`brand.pinkSkin` #F4D8DA), così il placeholder è coerente col design system.
 */

const DEFAULT_COLOR = '#F4D8DA'; // brand.pinkSkin

/** Base64 isomorfo: Buffer lato server, btoa lato client (SVG = solo ASCII). */
function toBase64(value: string): string {
  return typeof window === 'undefined'
    ? Buffer.from(value).toString('base64')
    : window.btoa(value);
}

/** Data URL base64 di un SVG pieno del colore indicato. */
export function blurDataURL(color: string = DEFAULT_COLOR): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="${color}"/></svg>`;
  return `data:image/svg+xml;base64,${toBase64(svg)}`;
}

/** Placeholder brand pre-calcolato (il caso d'uso di gran lunga più comune). */
export const BRAND_BLUR = blurDataURL();
