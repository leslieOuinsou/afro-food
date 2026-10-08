/** Contenu du QR code imprimé sur le justificatif : AFRO-FOOD|numéro|montant|code */
export type QrJustificatif = { numero: string; total: number; code: string };

export function lireQrJustificatif(texte: string): QrJustificatif | null {
  const [marque, numero, total, code] = texte.trim().split('|');
  const montant = Number(total);
  if (marque !== 'AFRO-FOOD' || !numero || !Number.isFinite(montant) || !code) return null;
  return { numero, total: montant, code };
}
