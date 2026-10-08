import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

const eur = (n) => `${Number(n).toFixed(2).replace('.', ',')} EUR`;

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

/** Justificatif de paiement PDF remis au client après son paiement Stripe. */
export async function genererRecuPdf(commande, stripe) {
  const code = codeVerification(commande, stripe.reference);
  // QR code : l'admin le scanne avec un téléphone pour lire le code de vérification
  const qr = await QRCode.toBuffer(`AFRO-FOOD|${commande.numeroCommande}|${Number(commande.total).toFixed(2)}|${code}`, {
    margin: 1,
    width: 220,
  });
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 56, info: {
        Title: `Justificatif ${commande.numeroCommande}`,
        Author: 'Afro-food',
        // Dates figées : le même paiement produit toujours exactement le même fichier (empreinte vérifiable)
        CreationDate: new Date(stripe.payeLe),
        ModDate: new Date(stripe.payeLe),
      },
    });
    const morceaux = [];
    doc.on('data', (c) => morceaux.push(c));
    doc.on('end', () => resolve(Buffer.concat(morceaux)));
    doc.on('error', reject);

    const info = commande.informationsClient || {};
    const client = [info.prenom, info.nom].filter(Boolean).join(' ');

    doc.rect(0, 0, doc.page.width, 90).fill('#2C1A0E');
    doc.fillColor('#FFFDF8').font('Helvetica-Bold').fontSize(24).text('Afro-food', 56, 32);
    doc.fillColor('#E9B26B').font('Helvetica').fontSize(10).text('JUSTIFICATIF DE PAIEMENT', 56, 62);

    doc.fillColor('#2C1A0E').font('Helvetica-Bold').fontSize(18).text(`Commande ${commande.numeroCommande}`, 56, 130);
    doc.moveDown(0.3).font('Helvetica').fontSize(11).fillColor('#4A3426');
    const lignes = [
      ['Client', client || '—'],
      ['Montant payé', eur(commande.total)],
      ['Mode', 'Paiement en ligne (Stripe) — virement'],
      ['Date du paiement', new Date(stripe.payeLe).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })],
      ['Référence Stripe', stripe.reference],
      ['Référence virement', commande.numeroCommande],
    ];
    let y = 185;
    for (const [libelle, valeur] of lignes) {
      doc.font('Helvetica').fillColor('#8A7664').text(libelle, 56, y, { width: 150 });
      doc.font('Helvetica-Bold').fillColor('#2C1A0E').text(String(valeur), 210, y, { width: 330 });
      y += 26;
    }
    doc.moveTo(56, y + 6).lineTo(doc.page.width - 56, y + 6).strokeColor('#E8DCC4').stroke();
    doc.font('Helvetica').fontSize(10).fillColor('#8A7664').text('Code de vérification', 56, y + 22);
    doc.font('Courier-Bold').fontSize(20).fillColor('#C2610F').text(code, 56, y + 38);
    doc.image(qr, doc.page.width - 56 - 110, y + 14, { width: 110 });
    doc.font('Helvetica').fontSize(8).fillColor('#8A7664').text('Scannez pour lire le code', doc.page.width - 56 - 110, y + 126, { width: 110, align: 'center' });
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#8A7664')
      .text(
        'Envoyez ce document depuis la page de votre commande. L’administration vérifie le paiement avant de lancer la préparation et la livraison.',
        56,
        y + 160,
        { width: doc.page.width - 112 }
      );
    doc.end();
  });
}
