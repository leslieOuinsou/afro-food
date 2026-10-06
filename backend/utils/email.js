import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import path from 'path';
import {
  orderConfirmationEmail,
  orderStatusEmail,
  passwordResetEmail,
  thankYouEmail,
  promoRewardEmail,
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
export async function envoyerEmail({ to, subject, html, text }) {
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
    html: `<p>La commande <strong>${numero}</strong>${ville ? ` (${ville})` : ''} est <strong>prête</strong>.</p><p><a href="${lien}">Ouvrir mon espace livreur</a></p>`,
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
    html: `<p><strong>Nouvelle commande ${numero}</strong>${client ? ` de ${client}` : ''}.</p><p>Total : <strong>${total}&nbsp;€</strong></p><p><a href="${lien}">Ouvrir la gestion des commandes</a></p>`,
  });
}

/** Alerte admin : un client a donné une mauvaise note (2 étoiles ou moins). */
export async function envoyerEmailAvisNegatif(email, commande, evaluation) {
  const front = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const client = [commande.informationsClient?.prenom, commande.informationsClient?.nom].filter(Boolean).join(' ');
  const echapper = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const etoiles = '★'.repeat(evaluation.note) + '☆'.repeat(5 - evaluation.note);
  return envoyerEmail({
    to: email,
    subject: `Avis ${evaluation.note}/5 sur la commande ${commande.numeroCommande}`,
    text: `${client || 'Un client'} a noté la commande ${commande.numeroCommande} : ${evaluation.note}/5.${evaluation.commentaire ? ` Commentaire : ${evaluation.commentaire}` : ''} ${front}/admin-avis`,
    html: `<p><strong>${echapper(client) || 'Un client'}</strong> a noté la commande <strong>${echapper(commande.numeroCommande)}</strong> :</p><p style="font-size:26px;color:#C2610F;margin:6px 0;">${etoiles}</p>${evaluation.commentaire ? `<blockquote style="margin:12px 0;padding:10px 14px;border-left:4px solid #C2610F;background:#F4EBDD;">${echapper(evaluation.commentaire)}</blockquote>` : '<p><em>Sans commentaire.</em></p>'}<p><a href="${front}/admin-avis">Voir tous les avis</a></p>`,
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
