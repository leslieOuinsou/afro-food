import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const LOGO_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets/logo-email.jpg');
const C = { bois: '#2C1A0E', ocre: '#C2610F', safran: '#E9B26B', ivoire: '#FFFDF8', sable: '#F4EBDD', trait: '#E8DCC4', texte: '#4A3426', gris: '#8A7664', vert: '#1A7F37' };

const eur = (n) => `${Number(n || 0).toFixed(2).replace('.', ',')} €`;
const date = (iso) => new Date(iso).toLocaleDateString('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' });
const LIBELLE_MODE = { carte: 'Carte bancaire', virement: 'Virement (paiement en ligne)', mobile: 'Mobile Money', especes: 'Espèces à la livraison' };

/**
 * Taux de TVA effectif de la commande : TVA / base hors taxes.
 * Les prix du catalogue sont hors taxes ; la TVA est ajoutée au total (voir creerCommande).
 */
export function tauxTva(commande) {
  const base = Number(commande.sousTotal) + Number(commande.fraisLivraison) - Number(commande.remise);
  return base > 0 ? Math.round((Number(commande.taxes) / base) * 1000) / 10 : 0;
}

/** Facture PDF d'une commande payée. Sortie identique à chaque appel (dates figées). */
export function genererFacturePdf(commande, vendeur) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: `Facture ${commande.numeroFacture}`,
        Author: vendeur.nom || 'Afro-food',
        CreationDate: new Date(commande.factureLe),
        ModDate: new Date(commande.factureLe),
      },
    });
    const morceaux = [];
    doc.on('data', (c) => morceaux.push(c));
    doc.on('end', () => resolve(Buffer.concat(morceaux)));
    doc.on('error', reject);

    const L = 48;
    const R = doc.page.width - 48;
    const W = R - L;
    const info = commande.informationsClient || {};
    const adr = commande.adresseLivraison || {};
    const taux = tauxTva(commande);
    const baseHt = Number(commande.sousTotal) + Number(commande.fraisLivraison) - Number(commande.remise);

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
    doc.fillColor(C.ivoire).font('Helvetica-Bold').fontSize(26).text(vendeur.nom || 'Afro-food', L + 70, 36, { width: 260, lineBreak: false, ellipsis: true });
    doc.fillColor(C.safran).font('Helvetica').fontSize(8.5).text("SAVEURS AUTHENTIQUES D'AFRIQUE", L + 70, 68, { characterSpacing: 2 });
    doc.fillColor(C.safran).font('Helvetica-Bold').fontSize(11).text('FACTURE', R - 220, 36, { width: 220, align: 'right', characterSpacing: 3 });
    doc.fillColor(C.ivoire).font('Helvetica-Bold').fontSize(12).text(commande.numeroFacture, R - 220, 54, { width: 220, align: 'right' });
    doc.font('Helvetica').fontSize(9).text(`Émise le ${date(commande.factureLe)}`, R - 220, 74, { width: 220, align: 'right' });

    // Vendeur / acheteur
    const bloc = (x, y, w, titre, lignes) => {
      doc.roundedRect(x, y, w, 112, 10).fill(C.sable);
      doc.fillColor(C.ocre).font('Helvetica-Bold').fontSize(8).text(titre, x + 14, y + 12, { characterSpacing: 1.5 });
      let ly = y + 30;
      lignes.filter(Boolean).forEach((l, i) => {
        doc.fillColor(i === 0 ? C.bois : C.texte).font(i === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(i === 0 ? 10.5 : 9).text(String(l), x + 14, ly, { width: w - 28, lineBreak: false, ellipsis: true });
        ly += i === 0 ? 17 : 14;
      });
    };
    const demi = (W - 14) / 2;
    bloc(L, 140, demi, 'VENDEUR', [
      vendeur.nom,
      vendeur.formeJuridique,
      vendeur.adresse,
      [vendeur.codePostal, vendeur.ville].filter(Boolean).join(' '),
      vendeur.siret ? `SIRET : ${vendeur.siret}` : null,
      vendeur.tvaIntra ? `TVA : ${vendeur.tvaIntra}` : null,
    ]);
    bloc(L + demi + 14, 140, demi, 'FACTURÉ À', [
      [info.prenom, info.nom].filter(Boolean).join(' ') || 'Client',
      info.email,
      info.telephone,
      adr.adresse,
      [adr.codePostal, adr.ville].filter(Boolean).join(' '),
    ]);

    doc.fillColor(C.gris).font('Helvetica').fontSize(9).text(`Commande ${commande.numeroCommande} du ${date(commande.createdAt)}`, L, 268);

    // Tableau
    let y = 290;
    const entete = () => {
      doc.roundedRect(L, y, W, 24, 6).fill(C.bois);
      doc.fillColor(C.ivoire).font('Helvetica-Bold').fontSize(8.5);
      doc.text('DÉSIGNATION', L + 12, y + 8, { characterSpacing: 1 });
      doc.text('QTÉ', L + 285, y + 8, { width: 40, align: 'center', characterSpacing: 1 });
      doc.text('PRIX HT', L + 330, y + 8, { width: 75, align: 'right', characterSpacing: 1 });
      doc.text('TOTAL HT', L + 410, y + 8, { width: W - 422, align: 'right', characterSpacing: 1 });
      y += 30;
    };
    entete();
    (commande.articles || []).forEach((a, i) => {
      if (y > 650) {
        doc.addPage({ size: 'A4', margin: 0 });
        y = 48;
        entete();
      }
      if (i % 2 === 1) doc.rect(L, y - 4, W, 24).fill(C.ivoire);
      doc.fillColor(C.bois).font('Helvetica-Bold').fontSize(9.5).text(String(a.informationsPlat?.nom || 'Produit'), L + 12, y + 2, { width: 265, lineBreak: false, ellipsis: true });
      doc.fillColor(C.texte).font('Helvetica').fontSize(9.5);
      doc.text(String(a.quantite), L + 285, y + 2, { width: 40, align: 'center' });
      doc.text(eur(a.prixUnitaire), L + 330, y + 2, { width: 75, align: 'right' });
      doc.fillColor(C.bois).font('Helvetica-Bold').text(eur(a.sousTotal), L + 410, y + 2, { width: W - 422, align: 'right' });
      y += 24;
    });
    doc.moveTo(L, y + 2).lineTo(R, y + 2).lineWidth(0.8).strokeColor(C.trait).stroke();
    y += 16;

    // Totaux
    if (y > 600) {
      doc.addPage({ size: 'A4', margin: 0 });
      y = 48;
    }
    const total = (libelle, valeur, couleur = C.texte, gras = false) => {
      doc.fillColor(C.gris).font('Helvetica').fontSize(9.5).text(libelle, L + 280, y, { width: 130, align: 'right' });
      doc.fillColor(couleur).font(gras ? 'Helvetica-Bold' : 'Helvetica').fontSize(9.5).text(valeur, L + 410, y, { width: W - 422, align: 'right' });
      y += 17;
    };
    total('Sous-total HT', eur(commande.sousTotal));
    total('Livraison HT', Number(commande.fraisLivraison) > 0 ? eur(commande.fraisLivraison) : 'Offerte');
    if (Number(commande.remise) > 0) total(commande.codePromo ? `Remise (${commande.codePromo})` : 'Remise', `- ${eur(commande.remise)}`, C.vert);
    total('Total HT', eur(baseHt), C.bois, true);
    total(`TVA ${String(taux).replace('.', ',')} %`, eur(commande.taxes));
    y += 4;
    doc.roundedRect(L + 260, y, W - 260, 40, 8).fill(C.ocre);
    doc.fillColor(C.ivoire).font('Helvetica-Bold').fontSize(10).text('TOTAL TTC', L + 276, y + 15, { characterSpacing: 1.5 });
    doc.fontSize(18).text(eur(commande.total), L + 290, y + 10, { width: W - 306, align: 'right' });
    y += 62;

    // Règlement
    doc.roundedRect(L, y, W, 54, 10).lineWidth(1).strokeColor(C.trait).stroke();
    doc.fillColor(C.ocre).font('Helvetica-Bold').fontSize(8).text('RÈGLEMENT', L + 16, y + 12, { characterSpacing: 1.5 });
    const payeLe = commande.paiement?.stripe?.payeLe || commande.paiement?.dateEncaissement || commande.dates?.livraison || commande.factureLe;
    doc.fillColor(C.bois).font('Helvetica-Bold').fontSize(10).text(`Facture acquittée — ${LIBELLE_MODE[commande.methodePaiement] || commande.methodePaiement}`, L + 16, y + 28);
    doc.fillColor(C.gris).font('Helvetica').fontSize(9).text(`Réglée le ${date(payeLe)}`, L + 16, y + 42);
    doc.fillColor(C.vert).font('Helvetica-Bold').fontSize(18).text('PAYÉE', R - 110, y + 17, { width: 94, align: 'right', characterSpacing: 2 });

    // Pied de page
    const pied = doc.page.height - 56;
    doc.moveTo(L, pied - 8).lineTo(R, pied - 8).lineWidth(0.6).strokeColor(C.trait).stroke();
    const mentions = [vendeur.nom, vendeur.formeJuridique, [vendeur.adresse, vendeur.codePostal, vendeur.ville].filter(Boolean).join(' '), vendeur.siret ? `SIRET ${vendeur.siret}` : null, vendeur.tvaIntra ? `TVA ${vendeur.tvaIntra}` : null]
      .filter(Boolean)
      .join(' · ');
    doc.fillColor(C.gris).font('Helvetica').fontSize(7.5).text(mentions || 'Afro-food', L, pied, { width: W, align: 'center' });
    doc.text(`Paiement comptant, sans escompte. ${vendeur.email ? `Contact : ${vendeur.email}` : ''}`, L, pied + 11, { width: W, align: 'center' });
    doc.end();
  });
}
