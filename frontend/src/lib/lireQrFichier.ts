import jsQR from 'jsqr';

const decoder = (img: ImageData) => jsQR(img.data, img.width, img.height)?.data ?? null;

async function depuisImage(blob: Blob): Promise<string | null> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Image illisible'));
      i.src = url;
    });
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return decoder(ctx.getImageData(0, 0, c.width, c.height));
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Rend les premières pages du PDF en images puis cherche un QR code (pdf.js chargé à la demande). */
async function depuisPdf(blob: Blob): Promise<string | null> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
  try {
    for (let n = 1; n <= Math.min(doc.numPages, 3); n += 1) {
      const page = await doc.getPage(n);
      for (const echelle of [2.5, 4]) {
        const viewport = page.getViewport({ scale: echelle });
        const c = document.createElement('canvas');
        c.width = Math.floor(viewport.width);
        c.height = Math.floor(viewport.height);
        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (!ctx) continue;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        const texte = decoder(ctx.getImageData(0, 0, c.width, c.height));
        if (texte) return texte;
      }
    }
    return null;
  } finally {
    void doc.destroy();
  }
}

/** Lit le QR code d'un fichier : image (capture d'écran, photo) ou PDF (justificatif téléchargé). */
export async function lireQrDepuisFichier(fichier: Blob, nom = ''): Promise<string | null> {
  const estPdf = fichier.type === 'application/pdf' || /\.pdf$/i.test(nom);
  return estPdf ? depuisPdf(fichier) : depuisImage(fichier);
}
