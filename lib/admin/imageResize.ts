'use client';

/**
 * Ridimensiona un'immagine a max `maxSide` px sul lato lungo e la ri-encoda in
 * WebP, lato browser via canvas. Replica `resizeToWebp` di Flutter
 * (`core/utils/image_resize_web.dart`).
 *
 * Perché: le foto sorgente sono spesso enormi (~4000×4000). Caricarle intatte
 * gonfia Storage e la banda; resize + WebP le rende leggere PRIMA dell'upload.
 * Se il browser non sa produrre WebP (raro) o il file non è un'immagine
 * decodificabile, si ripiega sul file originale.
 */
export interface ResizedImage {
  blob: Blob;
  isWebp: boolean;
}

const WEBP_QUALITY = 0.9;

export async function resizeToWebp(
  file: File,
  maxSide = 1600,
): Promise<ResizedImage> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const longest = Math.max(width, height);
    const scale = longest > maxSide ? maxSide / longest : 1;
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return { blob: file, isWebp: false };
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY),
    );

    if (blob && blob.type === 'image/webp') {
      return { blob, isWebp: true };
    }
    // Browser senza encoder WebP → usa l'originale.
    return { blob: file, isWebp: false };
  } catch {
    // File non decodificabile come immagine: carica l'originale così com'è.
    return { blob: file, isWebp: false };
  }
}

/** Content-type da estensione (fallback per immagini non riconvertite). */
export function contentTypeFromName(name: string): string {
  switch (name.split('.').pop()?.toLowerCase()) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}
