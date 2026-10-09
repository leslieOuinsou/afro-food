import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import path from 'path';
import {
  orderConfirmationEmail,
  orderStatusEmail,
  passwordResetEmail,
  thankYouEmail,
  promoRewardEmail,
  newOrderAdminEmail,
  cashCodeEmail,
  cashReceiptEmail,
  stripeVirementEmail,
  orderReadyCourierEmail,
  payslipEmail,
  contactReplyEmail,
  negativeReviewEmail,
  cashAlertEmail,
  welcomeEmail,
} from './emailTemplates.js';

let transporter = null;

// Logo embarqué dans le mail (cid) : s'affiche partout, même quand FRONTEND_URL n'est pas public (localhost).
const LOGO_CID = 'logo-afro-food@afro-food';
const LOGO_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets/logo-email.jpg');
const FRONT_LOGO_RE = /https?:\/\/[^"'\s)]+\/logo-afro-eats\.png/g;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });
  return transporter;
}

/**
 * Envoie un e-mail. En développement sans SMTP, log le contenu.
 */
export async function envoyerEmail({ to, subject, html, text, replyTo }) {
  const from = process.env.EMAIL_FROM || 'Afro-food <noreply@afro-food.com>';
  const transport = getTransporter();

  if (!transport) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n📧 [EMAIL DEV — non envoyé]');
      console.log(`   À: ${to}`);
      console.log(`   Sujet: ${subject}`);
      if (text) console.log(`   Texte: ${text.slice(0, 200)}...`);
      console.log('');
    }
    return { sent: false, reason: 'smtp_non_configure' };
  }

  const avecLogo = typeof html === 'string' && FRONT_LOGO_RE.test(html);
  FRONT_LOGO_RE.lastIndex = 0;
  await transport.sendMail({
    from,
    to,
    ...(replyTo ? { replyTo } : {}),
    subject,
    text,
    html: avecLogo ? html.replace(FRONT_LOGO_RE, `cid:${LOGO_CID}`) : html,
    attachments: avecLogo
      ? [{ filename: 'logo-afro-food.jpg', path: LOGO_PATH, cid: LOGO_CID, contentDisposition: 'inline' }]
      : [],
  });
  return { sent: true };
}

export async function envoyerEmailResetMotDePasse(email, resetToken, utilisateur = {}) {
  const front = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const lien = `${front}/mot-de-passe-oublie?token=${resetToken}`;
  return envoyerEmail({
    to: email,
    subject: 'Réinitialisation de votre mot de passe — Afro-food',
    text: `Bonjour,\n\nCliquez sur ce lien pour réinitialiser votre mot de passe (valide 1h) :\n${lien}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.`,
    html: passwordResetEmail(utilisateur.nom, utilisateur.prenom, resetToken),
  });
}

export async function envoyerEmailConfirmationCommande(email, commande) {
  const numero = commande.numeroCommande;
  const total = commande.montants?.total ?? '?';
  return envoyerEmail({
    to: email,
    subject: `Confirmation commande ${numero} — Afro-food`,
    text: `Merci pour votre commande ${numero}. Total : ${total} €.`,
    html: orderConfirmationEmail(commande, { ...commande.informationsClient, email }),
  });
}

const MESSAGES_STATUT = {
  confirmee: 'a été confirmée par notre équipe',
  en_preparation: 'est en cours de préparation',
  prete: 'est prête',
  en_livraison: 'est en route vers vous',
  livree: 'a été livrée, bon appétit',
  annulee: 'a été annulée',
  remboursee: 'a été remboursée',
};

export async function envoyerEmailStatutCommande(email, commande, commentaire) {
  const message = MESSAGES_STATUT[commande.statut];
  if (!message) return { sent: false, reason: 'statut_sans_notification' };

  const numero = commande.numeroCommande;
  const note = commentaire ? `\n\nMessage : ${commentaire}` : '';
  return envoyerEmail({
    to: email,
    subject: `Commande ${numero} — mise à jour — Afro-food`,
    text: `Votre commande ${numero} ${message}.${note}`,
    html: orderStatusEmail(commande, commande.statut, { ...commande.informationsClient, commentaire }),
  });
}

/** Prévient un livreur qu'une commande est prête à être récupérée. */
export async function envoyerEmailCommandePrete(email, commande) {
  const front = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const numero = commande.numeroCommande;
  const ville = commande.adresseLivraison?.ville || '';
  const lien = `${front}/livreur`;
  return envoyerEmail({
    to: email,
    subject: `Commande ${numero} prête à livrer — Afro-food`,
    text: `La commande ${numero}${ville ? ` (${ville})` : ''} est prête. Prenez-la en charge : ${lien}`,
    html: orderReadyCourierEmail(commande, lien),
  });
}

/** Prévient un admin qu'une nouvelle commande vient d'être passée. */
export async function envoyerEmailNouvelleCommandeAdmin(email, commande) {
  const front = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const numero = commande.numeroCommande;
  const total = commande.montants?.total ?? commande.total ?? '?';
  const client = [commande.informationsClient?.prenom, commande.informationsClient?.nom].filter(Boolean).join(' ');
  const lien = `${front}/commande-admin`;
  return envoyerEmail({
    to: email,
    subject: `Nouvelle commande ${numero} — ${total} €`,
    text: `Nouvelle commande ${numero}${client ? ` de ${client}` : ''} : ${total} €. À traiter : ${lien}`,
    html: newOrderAdminEmail(commande, lien),
  });
}

