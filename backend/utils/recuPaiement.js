import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

const LOGO_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets/logo-email.jpg');
const COULEURS = {
  bois: '#2C1A0E',
  ocre: '#C2610F',
  safran: '#E9B26B',
  ivoire: '#FFFDF8',
  sable: '#F4EBDD',
  trait: '#E8DCC4',
  texte: '#4A3426',
  gris: '#8A7664',
  vert: '#1A7F37',
  encre: '#1B2A5C',
};

// Le calcul de la date utilise un fuseau fixe : le fichier doit rester identique quel que soit le serveur.
const dateLongue = (iso) =>
  new Date(iso).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' });
const eur = (n) => `${Number(n || 0).toFixed(2).replace('.', ',')} €`;

/** Charge la commande avec ses articles, toujours dans le même ordre (le justificatif doit être reproductible). */
export const chargerCommandePourRecu = (prisma, id) =>
  prisma.commande.findUnique({
    where: { id },
    include: { articles: { orderBy: { id: 'asc' } } },
  });

/** Code court qui lie le reçu à la commande, au montant et à la session Stripe (vérifiable par l'admin). */
export function codeVerification(commande, referenceStripe) {
  const secret = process.env.JWT_SECRET || 'afro-food';
  return crypto
    .createHmac('sha256', secret)
    .update(`${commande.numeroCommande}|${Number(commande.total).toFixed(2)}|${referenceStripe}`)
    .digest('hex')
    .slice(0, 12)
    .toUpperCase();
}

/** Signature manuscrite dessinée en vectoriel (aucune police nécessaire). */
function dessinerSignature(doc, x, y) {
  doc.save();
  doc.lineWidth(1.6).lineCap('round').lineJoin('round').strokeColor(COULEURS.encre);
  doc
    .moveTo(x, y + 30)
    .bezierCurveTo(x + 8, y - 6, x + 20, y - 4, x + 18, y + 14)
    .bezierCurveTo(x + 16, y + 30, x + 30, y + 26, x + 38, y + 8)
    .bezierCurveTo(x + 42, y - 2, x + 46, y + 22, x + 54, y + 24)
    .bezierCurveTo(x + 62, y + 26, x + 66, y + 6, x + 74, y + 8)
    .bezierCurveTo(x + 82, y + 10, x + 80, y + 28, x + 92, y + 22)
    .bezierCurveTo(x + 104, y + 16, x + 100, y + 2, x + 112, y + 4)
    .bezierCurveTo(x + 124, y + 6, x + 118, y + 26, x + 134, y + 20)
    .stroke();
  // paraphe : trait de soulignement
  doc.lineWidth(1.1).moveTo(x - 6, y + 36).bezierCurveTo(x + 40, y + 30, x + 100, y + 42, x + 150, y + 30).stroke();
  doc.restore();
}

/** Cachet circulaire « paiement vérifié ». */
function dessinerCachet(doc, cx, cy) {
  doc.save();
  doc.lineWidth(2).strokeColor(COULEURS.vert);
  doc.circle(cx, cy, 44).stroke();
  doc.lineWidth(0.8).circle(cx, cy, 39).stroke();
  doc.fillColor(COULEURS.vert).font('Helvetica-Bold').fontSize(7.5);
  doc.text('AFRO-FOOD', cx - 40, cy - 30, { width: 80, align: 'center', characterSpacing: 1.5 });
  doc.text('VÉRIFIÉ', cx - 40, cy + 21, { width: 80, align: 'center', characterSpacing: 1.5 });
  doc.lineWidth(3.2).moveTo(cx - 14, cy + 1).lineTo(cx - 4, cy + 11).lineTo(cx + 15, cy - 12).stroke();
  doc.restore();
}

