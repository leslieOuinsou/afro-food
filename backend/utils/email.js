import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import path from 'path';
import { orderConfirmationEmail, orderStatusEmail, passwordResetEmail } from './emailTemplates.js';

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