/** Alerte admin : un client a donné une mauvaise note (2 étoiles ou moins). */
export async function envoyerEmailAvisNegatif(email, commande, evaluation) {
  const front = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const client = [commande.informationsClient?.prenom, commande.informationsClient?.nom].filter(Boolean).join(' ');
  return envoyerEmail({
    to: email,
    subject: `Avis ${evaluation.note}/5 sur la commande ${commande.numeroCommande}`,
    text: `${client || 'Un client'} a noté la commande ${commande.numeroCommande} : ${evaluation.note}/5.${evaluation.commentaire ? ` Commentaire : ${evaluation.commentaire}` : ''} ${front}/admin-avis`,
    html: negativeReviewEmail(commande, evaluation),
  });
}

/** Remerciement après livraison, avec lien de notation. */
export async function envoyerEmailMerciLivraison(email, commande) {
  const front = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const id = commande._id || commande.id;
  return envoyerEmail({
    to: email,
    subject: `Merci pour votre commande ${commande.numeroCommande} — donnez-nous votre avis`,
    text: `Votre commande ${commande.numeroCommande} a été livrée. Merci ! Notez-la en un clic : ${front}/commande/${id}?noter=5`,
    html: thankYouEmail(commande, { ...commande.informationsClient, email }),
  });
}

/** Annonce du code promo offert (−10 % + livraison offerte). */
export async function envoyerEmailCodePromoMerci(email, commande, promo) {
  return envoyerEmail({
    to: email,
    subject: 'Un cadeau pour vous : −10 % et livraison offerte — Afro-food',
    text: `Merci pour votre commande ${commande.numeroCommande} ! Votre code ${promo.code} : −10 % et livraison offerte sur vos prochaines commandes.`,
    html: promoRewardEmail({ ...commande.informationsClient, email }, promo, commande),
  });
}

/** Code de remise (paiement en espèces) à donner au livreur. */
export async function envoyerEmailCodeRemise(email, commande, code) {
  return envoyerEmail({
    to: email,
    subject: `Votre code de remise ${code} — commande ${commande.numeroCommande}`,
    text: `Votre commande ${commande.numeroCommande} arrive. Donnez ce code au livreur lors du paiement en espèces : ${code}`,
    html: cashCodeEmail(commande, code),
  });
}

/** Reçu après paiement en espèces. */
export async function envoyerEmailRecuEspeces(email, commande, montant, livreurPrenom) {
  return envoyerEmail({
    to: email,
    subject: `Reçu de paiement — commande ${commande.numeroCommande}`,
    text: `Vous avez payé ${montant} € en espèces${livreurPrenom ? ` à ${livreurPrenom}` : ''} pour la commande ${commande.numeroCommande}.`,
    html: cashReceiptEmail(commande, montant, livreurPrenom),
  });
}

/** Paiement Stripe d'un virement enregistré : le client doit envoyer son justificatif. */
export async function envoyerEmailPaiementStripeVirement(email, commande) {
  const front = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  return envoyerEmail({
    to: email,
    subject: `Paiement enregistré — envoyez votre justificatif (${commande.numeroCommande})`,
    text: `Votre paiement de ${commande.total} € est enregistré. Téléchargez puis envoyez votre justificatif : ${front}/commande/${commande.id}`,
    html: stripeVirementEmail(commande),
  });
}

/** Prévient un livreur qu'une fiche de rémunération est disponible. */
export async function envoyerEmailFichePaie(email, prenom, fiche) {
  return envoyerEmail({
    to: email,
    subject: `Votre fiche de rémunération ${fiche.numero} est disponible`,
    text: `Votre fiche ${fiche.numero} (${fiche.du} au ${fiche.au}) : ${fiche.totalMontant} €. Consultez-la dans votre espace livreur.`,
    html: payslipEmail(prenom, fiche),
  });
}

/** Alerte admin : espèces non reversées par des livreurs. */
export async function envoyerEmailAlerteEspeces(email, lignes, delaiHeures) {
  const resume = lignes.map((l) => `${l.nom} : ${l.solde} € (depuis ${l.ageHeures} h)`).join(' · ');
  return envoyerEmail({
    to: email,
    subject: 'Espèces non reversées par des livreurs',
    text: `Soldes en retard : ${resume}`,
    html: cashAlertEmail(lignes, delaiHeures),
  });
}

/** Bienvenue après l'inscription, avec le code de la première commande. */
export async function envoyerEmailBienvenue(email, utilisateur, codePromo) {
  const front = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  return envoyerEmail({
    to: email,
    subject: 'Bienvenue chez Afro-food — votre code de bienvenue',
    text: `Bienvenue ${utilisateur.prenom} ! Votre code ${codePromo} offre 5 % sur votre première commande : ${front}/catalogue`,
    html: welcomeEmail(utilisateur.nom, utilisateur.prenom, codePromo),
  });
}

/** Réponse de l'équipe à un message du formulaire de contact (le client peut répondre directement). */
export async function envoyerEmailReponseContact(message, reponse, auteur) {
  const support = process.env.SUPPORT_EMAIL || undefined;
  return envoyerEmail({
    to: message.email,
    replyTo: support,
    subject: `Re : ${message.sujet} — Afro-food`,
    text: `Bonjour ${message.nom},\n\n${reponse}\n\n${auteur || "L'équipe Afro-food"}\n\n— Votre message : ${message.message}`,
    html: contactReplyEmail({ nom: message.nom, sujet: message.sujet, messageOriginal: message.message, reponse, auteur }),
  });
}