/** Justificatif de paiement PDF remis au client après son paiement Stripe. Sortie identique à chaque appel. */
export async function genererRecuPdf(commande, stripe) {
  const code = codeVerification(commande, stripe.reference);
  const qr = await QRCode.toBuffer(`AFRO-FOOD|${commande.numeroCommande}|${Number(commande.total).toFixed(2)}|${code}`, {
    margin: 1,
    width: 220,
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: `Justificatif de paiement ${commande.numeroCommande}`,
        Author: 'Afro-food',
        Subject: 'Justificatif de paiement par virement',
        // Dates figées : le même paiement produit toujours exactement le même fichier (empreinte vérifiable)
        CreationDate: new Date(stripe.payeLe),
        ModDate: new Date(stripe.payeLe),
      },
    });
    const morceaux = [];
    doc.on('data', (c) => morceaux.push(c));
    doc.on('end', () => resolve(Buffer.concat(morceaux)));
    doc.on('error', reject);

    const L = 48; // marge gauche
    const R = doc.page.width - 48; // bord droit
    const W = R - L;
    const info = commande.informationsClient || {};
    const adresse = commande.adresseLivraison || {};
    const clientNom = [info.prenom, info.nom].filter(Boolean).join(' ') || '—';

    // ── En-tête
    doc.rect(0, 0, doc.page.width, 112).fill(COULEURS.bois);
    doc.rect(0, 112, doc.page.width, 5).fill(COULEURS.ocre);
    try {
      doc.save();
      doc.circle(L + 28, 56, 28).clip();
      doc.image(LOGO_PATH, L, 28, { width: 56, height: 56 });
      doc.restore();
    } catch {
      /* logo absent : l'en-tête reste lisible */
    }
    doc.fillColor(COULEURS.ivoire).font('Helvetica-Bold').fontSize(26).text('Afro-food', L + 70, 36);
    doc.fillColor(COULEURS.safran).font('Helvetica').fontSize(8.5).text("SAVEURS AUTHENTIQUES D'AFRIQUE", L + 70, 68, { characterSpacing: 2 });
    doc.fillColor(COULEURS.safran).font('Helvetica-Bold').fontSize(9).text('JUSTIFICATIF DE PAIEMENT', R - 200, 40, { width: 200, align: 'right', characterSpacing: 1.5 });
    doc.fillColor(COULEURS.ivoire).font('Helvetica').fontSize(9).text(`N° ${commande.numeroCommande}`, R - 200, 58, { width: 200, align: 'right' });
    doc.text(dateLongue(stripe.payeLe), R - 200, 72, { width: 200, align: 'right' });

    // ── Titre + pastille de statut
    doc.fillColor(COULEURS.bois).font('Helvetica-Bold').fontSize(20).text(`Commande ${commande.numeroCommande}`, L, 142);
    doc.roundedRect(R - 150, 142, 150, 24, 12).fill('#E8F3E8');
    doc.fillColor(COULEURS.vert).font('Helvetica-Bold').fontSize(9).text('PAIEMENT ENREGISTRÉ', R - 150, 150, { width: 150, align: 'center', characterSpacing: 0.8 });

    // ── Deux cartes : client / paiement
    const carte = (x, y, w, titre, lignes) => {
      doc.roundedRect(x, y, w, 118, 10).fill(COULEURS.sable);
      doc.fillColor(COULEURS.ocre).font('Helvetica-Bold').fontSize(8).text(titre, x + 14, y + 12, { characterSpacing: 1.5 });
      let ly = y + 30;
      for (const [libelle, valeur] of lignes) {
        doc.fillColor(COULEURS.gris).font('Helvetica').fontSize(8).text(libelle, x + 14, ly, { width: 74 });
        doc.fillColor(COULEURS.bois).font('Helvetica-Bold').fontSize(9).text(String(valeur || '—'), x + 90, ly - 1, { width: w - 104, lineBreak: false, ellipsis: true });
        ly += 17;
      }
    };
    const demi = (W - 14) / 2;
    carte(L, 184, demi, 'CLIENT', [
      ['Nom', clientNom],
      ['E-mail', info.email],
      ['Téléphone', info.telephone],
      ['Adresse', adresse.adresse],
      ['Ville', [adresse.codePostal, adresse.ville].filter(Boolean).join(' ')],
    ]);
    carte(L + demi + 14, 184, demi, 'PAIEMENT', [
      ['Mode', 'Virement — paiement en ligne'],
      ['Prestataire', 'Stripe (mode sécurisé)'],
      ['Payé le', dateLongue(stripe.payeLe)],
      ['Réf. Stripe', `${String(stripe.reference).slice(0, 22)}…`],
      ['Réf. virement', commande.numeroCommande],
    ]);

    // ── Tableau des articles
    let y = 322;
    const enTeteTableau = () => {
      doc.roundedRect(L, y, W, 24, 6).fill(COULEURS.bois);
      doc.fillColor(COULEURS.ivoire).font('Helvetica-Bold').fontSize(8.5);
      doc.text('ARTICLE', L + 12, y + 8, { characterSpacing: 1 });
      doc.text('QTÉ', L + 290, y + 8, { width: 40, align: 'center', characterSpacing: 1 });
      doc.text('PRIX UNIT.', L + 335, y + 8, { width: 70, align: 'right', characterSpacing: 1 });
      doc.text('TOTAL', L + 410, y + 8, { width: W - 422, align: 'right', characterSpacing: 1 });
      y += 30;
    };
    enTeteTableau();
    const articles = commande.articles || [];
    articles.forEach((a, i) => {
      if (y > 690) {
        doc.addPage({ size: 'A4', margin: 0 });
        y = 48;
        enTeteTableau();
      }
      if (i % 2 === 1) doc.rect(L, y - 4, W, 24).fill(COULEURS.ivoire);
      doc.fillColor(COULEURS.bois).font('Helvetica-Bold').fontSize(9.5).text(String(a.informationsPlat?.nom || 'Produit'), L + 12, y + 2, { width: 270, lineBreak: false, ellipsis: true });
      doc.fillColor(COULEURS.texte).font('Helvetica').fontSize(9.5);
      doc.text(String(a.quantite), L + 290, y + 2, { width: 40, align: 'center' });
      doc.text(eur(a.prixUnitaire), L + 335, y + 2, { width: 70, align: 'right' });
      doc.fillColor(COULEURS.bois).font('Helvetica-Bold').text(eur(a.sousTotal), L + 410, y + 2, { width: W - 422, align: 'right' });
      y += 24;
    });
    doc.moveTo(L, y + 2).lineTo(R, y + 2).lineWidth(0.8).strokeColor(COULEURS.trait).stroke();
    y += 14;

    // ── Totaux
    const ligneTotal = (libelle, valeur, couleur = COULEURS.texte) => {
      doc.fillColor(COULEURS.gris).font('Helvetica').fontSize(9.5).text(libelle, L + 300, y, { width: 100, align: 'right' });
      doc.fillColor(couleur).font('Helvetica').fontSize(9.5).text(valeur, L + 410, y, { width: W - 422, align: 'right' });
      y += 17;
    };
    ligneTotal('Sous-total', eur(commande.sousTotal));
    ligneTotal('Livraison', Number(commande.fraisLivraison) > 0 ? eur(commande.fraisLivraison) : 'Offerte');
    if (Number(commande.taxes) > 0) ligneTotal('Dont TVA', eur(commande.taxes));
    if (Number(commande.remise) > 0) ligneTotal('Remise', `− ${eur(commande.remise)}`, COULEURS.vert);
    y += 4;
    doc.roundedRect(L + 280, y, W - 280, 38, 8).fill(COULEURS.ocre);
    doc.fillColor(COULEURS.ivoire).font('Helvetica-Bold').fontSize(10).text('TOTAL PAYÉ', L + 296, y + 14, { characterSpacing: 1.5 });
    doc.fontSize(17).text(eur(commande.total), L + 290, y + 10, { width: W - 306, align: 'right' });
    y += 62;

    // ── Vérification : code + QR
    if (y > 560) {
      doc.addPage({ size: 'A4', margin: 0 });
      y = 48;
    }
    doc.roundedRect(L, y, W, 108, 10).lineWidth(1).strokeColor(COULEURS.trait).stroke();
    doc.fillColor(COULEURS.ocre).font('Helvetica-Bold').fontSize(8).text('VÉRIFICATION DU DOCUMENT', L + 16, y + 14, { characterSpacing: 1.5 });
    doc.fillColor(COULEURS.gris).font('Helvetica').fontSize(8.5).text('Code de vérification', L + 16, y + 34);
    doc.fillColor(COULEURS.ocre).font('Courier-Bold').fontSize(21).text(code, L + 16, y + 48);
    doc.fillColor(COULEURS.gris).font('Helvetica').fontSize(8).text(
      'L’administration scanne le QR code ou saisit ce code pour confirmer le paiement avant la préparation et la livraison de votre commande.',
      L + 16, y + 78, { width: W - 160 }
    );
    doc.image(qr, R - 100, y + 10, { width: 88 });
    doc.fillColor(COULEURS.gris).font('Helvetica').fontSize(6.5).text('Scannez pour lire le code', R - 104, y + 98, { width: 96, align: 'center' });
    y += 128;

    // ── Signature
    if (y > 692) {
      doc.addPage({ size: 'A4', margin: 0 });
      y = 48;
    }
    doc.fillColor(COULEURS.gris).font('Helvetica').fontSize(8.5).text('Pour Afro-food, le service paiements', L, y);
    dessinerSignature(doc, L + 4, y + 16);
    doc.moveTo(L, y + 62).lineTo(L + 190, y + 62).lineWidth(0.7).strokeColor(COULEURS.gris).stroke();
    doc.fillColor(COULEURS.bois).font('Helvetica-Bold').fontSize(9).text('Service Paiements — Afro-food', L, y + 68);
    doc.fillColor(COULEURS.gris).font('Helvetica').fontSize(7.5).text(`Signé électroniquement le ${dateLongue(stripe.payeLe)}`, L, y + 81);
    dessinerCachet(doc, R - 70, y + 42);

    // ── Pied de page
    const pied = doc.page.height - 44;
    doc.moveTo(L, pied - 8).lineTo(R, pied - 8).lineWidth(0.6).strokeColor(COULEURS.trait).stroke();
    doc.fillColor(COULEURS.gris).font('Helvetica').fontSize(7.5).text(
      `Afro-food · Cuisine camerounaise et béninoise · Document généré automatiquement · Réf. ${commande.numeroCommande} · ${code}`,
      L, pied, { width: W, align: 'center' }
    );
    doc.end();
  });
}
