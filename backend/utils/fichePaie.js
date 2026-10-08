import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const LOGO_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets/logo-email.jpg');
const C = { bois: '#2C1A0E', ocre: '#C2610F', safran: '#E9B26B', ivoire: '#FFFDF8', sable: '#F4EBDD', trait: '#E8DCC4', texte: '#4A3426', gris: '#8A7664', vert: '#1A7F37', encre: '#1B2A5C' };

const eur = (n) => `${Number(n || 0).toFixed(2).replace('.', ',')} €`;
const duree = (min) => `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
const jourFr = (j) => new Date(`${j}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Paris' });
const dateFr = (iso) => new Date(iso).toLocaleDateString('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' });

/**
 * Fiche de rémunération d'un livreur : une ligne par journée payée, total, signature.
 * @param fiche  FichePaie (numero, du, au, totalMinutes, totalMontant, nbLivraisons, envoyeLe)
 * @param paies  PaieLivreur[] (jour, minutes, tauxHoraire, nbLivraisons, montant, mode)
 * @param livreur { nom, prenom, email, telephone }
 * @param signature { image: Buffer, nom, fonction } | null
 */
export function genererFichePaiePdf(fiche, paies, livreur, signature = null) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: { Title: `Fiche de rémunération ${fiche.numero}`, Author: 'Afro-food', CreationDate: new Date(fiche.envoyeLe), ModDate: new Date(fiche.envoyeLe) },
    });
    const morceaux = [];
    doc.on('data', (c) => morceaux.push(c));
    doc.on('end', () => resolve(Buffer.concat(morceaux)));
    doc.on('error', reject);

    const L = 48;
    const R = doc.page.width - 48;
    const W = R - L;

    // En-tête
    doc.rect(0, 0, doc.page.width, 112).fill(C.bois);
    doc.rect(0, 112, doc.page.width, 5).fill(C.ocre);
    try {
      doc.save();
      doc.circle(L + 28, 56, 28).clip();
      doc.image(LOGO_PATH, L, 28, { width: 56, height: 56 });
      doc.restore();
    } catch {
      /* logo absent */
    }
    doc.fillColor(C.ivoire).font('Helvetica-Bold').fontSize(26).text('Afro-food', L + 70, 36);
    doc.fillColor(C.safran).font('Helvetica').fontSize(8.5).text("SAVEURS AUTHENTIQUES D'AFRIQUE", L + 70, 68, { characterSpacing: 2 });
    doc.fillColor(C.safran).font('Helvetica-Bold').fontSize(9).text('FICHE DE RÉMUNÉRATION', R - 220, 40, { width: 220, align: 'right', characterSpacing: 1.5 });
    doc.fillColor(C.ivoire).font('Helvetica').fontSize(9).text(`N° ${fiche.numero}`, R - 220, 58, { width: 220, align: 'right' });
    doc.text(`Émise le ${dateFr(fiche.envoyeLe)}`, R - 220, 72, { width: 220, align: 'right' });

    // Identité et période
    doc.fillColor(C.bois).font('Helvetica-Bold').fontSize(20).text(`${livreur.prenom} ${livreur.nom}`, L, 142);
    doc.fillColor(C.gris).font('Helvetica').fontSize(10).text('Livreur · Afro-food', L, 168);
    doc.roundedRect(R - 210, 142, 210, 40, 10).fill(C.sable);
    doc.fillColor(C.gris).font('Helvetica').fontSize(8).text('PÉRIODE', R - 196, 150, { characterSpacing: 1.5 });
    doc.fillColor(C.bois).font('Helvetica-Bold').fontSize(10).text(`du ${jourFr(fiche.du)} au ${jourFr(fiche.au)}`.replace(/\./g, ''), R - 196, 164, { width: 190, lineBreak: false, ellipsis: true });

    // Tableau
    let y = 214;
    const entete = () => {
      doc.roundedRect(L, y, W, 24, 6).fill(C.bois);
      doc.fillColor(C.ivoire).font('Helvetica-Bold').fontSize(8.5);
      doc.text('JOURNÉE', L + 12, y + 8, { characterSpacing: 1 });
      doc.text('HEURES', L + 175, y + 8, { width: 60, align: 'center', characterSpacing: 1 });
      doc.text('LIVRAISONS', L + 240, y + 8, { width: 70, align: 'center', characterSpacing: 1 });
      doc.text('TAUX', L + 315, y + 8, { width: 55, align: 'right', characterSpacing: 1 });
      doc.text('PAIEMENT', L + 375, y + 8, { width: 55, align: 'center', characterSpacing: 1 });
      doc.text('MONTANT', L + 430, y + 8, { width: W - 442, align: 'right', characterSpacing: 1 });
      y += 30;
    };
    entete();
    const lignes = [...paies].sort((a, b) => (a.jour < b.jour ? -1 : 1));
    lignes.forEach((p, i) => {
      if (y > 690) {
        doc.addPage({ size: 'A4', margin: 0 });
        y = 48;
        entete();
      }
      if (i % 2 === 1) doc.rect(L, y - 4, W, 24).fill(C.ivoire);
      doc.fillColor(C.bois).font('Helvetica-Bold').fontSize(9.5).text(jourFr(p.jour), L + 12, y + 2, { width: 160, lineBreak: false });
      doc.fillColor(C.texte).font('Helvetica').fontSize(9.5);
      doc.text(duree(p.minutes), L + 175, y + 2, { width: 60, align: 'center' });
      doc.text(String(p.nbLivraisons), L + 240, y + 2, { width: 70, align: 'center' });
      doc.text(`${eur(p.tauxHoraire)}/h`, L + 315, y + 2, { width: 55, align: 'right' });
      doc.text(p.mode === 'virement' ? 'Virement' : p.mode === 'especes' ? 'Espèces' : 'Autre', L + 375, y + 2, { width: 55, align: 'center' });
      doc.fillColor(C.bois).font('Helvetica-Bold').text(eur(p.montant), L + 430, y + 2, { width: W - 442, align: 'right' });
      y += 24;
      if (Number(p.prime) > 0) {
        doc.fillColor(C.vert).font('Helvetica').fontSize(8).text(`dont prime ${eur(p.prime)}${p.primeDetail ? ` — ${p.primeDetail}` : ''}`, L + 24, y - 6, { width: W - 40, lineBreak: false, ellipsis: true });
        y += 12;
      }
    });
    doc.moveTo(L, y + 2).lineTo(R, y + 2).lineWidth(0.8).strokeColor(C.trait).stroke();
    y += 16;

    // Totaux
    if (y > 640) {
      doc.addPage({ size: 'A4', margin: 0 });
      y = 48;
    }
    const total = (libelle, valeur) => {
      doc.fillColor(C.gris).font('Helvetica').fontSize(9.5).text(libelle, L + 290, y, { width: 110, align: 'right' });
      doc.fillColor(C.texte).font('Helvetica-Bold').fontSize(9.5).text(valeur, L + 410, y, { width: W - 422, align: 'right' });
      y += 17;
    };
    total('Journées payées', String(paies.length));
    total('Heures totales', duree(fiche.totalMinutes));
    total('Livraisons effectuées', String(fiche.nbLivraisons));
    const totalPrimes = paies.reduce((t, p) => t + Number(p.prime || 0), 0);
    if (totalPrimes > 0) total('Dont primes', eur(totalPrimes));
    y += 4;
    doc.roundedRect(L + 270, y, W - 270, 40, 8).fill(C.ocre);
    doc.fillColor(C.ivoire).font('Helvetica-Bold').fontSize(10).text('TOTAL PERÇU', L + 286, y + 15, { characterSpacing: 1.5 });
    doc.fontSize(18).text(eur(fiche.totalMontant), L + 290, y + 10, { width: W - 306, align: 'right' });
    y += 66;

    // Signature
    if (y > 650) {
      doc.addPage({ size: 'A4', margin: 0 });
      y = 48;
    }
    doc.fillColor(C.gris).font('Helvetica').fontSize(8.5).text('Pour Afro-food', L, y);
    let imageOk = false;
    if (signature?.image) {
      try {
        doc.image(signature.image, L + 4, y + 14, { fit: [170, 46], align: 'left', valign: 'bottom' });
        imageOk = true;
      } catch {
        /* image illisible */
      }
    }
    if (!imageOk) {
      doc.save().lineWidth(1.6).lineCap('round').strokeColor(C.encre);
      doc.moveTo(L + 4, y + 44).bezierCurveTo(L + 12, y + 8, L + 24, y + 10, L + 22, y + 28).bezierCurveTo(L + 20, y + 44, L + 34, y + 40, L + 42, y + 22).bezierCurveTo(L + 50, y + 8, L + 56, y + 38, L + 70, y + 36).bezierCurveTo(L + 90, y + 34, L + 100, y + 20, L + 138, y + 34).stroke();
      doc.restore();
    }
    doc.moveTo(L, y + 62).lineTo(L + 190, y + 62).lineWidth(0.7).strokeColor(C.gris).stroke();
    doc.fillColor(C.bois).font('Helvetica-Bold').fontSize(9).text(signature?.nom ? `${signature.nom}${signature.fonction ? `, ${signature.fonction}` : ''}` : 'Administration — Afro-food', L, y + 68, { width: 260 });
    doc.fillColor(C.gris).font('Helvetica').fontSize(7.5).text(`Signé électroniquement le ${dateFr(fiche.envoyeLe)}`, L, y + 81);
    doc.save().lineWidth(2).strokeColor(C.vert).circle(R - 70, y + 42, 40).stroke();
    doc.fillColor(C.vert).font('Helvetica-Bold').fontSize(7.5).text('AFRO-FOOD', R - 110, y + 14, { width: 80, align: 'center', characterSpacing: 1.5 });
    doc.lineWidth(3).moveTo(R - 84, y + 43).lineTo(R - 74, y + 53).lineTo(R - 54, y + 30).stroke();
    doc.text('PAYÉ', R - 110, y + 62, { width: 80, align: 'center', characterSpacing: 1.5 });
    doc.restore();

    // Pied de page
    const pied = doc.page.height - 56;
    doc.moveTo(L, pied - 8).lineTo(R, pied - 8).lineWidth(0.6).strokeColor(C.trait).stroke();
    doc.fillColor(C.gris).font('Helvetica').fontSize(7).text(
      'Document récapitulatif des journées payées. Il ne tient pas lieu de bulletin de paie au sens du Code du travail.',
      L, pied, { width: W, align: 'center' }
    );
    doc.text(`Afro-food · Fiche ${fiche.numero}`, L, pied + 11, { width: W, align: 'center' });
    doc.end();
  });
}
