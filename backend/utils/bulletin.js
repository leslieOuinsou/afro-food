import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import { calculerBulletin } from './cotisations.js';

const LOGO_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets/logo-email.jpg');
const C = { bois: '#2C1A0E', ocre: '#C2610F', safran: '#E9B26B', ivoire: '#FFFDF8', sable: '#F4EBDD', trait: '#E8DCC4', texte: '#4A3426', gris: '#8A7664', rouge: '#B3261E' };
const eur = (n) => `${Number(n || 0).toFixed(2).replace('.', ',')} €`;
const duree = (min) => `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
const date = (iso) => new Date(iso).toLocaleDateString('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' });
const jourFr = (j) => new Date(`${j}T12:00:00Z`).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Paris' });

/**
 * Bulletin de rémunération SIMPLIFIÉ : heures, brut, cotisations aux taux configurés, net avant impôt.
 * Document informatif : il ne remplace pas un bulletin de paie établi avec un logiciel de paie conforme.
 */
export function genererBulletinPdf(fiche, paies, livreur, employeur, taux) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: { Title: `Bulletin simplifié ${fiche.numero}`, Author: employeur.nom || 'Afro-food', CreationDate: new Date(fiche.envoyeLe), ModDate: new Date(fiche.envoyeLe) },
    });
    const morceaux = [];
    doc.on('data', (c) => morceaux.push(c));
    doc.on('end', () => resolve(Buffer.concat(morceaux)));
    doc.on('error', reject);

    const L = 48;
    const R = doc.page.width - 48;
    const W = R - L;
    const minutes = paies.reduce((t, p) => t + p.minutes, 0);
    const salaireBase = paies.reduce((t, p) => t + (Number(p.montant) - Number(p.prime || 0)), 0);
    const primes = paies.reduce((t, p) => t + Number(p.prime || 0), 0);
    const calc = calculerBulletin(salaireBase + primes, taux);

    // En-tête
    doc.rect(0, 0, doc.page.width, 100).fill(C.bois);
    doc.rect(0, 100, doc.page.width, 5).fill(C.ocre);
    try {
      doc.save();
      doc.circle(L + 24, 50, 24).clip();
      doc.image(LOGO_PATH, L, 26, { width: 48, height: 48 });
      doc.restore();
    } catch {
      /* logo absent */
    }
    doc.fillColor(C.ivoire).font('Helvetica-Bold').fontSize(22).text(employeur.nom || 'Afro-food', L + 62, 34, { width: 280, lineBreak: false, ellipsis: true });
    doc.fillColor(C.safran).font('Helvetica-Bold').fontSize(10).text('BULLETIN SIMPLIFIÉ', R - 220, 34, { width: 220, align: 'right', characterSpacing: 2 });
    doc.fillColor(C.ivoire).font('Helvetica').fontSize(9).text(`Réf. ${fiche.numero}`, R - 220, 52, { width: 220, align: 'right' });
    doc.text(`Période du ${jourFr(fiche.du)} au ${jourFr(fiche.au)}`, R - 220, 66, { width: 220, align: 'right' });

    // Employeur / salarié
    const bloc = (x, y, w, titre, lignes) => {
      doc.roundedRect(x, y, w, 104, 10).fill(C.sable);
      doc.fillColor(C.ocre).font('Helvetica-Bold').fontSize(8).text(titre, x + 14, y + 12, { characterSpacing: 1.5 });
      let ly = y + 30;
      lignes.filter(Boolean).forEach((l, i) => {
        doc.fillColor(i === 0 ? C.bois : C.texte).font(i === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(i === 0 ? 10.5 : 9).text(String(l), x + 14, ly, { width: w - 28, lineBreak: false, ellipsis: true });
        ly += i === 0 ? 17 : 13;
      });
    };
    const demi = (W - 14) / 2;
    bloc(L, 124, demi, 'EMPLOYEUR', [employeur.nom, employeur.adresse, [employeur.codePostal, employeur.ville].filter(Boolean).join(' '), employeur.siret ? `SIRET : ${employeur.siret}` : null, employeur.tvaIntra ? `TVA : ${employeur.tvaIntra}` : null]);
    bloc(L + demi + 14, 124, demi, 'SALARIÉ', [`${livreur.prenom} ${livreur.nom}`, 'Emploi : livreur', livreur.email, livreur.telephone]);

    // Tableau des éléments
    let y = 248;
    doc.roundedRect(L, y, W, 24, 6).fill(C.bois);
    doc.fillColor(C.ivoire).font('Helvetica-Bold').fontSize(8.5);
    doc.text('ÉLÉMENT', L + 12, y + 8, { characterSpacing: 1 });
    doc.text('BASE', L + 250, y + 8, { width: 80, align: 'right', characterSpacing: 1 });
    doc.text('TAUX', L + 335, y + 8, { width: 60, align: 'right', characterSpacing: 1 });
    doc.text('MONTANT', L + 400, y + 8, { width: W - 412, align: 'right', characterSpacing: 1 });
    y += 30;
    const ligne = (libelle, base, tauxTxt, montant, { gras = false, couleur = C.texte } = {}) => {
      doc.fillColor(gras ? C.bois : C.texte).font(gras ? 'Helvetica-Bold' : 'Helvetica').fontSize(9.5).text(libelle, L + 12, y, { width: 235, lineBreak: false, ellipsis: true });
      doc.fillColor(C.texte).font('Helvetica').text(base, L + 250, y, { width: 80, align: 'right' });
      doc.text(tauxTxt, L + 335, y, { width: 60, align: 'right' });
      doc.fillColor(couleur).font(gras ? 'Helvetica-Bold' : 'Helvetica').text(montant, L + 400, y, { width: W - 412, align: 'right' });
      y += 20;
    };
    const tauxMoyen = minutes > 0 ? (salaireBase / minutes) * 60 : 0;
    ligne('Salaire de base (heures travaillées)', duree(minutes), `${eur(tauxMoyen)}/h`, eur(salaireBase), { gras: true });
    if (primes > 0) ligne('Primes (livraisons, avis)', '', '', eur(primes));
    doc.moveTo(L, y).lineTo(R, y).lineWidth(0.7).strokeColor(C.trait).stroke();
    y += 8;
    ligne('SALAIRE BRUT', '', '', eur(calc.brut), { gras: true });
    ligne('Cotisations salariales (estimées)', eur(calc.brut), `${String(taux.tauxSalarial).replace('.', ',')} %`, `- ${eur(calc.cotisationsSalariales)}`, { couleur: C.rouge });
    doc.moveTo(L, y).lineTo(R, y).lineWidth(0.7).strokeColor(C.trait).stroke();
    y += 10;
    doc.roundedRect(L + 250, y, W - 250, 40, 8).fill(C.ocre);
    doc.fillColor(C.ivoire).font('Helvetica-Bold').fontSize(10).text('NET AVANT IMPÔT', L + 266, y + 15, { characterSpacing: 1.2 });
    doc.fontSize(17).text(eur(calc.netAvantImpot), L + 290, y + 11, { width: W - 306, align: 'right' });
    y += 58;

    doc.fillColor(C.gris).font('Helvetica').fontSize(9);
    doc.text(`Cotisations patronales estimées (${String(taux.tauxPatronal).replace('.', ',')} %) : ${eur(calc.cotisationsPatronales)}  ·  Coût total employeur : ${eur(calc.coutEmployeur)}`, L, y, { width: W });
    y += 30;

    // Détail des journées
    doc.fillColor(C.ocre).font('Helvetica-Bold').fontSize(8).text('DÉTAIL DES JOURNÉES', L, y, { characterSpacing: 1.5 });
    y += 16;
    [...paies].sort((a, b) => (a.jour < b.jour ? -1 : 1)).forEach((p) => {
      if (y > 735) return; // détail tronqué : le total ci-dessus reste exact
      doc.fillColor(C.texte).font('Helvetica').fontSize(8.5).text(`${jourFr(p.jour)}  ·  ${duree(p.minutes)}  ·  ${p.nbLivraisons} livraison(s)${Number(p.prime) > 0 ? `  ·  prime ${eur(p.prime)}` : ''}`, L, y, { width: W - 90 });
      doc.fillColor(C.bois).font('Helvetica-Bold').text(eur(p.montant), R - 90, y, { width: 90, align: 'right' });
      y += 14;
    });

    // Avertissement
    const pied = doc.page.height - 78;
    doc.roundedRect(L, pied - 8, W, 56, 8).fill('#FDECEC');
    doc.fillColor(C.rouge).font('Helvetica-Bold').fontSize(8).text('DOCUMENT SIMPLIFIÉ — À VALIDER PAR VOTRE EXPERT-COMPTABLE', L + 12, pied, { characterSpacing: 0.6 });
    doc.fillColor(C.texte).font('Helvetica').fontSize(7.5).text(
      "Les cotisations sont des estimations aux taux paramétrés par l'employeur. Ce document ne remplace pas un bulletin de paie établi avec un logiciel de paie conforme (mentions et cotisations légales, prélèvement à la source). Émis le " + date(fiche.envoyeLe) + '.',
      L + 12, pied + 14, { width: W - 24 }
    );
    doc.end();
  });
}
